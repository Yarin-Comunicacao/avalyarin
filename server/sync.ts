
import { getDb } from "./db";
import { establishments, menuItems } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { adminAddMenuItem } from "./db-admin-estab";

/**
 * ROTA DE SINCRONIZAÇÃO PADRÃO
 * Sincroniza automaticamente imagens e cardápios da fonte legada para o banco de dados.
 * Utiliza a camada administrativa para garantir geração de códigos e visibilidade.
 */

export async function syncEstablishmentData(establishmentId: number | null, slug: string) {
  const db = await getDb();
  if (!db) return;

  try {
    let targetId = establishmentId;

    // 1. Se não temos ID, tentamos encontrar pelo slug no banco
    if (!targetId) {
      const [existing] = await db.select({ id: establishments.id })
        .from(establishments)
        .where(eq(establishments.slug, slug))
        .limit(1);
      if (existing) {
        targetId = existing.id;
      }
    }

    // 2. Se ainda não temos ID, o estabelecimento pode não existir no TiDB. 
    // Vamos prosseguir para a busca na fonte legada e criar se necessário.
    
    if (targetId) {
      const [stats] = await db.select({ count: sql<number>`count(*)` })
        .from(menuItems)
        .where(eq(menuItems.establishmentId, targetId));

      const itemCount = stats ? Number(stats.count) : 0;
      if (itemCount > 0) {
        return;
      }
    }

    console.log(`[Sync] Iniciando sincronização padrão para: ${slug} (ID Atual: ${targetId || 'Novo'})`);

    // 2. Importar fonte de dados legada
    console.log(`[Sync] Carregando fonte de dados legada...`);
    const dataModule = await import("./lib/data_source");
    const sourceCategories = dataModule.categories || [];
    
    let sourceEst = null;
    const normalizedSlug = slug.toLowerCase().trim();

    // Tenta encontrar por slug exato ou slug parcial (contido no ID legado)
    for (const cat of sourceCategories) {
      const found = cat.establishments?.find((e: any) => {
        const sourceId = e.id.toLowerCase().trim();
        return sourceId === normalizedSlug || normalizedSlug.includes(sourceId) || sourceId.includes(normalizedSlug);
      });
      if (found) {
        sourceEst = found;
        break;
      }
    }

    // Se não encontrou, tenta uma busca mais agressiva por nome (aproximado)
    if (!sourceEst) {
      const cleanSlug = slug.replace(/-/g, ' ').toLowerCase();
      for (const cat of sourceCategories) {
        const found = cat.establishments?.find((e: any) => {
          const cleanName = e.name.toLowerCase();
          return cleanName.includes(cleanSlug) || cleanSlug.includes(cleanName);
        });
        if (found) {
          sourceEst = found;
          break;
        }
      }
    }

    if (!sourceEst) {
      console.log(`[Sync] Nenhum dado encontrado na fonte legada para o slug/id: ${slug}`);
      return;
    }

    // 3. Criar estabelecimento se não existir
    if (!targetId) {
      console.log(`[Sync] Criando novo estabelecimento: ${sourceEst.name}`);
      const { adminAddEstablishment } = await import("./db-admin-estab");
      const newEst = await adminAddEstablishment({
        name: sourceEst.name,
        slug: slug,
        address: sourceEst.address,
        neighborhood: sourceEst.neighborhood,
        lat: sourceEst.lat,
        lng: sourceEst.lng,
        image: sourceEst.image,
        hours: sourceEst.hours,
        phone: sourceEst.phone,
        instagram: sourceEst.instagram,
        categoryName: sourceEst.category || "Restaurante", // Categoria padrão se não houver
      });
      if (newEst && (newEst as any).id) {
        targetId = (newEst as any).id;
      } else {
        console.error(`[Sync] Falha ao criar estabelecimento ${slug}`);
        return;
      }
    } else {
      // 4. Sincronizar Imagem se já existir mas estiver sem imagem
      if (sourceEst.image) {
        await db.update(establishments)
          .set({ image: sourceEst.image })
          .where(eq(establishments.id, targetId));
      }
    }

    // 5. Sincronizar Cardápio via camada Admin (com geração de código segura para lote)
    if (sourceEst.menu && sourceEst.menu.length > 0) {
      console.log(`[Sync] Importando ${sourceEst.menu.length} itens para ${slug} (ID: ${targetId})`);
      
      const { ensureMenuCategory } = await import("./db-admin-estab");
      const { syncEstablishmentVisibility } = await import("./db");

      for (const item of sourceEst.menu) {
        const finalCategory = item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : "Outros";
        const itemCode = `mi${Math.floor(Math.random() * 900000 + 100000)}`;
        const autoTags = (item.name || "").toLowerCase().split(" ").filter((t: string) => t.length > 2);

        await db.insert(menuItems).values({
          establishmentId: targetId!,
          code: itemCode,
          name: item.name,
          description: item.description || null,
          price: typeof item.price === 'number' ? item.price : 0,
          category: finalCategory,
          imageUrl: item.image || null,
          tags: autoTags,
        });

        if (finalCategory) {
          await ensureMenuCategory(targetId!, finalCategory);
        }
      }
      
      // Atualizar flag hasMenu e visibilidade
      await db.update(establishments)
        .set({ hasMenu: true })
        .where(eq(establishments.id, targetId!));
      
      await syncEstablishmentVisibility(targetId!);
      
      console.log(`[Sync] Cardápio de ${slug} sincronizado com sucesso.`);
    }

  } catch (error) {
    console.error(`[Sync] Falha na sincronização padrão de ${slug}:`, error);
  }
}
