
import { getDb } from "./db";
import { establishments, menuItems } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { adminAddMenuItem } from "./db-admin-estab";

/**
 * ROTA DE SINCRONIZAÇÃO PADRÃO
 * Sincroniza automaticamente imagens e cardápios da fonte legada para o banco de dados.
 * Utiliza a camada administrativa para garantir geração de códigos e visibilidade.
 */

export async function syncEstablishmentData(establishmentId: number, slug: string) {
  const db = await getDb();
  if (!db) return;

  try {
    // 1. Verificar se o cardápio já está completo
    const [stats] = await db.select({ count: sql<number>`count(*)` })
      .from(menuItems)
      .where(eq(menuItems.establishmentId, establishmentId));

    if (stats && stats.count > 0) {
      return;
    }

    console.log(`[Sync] Iniciando sincronização padrão para: ${slug} (${establishmentId})`);

    // 2. Importar fonte de dados legada
    const dataModule = await import("./lib/data_source");
    const sourceCategories = dataModule.categories || [];
    
    let sourceEst = null;
    // Tenta encontrar por slug exato ou slug parcial (contido no ID legado)
    for (const cat of sourceCategories) {
      const found = cat.establishments?.find((e: any) => {
        // e.id na fonte legada costuma ser o slug curto ou o ID
        return e.id === slug || slug.includes(e.id) || e.id.includes(slug);
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

    // 3. Sincronizar Imagem do Estabelecimento
    if (sourceEst.image) {
      await db.update(establishments)
        .set({ image: sourceEst.image })
        .where(eq(establishments.id, establishmentId));
    }

    // 4. Sincronizar Cardápio via camada Admin
    if (sourceEst.menu && sourceEst.menu.length > 0) {
      console.log(`[Sync] Importando ${sourceEst.menu.length} itens via Admin Layer para ${slug}`);
      
      for (const item of sourceEst.menu) {
        await adminAddMenuItem({
          establishmentId,
          name: item.name,
          description: item.description || undefined,
          price: typeof item.price === 'number' ? item.price : 0,
          category: item.category || "Outros",
          imageUrl: item.image || undefined,
        });
      }
      
      console.log(`[Sync] Cardápio de ${slug} sincronizado com sucesso.`);
    }

  } catch (error) {
    console.error(`[Sync] Falha na sincronização padrão de ${slug}:`, error);
  }
}
