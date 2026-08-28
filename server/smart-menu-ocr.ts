import sharp from "sharp";
import { createWorker, PSM } from "tesseract.js";

export type OcrPhoto = { url: string; key?: string };

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
  const matches = Array.from(line.matchAll(/(?:R\$\s*)?(\d{1,4}(?:[.,]\d{2})?)(?!\d)/gi));
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

async function prepareImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Não foi possível baixar a imagem do cardápio (${response.status})`);
  const input = Buffer.from(await response.arrayBuffer());
  return sharp(input)
    .rotate()
    .resize({ width: 2400, height: 3200, fit: "inside", withoutEnlargement: false })
    .grayscale()
    .normalize()
    .sharpen()
    .png()
    .toBuffer();
}

export async function extractMenuWithOcr(photos: OcrPhoto[], batchNumber: number, totalBatches: number): Promise<OcrExtractedMenu> {
  const worker = await createWorker("por");
  try {
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK });
    const texts: string[] = [];
    for (const photo of photos) {
      const image = await prepareImage(photo.url);
      const result = await worker.recognize(image);
      texts.push(result.data.text);
    }
    return parseMenuText(texts.join("\n"));
  } finally {
    await worker.terminate();
  }
}
