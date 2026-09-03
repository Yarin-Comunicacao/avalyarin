import sharp from "sharp";
import { createWorker, PSM } from "tesseract.js";
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const MAX_PDF_PAGES = 50;

export type OcrPhoto = { url: string; key?: string; mimeType?: string };

export type OcrExtractedItem = {
  name: string;
  description?: string | null;
  price?: number | null;
};

export type OcrExtractedSection = {
  name: string;
  items: OcrExtractedItem[];
};

export type OcrExtractedMenu = {
  sections: OcrExtractedSection[];
  confidence?: number;
};

const COMMON_SECTION_NAMES = new Set([
  "entradas", "porções", "porcoes", "petiscos", "lanches", "hambúrgueres", "hamburgueres",
  "sanduíches", "sanduiches", "pratos", "pratos principais", "massas", "saladas", "sopas",
  "carnes", "peixes", "sobremesas", "bebidas", "drinks", "coquetéis", "coqueteis",
  "cervejas", "vinhos", "destilados", "caipirinhas", "sucos", "refrigerantes", "doses",
]);

function cleanLine(value: string): string {
  return value
    .replace(/[|¦]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^\s*[•·▪●*-]+\s*/, "")
    .trim();
}

function normalizeSectionName(value: string): string {
  return cleanLine(value).replace(/[.:]+$/, "").trim().slice(0, 128);
}

function parsePrice(value: string): number | null {
  const normalized = value.replace(/\s/g, "").replace(/^R\$?/i, "");
  const brazilian = normalized.includes(",")
    ? normalized.replace(/\./g, "").replace(",", ".")
    : normalized;
  const price = Number(brazilian);
  return Number.isFinite(price) && price >= 0 && price <= 100000 ? price : null;
}

function extractPrice(line: string): { name: string; price: number | null } {
  const matches = Array.from(line.matchAll(/(?:R\$\s*)?(\d{1,4}(?:[.,]\d{2})?)(?!\d)(?=\s*(?:$|[-–—.:]))/gi));
  if (matches.length === 0) return { name: cleanLine(line), price: null };

  const match = matches[matches.length - 1];
  const rawPrice = match[1];
  const price = parsePrice(rawPrice);
  const name = cleanLine(
    `${line.slice(0, match.index ?? 0)} ${line.slice((match.index ?? 0) + match[0].length)}`
      .replace(/\s*[.:…-]+\s*$/, "")
      .replace(/\.{2,}/g, " ")
  );
  return { name, price };
}

function looksLikeSectionHeading(line: string): boolean {
  const normalized = normalizeSectionName(line);
  if (!normalized || normalized.length > 80 || /\d/.test(normalized)) return false;
  const key = normalized.toLocaleLowerCase("pt-BR");
  if (COMMON_SECTION_NAMES.has(key)) return true;
  const letters = normalized.match(/[A-Za-zÀ-ÿ]/g) || [];
  const upper = normalized.match(/[A-ZÀ-Ý]/g) || [];
  return letters.length >= 3 && upper.length / letters.length >= 0.7 && normalized.split(" ").length <= 6;
}

export function parseMenuText(text: string): OcrExtractedMenu {
  const sections: OcrExtractedSection[] = [];
  let current: OcrExtractedSection = { name: "Outros", items: [] };
  let pendingLines: string[] = [];
  sections.push(current);

  const flushPending = () => {
    if (pendingLines.length === 0) return;
    const [name, ...descriptionLines] = pendingLines;
    if (name.length >= 2) {
      current.items.push({
        name: name.slice(0, 255),
        description: descriptionLines.join(" ").slice(0, 1000) || null,
        price: null,
      });
    }
    pendingLines = [];
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = cleanLine(rawLine);
    if (!line || line.length < 2) continue;

    if (looksLikeSectionHeading(line)) {
      flushPending();
      const name = normalizeSectionName(line);
      const existing = sections.find(section => section.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"));
      current = existing || { name, items: [] };
      if (!existing) sections.push(current);
      continue;
    }

    const { name, price } = extractPrice(line);
    if (price !== null) {
      if (name.length >= 2) {
        const [pendingName, ...descriptionLines] = pendingLines;
        current.items.push({
          name: (pendingName || name).slice(0, 255),
          description: (pendingName ? [...descriptionLines, name] : descriptionLines).join(" ").slice(0, 1000) || null,
          price,
        });
      } else if (pendingLines.length > 0) {
        const [pendingName, ...descriptionLines] = pendingLines;
        current.items.push({ name: pendingName.slice(0, 255), description: descriptionLines.join(" ").slice(0, 1000) || null, price });
      }
      pendingLines = [];
      continue;
    }

    if (line.length > 2) pendingLines.push(line);
  }

  flushPending();
  return { sections: sections.filter(section => section.items.length > 0) };
}

export function hasAcceptableMenuQuality(menu: OcrExtractedMenu): boolean {
  const items = menu.sections.flatMap(section => section.items);
  if (items.length === 0) return false;
  if (typeof menu.confidence === "number" && menu.confidence < 45) return false;

  const plausibleItems = items.filter(item => {
    const letters = item.name.match(/[A-Za-zÀ-ÿ]/g) || [];
    const symbols = item.name.match(/[^A-Za-zÀ-ÿ0-9\s]/g) || [];
    return letters.length >= 4 && letters.length / Math.max(item.name.length, 1) >= 0.45 && symbols.length / Math.max(item.name.length, 1) <= 0.2;
  });
  const implausiblePrices = items.filter(item => item.price !== null && item.price !== undefined && (item.price < 0 || item.price > 1000));
  return plausibleItems.length / items.length >= 0.65 && implausiblePrices.length === 0;
}

async function prepareImage(input: Buffer): Promise<Buffer> {
  // PDFs exportados do Drive podem gerar páginas acima do limite padrão do
  // libvips; o resize abaixo reduz a imagem antes do OCR.
  return sharp(input, { limitInputPixels: false })
    .rotate()
    .resize({ width: 2400, height: 3200, fit: "inside", withoutEnlargement: false })
    .grayscale()
    .normalize()
    .sharpen()
    .png()
    .toBuffer();
}

async function extractPdfText(input: Buffer): Promise<string> {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const document = await getDocument({
    data: new Uint8Array(input),
    useWorkerFetch: false,
    useSystemFonts: true,
  }).promise;
  try {
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= Math.min(document.numPages, MAX_PDF_PAGES); pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      let lastY: number | undefined;
      const lines: string[] = [];
      for (const item of content.items as Array<{ str?: string; transform?: number[] }>) {
        const value = typeof item.str === "string" ? item.str.trim() : "";
        if (!value) continue;
        const y = item.transform?.[5];
        if (lines.length > 0 && typeof y === "number" && typeof lastY === "number" && Math.abs(y - lastY) > 2) {
          lines.push("\n");
        } else if (lines.length > 0 && lines[lines.length - 1] !== "\n") {
          lines.push(" ");
        }
        lines.push(value);
        lastY = y;
      }
      pages.push(lines.join(""));
      page.cleanup();
    }
    return pages.join("\n");
  } finally {
    await document.destroy();
  }
}

async function rasterizePdf(input: Buffer): Promise<Buffer[]> {
  const workDirectory = await fs.mkdtemp(join(tmpdir(), "avalyarin-menu-"));
  const inputPath = join(workDirectory, "menu.pdf");
  const outputPrefix = join(workDirectory, "page");
  try {
    await fs.writeFile(inputPath, input);
    await execFileAsync("pdftoppm", ["-png", "-r", "200", "-f", "1", "-l", String(MAX_PDF_PAGES), inputPath, outputPrefix], {
      maxBuffer: 2 * 1024 * 1024,
    });
    const pageNames = (await fs.readdir(workDirectory))
      .filter(name => /^page(?:-\d+|\d+)\.png$/i.test(name))
      .sort((left, right) => {
        const leftNumber = Number(left.match(/(\d+)\.png$/i)?.[1] || 0);
        const rightNumber = Number(right.match(/(\d+)\.png$/i)?.[1] || 0);
        return leftNumber - rightNumber;
      });
    return Promise.all(pageNames.map(name => fs.readFile(join(workDirectory, name))));
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      throw new Error("Não foi possível ler PDF escaneado: o conversor de páginas não está disponível no servidor.");
    }
    throw new Error("Não foi possível converter as páginas do PDF para leitura.");
  } finally {
    await fs.rm(workDirectory, { recursive: true, force: true });
  }
}

async function downloadMenuFile(photo: OcrPhoto): Promise<{ input: Buffer; mimeType: string }> {
  let response = await fetch(photo.url);
  if (!response.ok && /drive\.(?:google\.com|usercontent\.google\.com)/i.test(photo.url)) {
    const id = photo.url.match(/[?&]id=([^&]+)/)?.[1] || photo.url.match(/\/d\/([^/]+)/)?.[1];
    if (id) response = await fetch(`https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`);
  }
  if (!response.ok) throw new Error(`Não foi possível baixar o arquivo do cardápio (${response.status})`);
  return {
    input: Buffer.from(await response.arrayBuffer()),
    mimeType: (photo.mimeType || response.headers.get("content-type") || "").split(";", 1)[0].toLowerCase(),
  };
}

export async function extractMenuWithOcr(photos: OcrPhoto[], batchNumber: number, totalBatches: number): Promise<OcrExtractedMenu> {
  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
  const getWorker = async () => {
    if (worker) return worker;
    worker = await createWorker("por");
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
      preserve_interword_spaces: "1",
    });
    return worker;
  };

  try {
    const texts: string[] = [];
    const confidences: number[] = [];
    const failures: string[] = [];
    for (const photo of photos) {
      let downloaded: { input: Buffer; mimeType: string };
      try {
        downloaded = await downloadMenuFile(photo);
      } catch (error: any) {
        failures.push(String(error?.message || error));
        continue;
      }
      const { input, mimeType } = downloaded;
      const isPdf = mimeType === "application/pdf" || input.subarray(0, 4).toString("ascii") === "%PDF";
      if (isPdf) {
        const pdfText = await extractPdfText(input);
        const textMenu = parseMenuText(pdfText);
        if (hasAcceptableMenuQuality(textMenu)) {
          texts.push(pdfText);
          continue;
        }
        const pages = await rasterizePdf(input);
        for (const page of pages) {
          const image = await prepareImage(page);
          const result = await (await getWorker()).recognize(image);
          texts.push(result.data.text);
          if (Number.isFinite(result.data.confidence)) confidences.push(Number(result.data.confidence));
        }
        continue;
      }

      const image = await prepareImage(input);
      const result = await (await getWorker()).recognize(image);
      texts.push(result.data.text);
      if (Number.isFinite(result.data.confidence)) confidences.push(Number(result.data.confidence));
    }
    const menu = parseMenuText(texts.join("\n"));
    if (!texts.length && failures.length) throw new Error(failures[0]);
    return {
      ...menu,
      confidence: confidences.length > 0 ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length : undefined,
    };
  } finally {
    if (worker) await worker.terminate();
  }
}
