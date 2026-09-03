import axios from "axios";
import { sql } from "drizzle-orm";
import { chromium, type Browser } from "playwright";
import { createWorker, PSM } from "tesseract.js";
import { menuCategories, menuItems } from "../drizzle/schema";
import { generateCode } from "./db";
import { extractMenuWithOcr, hasAcceptableMenuQuality, parseMenuText } from "./smart-menu-ocr";

const GETIN_HOSTS = new Set(["menu.getin.app", "www.menu.getin.app"]);
const GETIN_API_BASE = "https://user.getinapis.com";
const REQUEST_TIMEOUT_MS = 75_000;
const BROWSER_NAV_TIMEOUT_MS = 45_000;
const MAX_CANVA_PAGES = 40;

// ---------------------------------------------------------------------------
// Navegador headless (Playwright/Chromium)
//
// A maioria das plataformas de cardápio digital modernas (Pedidon, Namesa,
// Odionísio, Clicksi, além de sites institucionais em React/Vue) só
// renderiza o conteúdo no navegador via JavaScript. Um axios.get() simples
// recebe apenas a "casca" vazia do HTML, sem os itens do cardápio — essa
// era a causa raiz da maior parte das falhas de leitura.
//
// O navegador é reaproveitado entre chamadas (singleton "lazy") para não
// pagar o custo de abrir um Chromium inteiro a cada estabelecimento de uma
// importação em massa. Chame closeMenuBrowser() ao final de um job em lote
// se quiser liberar o processo explicitamente (ex.: ao terminar de
// processar toda a planilha).
//
// IMPORTANTE (deploy): é preciso adicionar "playwright" ao package.json e
// rodar `npx playwright install --with-deps chromium` no build do servidor
// (ver instruções após o código).
// ---------------------------------------------------------------------------
let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return browserPromise;
}

export async function closeMenuBrowser(): Promise<void> {
  if (!browserPromise) return;
  const pending = browserPromise;
  browserPromise = null;
  const browser = await pending;
  await browser.close().catch(() => {});
}

type RenderedPage = {
  html: string;
  text: string;
  links: Array<{ href: string; text: string }>;
};

/**
 * Abre a URL em uma aba headless, espera o app JS terminar de renderizar e
 * devolve o HTML final, o texto visível da página e todos os links — com o
 * texto do botão, não só o href (isso é o que permite identificar um botão
 * "Cardápio" que aponte para um link curto, por exemplo).
 */
async function renderPage(url: string, waitSelector?: string): Promise<RenderedPage> {
  const browser = await getBrowser();
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 AvalyarinMenuImporter",
    viewport: { width: 1366, height: 900 },
  });
  const page = await context.newPage();
  try {
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: BROWSER_NAV_TIMEOUT_MS });
    } catch {
      // Alguns apps mantêm conexões abertas (websocket/polling) e nunca
      // atingem "networkidle"; nesse caso aceitamos o "load" básico.
      await page.goto(url, { waitUntil: "load", timeout: BROWSER_NAV_TIMEOUT_MS });
    }
    if (waitSelector) {
      await page.waitForSelector(waitSelector, { timeout: 8_000 }).catch(() => {});
    }
    // Pequena espera adicional para animações e fetch tardio do cardápio.
    await page.waitForTimeout(1_500);
    const html = await page.content();
    const text = await page.evaluate(() => document.body?.innerText || "");
    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a[href]")).map(anchor => ({
        href: (anchor as HTMLAnchorElement).href,
        text: (anchor.textContent || "").trim(),
      }))
    );
    return { html, text, links };
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
  }
}

/** Roda OCR direto em buffers de imagem (screenshots), sem precisar de uma URL pública. */
async function ocrImageBuffers(buffers: Buffer[]): Promise<string> {
  if (!buffers.length) return "";
  const worker = await createWorker("por");
  try {
    await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO, preserve_interword_spaces: "1" });
    const texts: string[] = [];
    for (const buffer of buffers) {
      const result = await worker.recognize(buffer);
      texts.push(result.data.text);
    }
    return texts.join("\n");
  } finally {
    await worker.terminate();
  }
}

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

function localized(value: any): string {
  if (typeof value === "string") return value;
  return String(value?.pt || value?.["pt-BR"] || value?.en || value?.es || "");
}

function makeExtraction(sourceUrl: string, rows: Array<{ category: string; name: string; description?: string | null; price?: unknown; imageUrl?: string | null }>): DigitalMenuExtraction {
  const items = rows.filter(row => row.name.trim()).map(row => ({
    category: row.category.trim().slice(0, 64) || "Outros",
    name: row.name.trim().slice(0, 255),
    description: cleanText(row.description, 1000),
    price: parsePrice(row.price), imageUrl: cleanText(row.imageUrl, 2000), tags: [],
  }));
  if (!items.length) throw new Error("A plataforma não retornou itens publicados.");
  return { provider: "url", sourceUrl, menus: 1, categories: new Set(items.map(item => item.category)).size, items };
}

async function extractLiveMenu(sourceUrl: string, venueId: string): Promise<DigitalMenuExtraction> {
  const response = await axios.get<any>(`https://customers.tagme.com.br/dine-in/menu/${encodeURIComponent(venueId)}/Dine-in?ignoreDisabled=1`, { timeout: REQUEST_TIMEOUT_MS });
  const menu = Array.isArray(response.data) ? response.data[0] : response.data;
  const rows: Array<{ category: string; name: string; description?: string | null; price?: unknown; imageUrl?: string | null }> = [];
  for (const section of [...(menu?.menuItems || []), ...(menu?.menus || [])]) {
    const category = localized(section.name) || localized(section.title) || "Outros";
    for (const item of section.menuItems || []) rows.push({ category, name: localized(item.name), description: localized(item.descript), price: item.promoPriceEnabled ? item.promoPrice : item.price, imageUrl: item.avatarUrl ? `https://static.tagme.com.br/pubimg/thumbs/${item.avatarUrl}` : null });
  }
  return makeExtraction(sourceUrl, rows);
}

async function extractDGuestsMenu(sourceUrl: string, username: string): Promise<DigitalMenuExtraction> {
  const response = await axios.get<any>(`https://dguests-api.com/prod2/getUsoCardapio/${encodeURIComponent(username)}`, { timeout: REQUEST_TIMEOUT_MS });
  const categories = response.data?.categoria || [];
  const rows = categories.flatMap((category: any) => (category.estFinProdutos || []).map((item: any) => ({
    category: String(category.titulo || "Outros"), name: String(item.titulo || ""), description: item.detalhe || null,
    price: item.preco_promo && Number(item.preco_promo) > 0 ? item.preco_promo : item.preco,
    imageUrl: item.foto ? `https://www.dg-media.com.br/cardapio/${item.foto}` : null,
  })));
  return makeExtraction(sourceUrl, rows);
}

async function extractGarcomWebMenu(sourceUrl: string, storeId: string): Promise<DigitalMenuExtraction> {
  const response = await axios.post<any>("https://garcomweb.com.br/office/AutoAtendimento/GetDadosApp/", {
    IdLoja: Number(storeId), LocalPedido: "CARDAPIO DIGITAL",
  }, { timeout: REQUEST_TIMEOUT_MS, headers: { "Content-Type": "application/json" } });
  const products = Array.isArray(response.data?.Cardapio?.Produtos) ? response.data.Cardapio.Produtos : [];
  const rows = products.filter((item: any) => !Number(item.desativado) && !Number(item.nao_visualizar)).map((item: any) => ({
    category: [item.grupo, item.subgrupo].filter(Boolean).join(" / ") || "Outros",
    name: String(item.descricao || item.nome || ""),
    description: item.descricao_ecommerce || null,
    price: String(item.preco_app ?? item.valor_venda ?? item.preco ?? ""),
  }));
  return makeExtraction(sourceUrl, rows);
}

async function extractPiccoMenu(sourceUrl: string): Promise<DigitalMenuExtraction> {
  const pages = await axios.get<any[]>("https://opicco.com.br/wp-json/wp/v2/pages?slug=cardapio&per_page=10", { timeout: REQUEST_TIMEOUT_MS });
  const english = await axios.get<any[]>("https://opicco.com.br/wp-json/wp/v2/pages?slug=picco-menu&per_page=10", { timeout: REQUEST_TIMEOUT_MS });
  const html = [...pages.data, ...english.data].map(page => page.content?.rendered || "").join("\n");
  const images = Array.from(html.matchAll(/(?:src|data-src)=["']([^"']+\.(?:png|jpe?g|webp)(?:\?[^"']*)?)["']/gi))
    .map(match => match[1].replace(/-\d+x\d+(?=\.(?:png|jpe?g|webp))/i, ""));
  const uniqueImages = Array.from(new Set(images)).slice(0, 30);
  if (!uniqueImages.length) throw new Error("A API do Picco não retornou imagens do cardápio.");
  const extracted = await extractMenuWithOcr(uniqueImages.map(url => ({ url })), 1, 1);
  return makeExtraction(sourceUrl, extracted.sections.flatMap(section => section.items.map(item => ({
    category: section.name, name: item.name, description: item.description, price: item.price,
  }))));
}

/**
 * Clicksi (cardapio.clicksi.com.br) não tem API pública documentada. Em vez
 * de tentar adivinhar endpoints internos, renderizamos a página com o
 * navegador headless e lemos o texto visível — funciona desde que o
 * cardápio seja texto real na tela (não canvas/imagem). Se no futuro
 * descobrirmos a API real do Clicksi, é só trocar o corpo desta função por
 * uma chamada direta, como já fizemos com Get In, dGuests e GarçomWeb.
 */
async function extractClicksiMenu(sourceUrl: string): Promise<DigitalMenuExtraction> {
  const rendered = await renderPage(sourceUrl);
  const textMenu = parseMenuText(rendered.text);
  if (!hasAcceptableMenuQuality(textMenu)) {
    throw new Error("O Clicksi não expôs itens de cardápio legíveis nesta página (integração é por leitura de tela, não por API dedicada).");
  }
  return makeExtraction(sourceUrl, textMenu.sections.flatMap(section => section.items.map(item => ({
    category: section.name, name: item.name, description: item.description, price: item.price,
  }))));
}

/**
 * Canva ("/design/.../view") não expõe as páginas do cardápio no HTML
 * estático — só uma miniatura da primeira página (usada como preview de
 * link em redes sociais), que era exatamente o bug relatado: "fica só na
 * primeira página". Aqui navegamos pelo visualizador do Canva com o
 * navegador headless, avançamos página por página com a seta direita do
 * teclado e tiramos um print de cada uma, até o layout parar de mudar.
 *
 * Atenção: os seletores/atalhos do visualizador do Canva podem mudar sem
 * aviso; se o Canva alterar a interface pública de visualização, esta
 * função pode precisar de ajuste (ela já foi escrita para degradar bem:
 * se só existir 1 página, funciona igual a hoje, só que via OCR).
 */
async function extractCanvaMenu(sourceUrl: string): Promise<DigitalMenuExtraction> {
  const browser = await getBrowser();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const screenshots: Buffer[] = [];
  try {
    await page.goto(sourceUrl, { waitUntil: "load", timeout: BROWSER_NAV_TIMEOUT_MS });
    await page.waitForTimeout(2_000);
    // Fecha eventual modal de "Fazer login" que o Canva sobrepõe ao design.
    await page.keyboard.press("Escape").catch(() => {});
    let previousSignature: string | null = null;
    for (let index = 0; index < MAX_CANVA_PAGES; index += 1) {
      const shot = await page.screenshot({ type: "png" });
      const signature = shot.toString("base64").slice(0, 512);
      // Se a captura repetir a anterior, chegamos ao fim do design (a seta
      // "próxima página" parou de mudar a tela).
      if (signature === previousSignature) break;
      previousSignature = signature;
      screenshots.push(shot);
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(700);
    }
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
  }
  if (!screenshots.length) throw new Error("Não foi possível capturar nenhuma página do design do Canva.");
  const text = await ocrImageBuffers(screenshots);
  const textMenu = parseMenuText(text);
  if (!hasAcceptableMenuQuality(textMenu)) {
    throw new Error(`O Canva expôs ${screenshots.length} página(s) capturada(s), mas o OCR não identificou itens de cardápio com confiança suficiente.`);
  }
  return makeExtraction(sourceUrl, textMenu.sections.flatMap(section => section.items.map(item => ({
    category: section.name, name: item.name, description: item.description, price: item.price,
  }))));
}

function htmlToMenuText(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\s*\/?\s*(p|div|section|article|li|h[1-6]|br|tr)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, "\n");
}

/**
 * Linktree: descobre o link real do cardápio dentre os botões da página.
 * Além de olhar palavras-chave na própria URL (comportamento antigo),
 * agora também lê o TEXTO do botão ("Cardápio", "Ver Menu"...) — isso
 * resolve o caso de um botão de cardápio apontar para um link curto
 * (bit.ly etc.) sem nenhuma palavra-chave reconhecível na URL.
 */
async function extractLinktreeMenu(sourceUrl: string): Promise<DigitalMenuExtraction> {
  const page = await axios.get<string>(sourceUrl, { timeout: REQUEST_TIMEOUT_MS, headers: { "User-Agent": "Mozilla/5.0" } });
  const html = page.data;

  const KEYWORD_RE = /(?:menu|cardap|drive\.google\.com|canva\.com|clicksi|livemenu|dguests|garcomweb|getin\.app)/i;
  const TEXT_RE = /cardap|menu/i;

  const rawLinks = Array.from(html.matchAll(/https?:\/\/[^"'\\\s<>]+/gi)).map(match => match[0].replace(/\\u0026/g, "&"));
  const candidates = new Set(rawLinks.filter(link => KEYWORD_RE.test(link)));

  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(anchorPattern)) {
    const href = match[1].replace(/\\u0026/g, "&");
    const text = match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (TEXT_RE.test(text)) {
      try { candidates.add(new URL(href, sourceUrl).toString()); } catch { /* href inválido, ignora */ }
    }
  }

  const menuLinks = Array.from(candidates);
  if (!menuLinks.length) throw new Error("nenhum link de cardápio encontrado (nem por palavra-chave na URL, nem pelo texto do botão)");

  let lastError = "nenhum link de cardápio encontrado";
  for (const link of menuLinks.slice(0, 20)) {
    try { return await extractMenuFromUrl(link); } catch (error: any) { lastError = String(error?.message || error); }
  }
  throw new Error(`O Linktree não expôs um cardápio legível (${lastError.slice(0, 180)}).`);
}

/**
 * Lê uma URL pública de cardápio.
 *
 * Ordem de tentativas:
 *  1. Linktree → resolve o link real do cardápio e recursa.
 *  2. Provedores com API dedicada (Get In é tratado à parte pelo chamador;
 *     aqui: LiveMenu/TagMe, dGuests, GarçomWeb, Picco, Clicksi, Canva).
 *  3. HTML estático (axios) — barato, cobre sites institucionais comuns.
 *  4. Navegador headless — cobre SPAs (Pedidon, Namesa, Odionísio etc.) e
 *     também revela PDFs/imagens que só aparecem no DOM depois do JS rodar.
 *  5. Último recurso: print de tela inteira + OCR.
 */
export async function extractMenuFromUrl(sourceUrl: string): Promise<DigitalMenuExtraction> {
  const normalized = normalizeMenuUrl(sourceUrl);
  if (!normalized) throw new Error("Link de cardápio inválido.");
  const url = new URL(normalized);
  const host = url.hostname.toLowerCase().replace(/^www\./, "");

  if (host === "linktr.ee") return extractLinktreeMenu(normalized);

  const liveMenuId = host === "livemenu.app" ? url.pathname.match(/\/menu\/([^/]+)/i)?.[1] : null;
  if (liveMenuId) return extractLiveMenu(normalized, liveMenuId);

  const dGuestsUser = host === "dguests.com.br" ? url.pathname.match(/\/cardapio\/([^/]+)/i)?.[1] : null;
  if (dGuestsUser) return extractDGuestsMenu(normalized, dGuestsUser);

  const garcomStoreId = host === "garcomweb.com.br" ? url.pathname.match(/\/loja\/(\d+)/i)?.[1] : null;
  if (garcomStoreId) return extractGarcomWebMenu(normalized, garcomStoreId);

  if (host === "opicco.com.br" && /\/cardapio\/?$/i.test(url.pathname)) return extractPiccoMenu(normalized);

  if (host === "clicksi.com.br" || host.endsWith(".clicksi.com.br")) return extractClicksiMenu(normalized);

  if (host === "canva.com" && /^\/design\//i.test(url.pathname)) return extractCanvaMenu(normalized);

  // --- Caminho genérico: tenta o jeito barato primeiro (HTML estático) ---
  const response = await axios.get<ArrayBuffer>(normalized, {
    timeout: REQUEST_TIMEOUT_MS,
    responseType: "arraybuffer",
    maxContentLength: 50 * 1024 * 1024,
    validateStatus: status => status >= 200 && status < 400,
    headers: { Accept: "text/html,application/pdf,image/*,*/*;q=0.8", "User-Agent": "AvalyarinMenuImporter/1.0" },
  });
  const contentType = String(response.headers["content-type"] || "").split(";", 1)[0].toLowerCase();
  const bytes = Buffer.from(response.data);

  if (contentType.includes("html")) {
    const staticTextMenu = parseMenuText(htmlToMenuText(bytes.toString("utf8")));
    if (hasAcceptableMenuQuality(staticTextMenu)) {
      return makeExtraction(normalized, staticTextMenu.sections.flatMap(section => section.items.map(item => ({ category: section.name, name: item.name, description: item.description, price: item.price }))));
    }
  }

  const driveFileId = normalized.match(/drive\.google\.com\/file\/d\/([^/]+)/i)?.[1];
  const isDirectFile = contentType === "application/pdf" || contentType.startsWith("image/") || bytes.subarray(0, 4).toString("ascii") === "%PDF" || Boolean(driveFileId);

  if (isDirectFile) {
    const sources = driveFileId ? [`https://drive.usercontent.google.com/download?id=${encodeURIComponent(driveFileId)}&export=download`] : [normalized];
    const extracted = await extractMenuWithOcr(sources.map(url => ({ url })), 1, 1);
    const items = extracted.sections.flatMap(section => section.items.map(item => ({
      category: section.name.slice(0, 64), name: item.name, description: item.description || null,
      price: item.price == null ? null : Number(item.price), imageUrl: null, tags: [],
    })));
    if (items.length === 0) {
      if (driveFileId) throw new Error("O arquivo do Google Drive não pôde ser lido. Confirme se o link está com permissão 'Qualquer pessoa com o link pode ver' — arquivos restritos ou com aviso de vírus do Drive não são baixáveis automaticamente.");
      throw new Error("Não foi possível identificar itens no arquivo público do cardápio.");
    }
    return { provider: "url", sourceUrl: normalized, menus: 1, categories: extracted.sections.length, items };
  }

  // --- Nem HTML estático suficiente, nem PDF/imagem direta: escala para o
  // navegador headless (cobre SPAs e sites institucionais em React/Vue) ---
  let rendered: RenderedPage;
  try {
    rendered = await renderPage(normalized);
  } catch (error: any) {
    throw new Error(`Não foi possível carregar a página com o navegador (${String(error?.message || error).slice(0, 160)}).`);
  }

  const renderedTextMenu = parseMenuText(rendered.text);
  if (hasAcceptableMenuQuality(renderedTextMenu)) {
    return makeExtraction(normalized, renderedTextMenu.sections.flatMap(section => section.items.map(item => ({ category: section.name, name: item.name, description: item.description, price: item.price }))));
  }

  // Procura PDF/imagem pública que só aparece depois do JS renderizar
  // (comum em botões "baixar cardápio" adicionados dinamicamente pelo app).
  const fileCandidates = Array.from(new Set([
    ...rendered.links.map(link => link.href).filter(href => /\.(?:pdf|png|jpe?g|webp)(?:[?#].*)?$/i.test(href) || /(?:download|export|preview)/i.test(href)),
    ...Array.from(rendered.html.matchAll(/https?:\/\/drive\.google\.com\/file\/d\/[^"'\\\s]+/gi)).map(match => match[0].replace(/\\u0026/g, "&")),
  ])).slice(0, 30);

  if (fileCandidates.length) {
    const ocrSources = fileCandidates.map(source => {
      const driveId = source.match(/drive\.google\.com\/file\/d\/([^/]+)/i)?.[1];
      return driveId ? `https://drive.usercontent.google.com/download?id=${encodeURIComponent(driveId)}&export=download` : source;
    });
    const extracted = await extractMenuWithOcr(ocrSources.map(url => ({ url })), 1, 1);
    const items = extracted.sections.flatMap(section => section.items.map(item => ({
      category: section.name.slice(0, 64), name: item.name, description: item.description || null,
      price: item.price == null ? null : Number(item.price), imageUrl: null, tags: [],
    })));
    if (items.length) return { provider: "url", sourceUrl: normalized, menus: 1, categories: extracted.sections.length, items };
  }

  // --- Último recurso: print de tela inteira renderizada + OCR. Ajuda em
  // apps que desenham o cardápio como imagem/canvas único, sem nenhuma URL
  // de arquivo isolada para baixar. ---
  try {
    const browser = await getBrowser();
    const context = await browser.newContext({ viewport: { width: 1280, height: 4000 } });
    const page = await context.newPage();
    let screenshot: Buffer | null = null;
    try {
      await page.goto(normalized, { waitUntil: "load", timeout: BROWSER_NAV_TIMEOUT_MS });
      await page.waitForTimeout(1_500);
      screenshot = await page.screenshot({ type: "png", fullPage: true });
    } finally {
      await page.close().catch(() => {});
      await context.close().catch(() => {});
    }
    if (screenshot) {
      const text = await ocrImageBuffers([screenshot]);
      const screenshotMenu = parseMenuText(text);
      if (hasAcceptableMenuQuality(screenshotMenu)) {
        return makeExtraction(normalized, screenshotMenu.sections.flatMap(section => section.items.map(item => ({ category: section.name, name: item.name, description: item.description, price: item.price }))));
      }
    }
  } catch {
    // Falha do último recurso é esperada às vezes; segue para o erro final.
  }

  throw new Error("A página não expôs um cardápio legível — nem em texto, nem em PDF/imagem, mesmo após renderizar com navegador headless.");
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
