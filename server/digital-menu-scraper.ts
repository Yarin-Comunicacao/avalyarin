import axios from "axios";
import { eq, sql } from "drizzle-orm";
import { menuCategories, menuItems } from "../drizzle/schema";
import { generateCode } from "./db";
import { extractMenuWithOcr } from "./smart-menu-ocr";

const GETIN_HOSTS = new Set(["menu.getin.app", "www.menu.getin.app"]);
const GETIN_API_BASE = "https://user.getinapis.com";
const REQUEST_TIMEOUT_MS = 20_000;

/** Normaliza links colados de planilhas, incluindo aspas e espaços acidentais. */
export function normalizeMenuUrl(value: unknown): string | null {
  const raw = String(value ?? "").trim().replace(/^['\"]|['\"]$/g, "").trim();
  if (!raw) return null;
  const candidate = /^www\./i.test(raw) ? `https://${raw}` : raw;
  try {
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function splitMenuUrls(value: unknown): string[] {
  return Array.from(new Set(String(value ?? "").split(/[\n;,]+/).map(normalizeMenuUrl).filter((url): url is string => Boolean(url))));
}

export function getMenuProvider(sourceUrl: string): "getin" | "external" {
  try {
    return GETIN_HOSTS.has(new URL(sourceUrl).hostname.toLowerCase()) ? "getin" : "external";
  } catch {
    return "external";
  }
}

type GetInMenu = { id: string; title?: string };
type GetInItem = { id?: string; title?: string; description?: string; price?: number | string; images?: Array<{ url?: string } | string>; tags?: string[] };
type GetInCategory = { id: string; title?: string; items?: GetInItem[] };

export type DigitalMenuItem = {
  category: string;
  name: string;
  description: string | null;
  price: number | null;
  imageUrl: string | null;
  tags: string[];
};

export type DigitalMenuExtraction = {
  provider: "getin" | "url";
  sourceUrl: string;
  menus: number;
  categories: number;
  items: DigitalMenuItem[];
};

/**
 * Lê uma URL pública de cardápio. Serviços como Drive, Canva, Pedidon e
 * Acuolina normalmente entregam uma página HTML; nesse caso localizamos o
 * PDF/imagem público incorporado e enviamos todas as páginas ao OCR.
 */
export async function extractMenuFromUrl(sourceUrl: string): Promise<DigitalMenuExtraction> {
  const normalized = normalizeMenuUrl(sourceUrl);
  if (!normalized) throw new Error("Link de cardápio inválido.");
  const response = await axios.get<ArrayBuffer>(normalized, {
    timeout: REQUEST_TIMEOUT_MS,
    responseType: "arraybuffer",
    maxContentLength: 50 * 1024 * 1024,
    validateStatus: status => status >= 200 && status < 400,
    headers: { Accept: "text/html,application/pdf,image/*,*/*;q=0.8", "User-Agent": "AvalyarinMenuImporter/1.0" },
  });
  const contentType = String(response.headers["content-type"] || "").split(";", 1)[0].toLowerCase();
  const bytes = Buffer.from(response.data);
  const isDirectFile = contentType === "application/pdf" || contentType.startsWith("image/") || bytes.subarray(0, 4).toString("ascii") === "%PDF";
  let sources = [normalized];
  const driveFileId = normalized.match(/drive\.google\.com\/file\/d\/([^/]+)/i)?.[1];
  if (driveFileId) sources = [`https://drive.google.com/uc?export=download&id=${encodeURIComponent(driveFileId)}`];
  if (!isDirectFile && contentType.includes("html")) {
    const html = bytes.toString("utf8");
    const candidates = Array.from(html.matchAll(/(?:href|src|data-src|content)=["']([^"']+)["']/gi))
      .map(match => { try { return new URL(match[1], normalized).toString(); } catch { return null; } })
      .filter((url): url is string => Boolean(url))
      .filter(url => /\.(?:pdf|png|jpe?g|webp)(?:[?#].*)?$/i.test(url) || /(?:download|export|image|preview)/i.test(url));
    if (candidates.length > 0) sources = Array.from(new Set(candidates)).slice(0, 50);
  }
  if (sources.length === 0) throw new Error("A página não expôs um PDF ou imagem pública do cardápio.");
  const extracted = await extractMenuWithOcr(sources.map(url => ({ url })), 1, 1);
  const items = extracted.sections.flatMap(section => section.items.map(item => ({
    category: section.name.slice(0, 64), name: item.name, description: item.description || null,
    price: item.price == null ? null : Number(item.price), imageUrl: null, tags: [],
  })));
  if (items.length === 0) throw new Error("Não foi possível identificar itens no cardápio público.");
  return { provider: "url", sourceUrl: normalized, menus: 1, categories: extracted.sections.length, items };
}

function cleanText(value: unknown, maxLength: number): string | null {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text ? text.slice(0, maxLength) : null;
}

function parsePrice(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    // Get In returns monetary values in cents (e.g. 4100 = R$ 41,00 and 250 = R$ 2,50).
    return value / 100;
  }
  const text = String(value ?? "").replace(/[^0-9,.-]/g, "").trim();
  if (!text) return null;
  const normalized = text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function getInIds(sourceUrl: string): { unitId: string; menuId?: string } {
  const url = new URL(sourceUrl);
  if (!GETIN_HOSTS.has(url.hostname.toLowerCase())) throw new Error("Somente links públicos do Get In são aceitos para importação automática.");
  const parts = url.pathname.split("/").filter(Boolean);
  const menuIndex = parts.indexOf("menus");
  const unitId = menuIndex > 0 ? parts[menuIndex - 1] : parts[1];
  const menuId = menuIndex >= 0 ? parts[menuIndex + 1] : undefined;
  if (!unitId) throw new Error("Não foi possível identificar a unidade no link do Get In.");
  return { unitId, menuId };
}

async function getJson<T>(path: string): Promise<T> {
  const response = await axios.get<T>(`${GETIN_API_BASE}${path}`, {
    timeout: REQUEST_TIMEOUT_MS,
    responseType: "json",
    headers: { Accept: "application/json", "User-Agent": "AvalyarinMenuImporter/1.0" },
    validateStatus: status => status >= 200 && status < 300,
  });
  return response.data;
}

export async function extractGetInMenu(sourceUrl: string): Promise<DigitalMenuExtraction> {
  const { unitId, menuId: requestedMenuId } = getInIds(sourceUrl);
  const menusResponse = await getJson<{ success?: boolean; data?: GetInMenu[] }>(`/menu/v1/units/${encodeURIComponent(unitId)}/menus?pagination=0`);
  const menus = Array.isArray(menusResponse.data) ? menusResponse.data : [];
  if (!menus.length) throw new Error("O Get In não retornou nenhum menu publicado para este estabelecimento.");

  // A URL pode apontar para uma sessão específica. Para não perder A la Carte ou outras sessões,
  // a importação consulta todos os menus publicados da unidade.
  const selectedMenus = requestedMenuId ? menus : menus;
  const sections: DigitalMenuItem[] = [];
  const seen = new Set<string>();
  let categoryCount = 0;

  for (const menu of selectedMenus) {
    const response = await getJson<{ success?: boolean; data?: GetInCategory[] }>(
      `/menu/v1/units/${encodeURIComponent(unitId)}/menus/${encodeURIComponent(menu.id)}/categories?pagination=0`
    );
    const categories = Array.isArray(response.data) ? response.data : [];
    categoryCount += categories.length;
    for (const category of categories) {
      const categoryTitle = cleanText(category.title, 128) || "Outros";
      const menuTitle = cleanText(menu.title, 64);
      const sectionTitle = menuTitle && menuTitle !== categoryTitle ? `${menuTitle} · ${categoryTitle}` : categoryTitle;
      for (const rawItem of category.items || []) {
        const name = cleanText(rawItem.title, 255);
        if (!name) continue;
        const key = `${sectionTitle.toLocaleLowerCase("pt-BR")}::${name.toLocaleLowerCase("pt-BR")}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const firstImage = rawItem.images?.[0];
        const imageUrl = typeof firstImage === "string" ? firstImage : firstImage?.url;
        sections.push({
          category: sectionTitle.slice(0, 64),
          name,
          description: cleanText(rawItem.description, 1000),
          price: parsePrice(rawItem.price),
          imageUrl: cleanText(imageUrl, 2000),
          tags: Array.isArray(rawItem.tags) ? rawItem.tags.map(tag => cleanText(tag, 64)).filter(Boolean) as string[] : [],
        });
      }
    }
  }

  if (!sections.length) throw new Error("O Get In não retornou itens de cardápio publicados.");
  return { provider: "getin", sourceUrl, menus: selectedMenus.length, categories: categoryCount, items: sections };
}

export async function persistDigitalMenu(db: any, establishmentId: number, extraction: DigitalMenuExtraction) {
  const categoryNames = Array.from(new Set(extraction.items.map(item => item.category)));
  const [categoryMax] = await db.select({ maxId: sql<number>`COALESCE(MAX(id), 0)` }).from(menuCategories);
  const [itemMax] = await db.select({ maxId: sql<number>`COALESCE(MAX(id), 0)` }).from(menuItems);
  let categoryId = Number(categoryMax?.maxId || 0) + 1;
  let itemId = Number(itemMax?.maxId || 0) + 1;
  const categoryRows = categoryNames.map((name, index) => ({ id: categoryId++, establishmentId, name, sortOrder: index }));
  const categoryByName = new Map(categoryRows.map(row => [row.name, row.id]));
  const itemRows = [];
  for (const item of extraction.items) {
    itemRows.push({
      id: itemId++,
      code: await generateCode("menu_items"),
      establishmentId,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      imageUrl: item.imageUrl,
      tags: item.tags.length ? item.tags : null,
    });
  }
  if (categoryRows.length) await db.insert(menuCategories).values(categoryRows);
  if (itemRows.length) await db.insert(menuItems).values(itemRows);
  return { categories: categoryRows.length, items: itemRows.length };
}
