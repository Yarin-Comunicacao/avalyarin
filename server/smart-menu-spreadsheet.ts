import * as XLSX from "xlsx";

export type SpreadsheetMenuItem = {
  category: string;
  name: string;
  description: string | null;
  price: number | null;
  tags: string[];
  imageUrl: string | null;
};

export type SpreadsheetParseResult = {
  items: SpreadsheetMenuItem[];
  warnings: string[];
};

const HEADER_ALIASES: Record<string, keyof SpreadsheetMenuItem> = {
  categoria: "category",
  categoria_do_cardapio: "category",
  secao: "category",
  seção: "category",
  category: "category",
  nome: "name",
  item: "name",
  nome_do_item: "name",
  produto: "name",
  name: "name",
  descricao: "description",
  descrição: "description",
  detalhes: "description",
  description: "description",
  preco: "price",
  preço: "price",
  valor: "price",
  price: "price",
  tags: "tags",
  etiquetas: "tags",
  imagem: "imageUrl",
  imagem_url: "imageUrl",
  image_url: "imageUrl",
};

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function cleanText(value: unknown, maxLength: number): string | null {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text ? text.slice(0, maxLength) : null;
}

function parsePrice(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? Number(value.toFixed(2)) : null;
  const text = String(value).trim().replace(/R\$|RS\$?/gi, "").replace(/\s/g, "");
  const normalized = text.includes(",")
    ? text.replace(/\./g, "").replace(",", ".")
    : text;
  const price = Number(normalized.replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(price) || price < 0 || price > 100000) return null;
  return Number(price.toFixed(2));
}

function parseTags(value: unknown): string[] {
  return String(value ?? "")
    .split(/[,;|]/)
    .map(tag => tag.trim().toLocaleLowerCase("pt-BR"))
    .filter(Boolean)
    .slice(0, 20);
}

export function createMenuSpreadsheetTemplate(): Buffer {
  const workbook = XLSX.utils.book_new();
  const headers = [["categoria", "nome", "descricao", "preco", "tags", "imagem_url"]];
  const sheet = XLSX.utils.aoa_to_sheet(headers);
  sheet["!cols"] = [
    { wch: 24 }, { wch: 36 }, { wch: 60 }, { wch: 14 }, { wch: 32 }, { wch: 60 },
  ];
  XLSX.utils.book_append_sheet(workbook, sheet, "Cardápio");
  const instructions = XLSX.utils.aoa_to_sheet([
    ["INSTRUÇÕES"],
    ["Preencha uma linha por item do cardápio. Não altere os nomes das colunas da aba Cardápio."],
    ["categoria", "Obrigatório. Ex.: Porções, Lanches, Bebidas."],
    ["nome", "Obrigatório. Nome do item."],
    ["descricao", "Opcional. Descrição ou composição do item."],
    ["preco", "Obrigatório. Use números ou valores como R$ 25,90."],
    ["tags", "Opcional. Separe várias tags por vírgula."],
    ["imagem_url", "Opcional. URL pública da imagem do item."],
  ]);
  instructions["!cols"] = [{ wch: 20 }, { wch: 90 }];
  XLSX.utils.book_append_sheet(workbook, instructions, "Instruções");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function parseMenuSpreadsheet(buffer: Buffer, fileName = "cardapio.xlsx"): SpreadsheetParseResult {
  if (!buffer.length) throw new Error("A planilha está vazia");
  if (buffer.length > 10 * 1024 * 1024) throw new Error("A planilha deve ter no máximo 10 MB");

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer", cellDates: false, raw: true });
  } catch {
    throw new Error(`Não foi possível ler a planilha ${fileName}`);
  }
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) throw new Error("A planilha não possui nenhuma aba");
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[firstSheet], { header: 1, defval: "", raw: true });
  if (matrix.length < 2) throw new Error("A planilha precisa ter uma linha de cabeçalho e pelo menos um item");

  const headers = (matrix[0] || []).map(normalizeHeader);
  const mappedHeaders = headers.map(header => HEADER_ALIASES[header] || null);
  const categoryIndex = mappedHeaders.indexOf("category");
  const nameIndex = mappedHeaders.indexOf("name");
  const priceIndex = mappedHeaders.indexOf("price");
  if (nameIndex < 0) throw new Error("A planilha precisa conter a coluna obrigatória 'nome'");
  if (categoryIndex < 0) throw new Error("A planilha precisa conter a coluna obrigatória 'categoria'");
  if (priceIndex < 0) throw new Error("A planilha precisa conter a coluna obrigatória 'preco'");

  const descriptionIndex = mappedHeaders.indexOf("description");
  const tagsIndex = mappedHeaders.indexOf("tags");
  const imageIndex = mappedHeaders.indexOf("imageUrl");
  const items: SpreadsheetMenuItem[] = [];
  const warnings: string[] = [];
  const keys = new Set<string>();

  matrix.slice(1).forEach((row, rowOffset) => {
    const rowNumber = rowOffset + 2;
    if (!row.some(value => String(value ?? "").trim())) return;
    const category = cleanText(row[categoryIndex], 128);
    const name = cleanText(row[nameIndex], 255);
    if (!category || !name) {
      warnings.push(`Linha ${rowNumber} ignorada: categoria e nome são obrigatórios.`);
      return;
    }
    const priceValue = row[priceIndex];
    const price = parsePrice(priceValue);
    if (priceValue !== null && priceValue !== undefined && String(priceValue).trim() !== "" && price === null) {
      warnings.push(`Linha ${rowNumber} ignorada: preço inválido.`);
      return;
    }
    const key = `${category.toLocaleLowerCase("pt-BR")}::${name.toLocaleLowerCase("pt-BR")}`;
    if (keys.has(key)) {
      warnings.push(`Linha ${rowNumber} ignorada: item duplicado na mesma categoria.`);
      return;
    }
    keys.add(key);
    items.push({
      category,
      name,
      description: descriptionIndex >= 0 ? cleanText(row[descriptionIndex], 1000) : null,
      price,
      tags: tagsIndex >= 0 ? parseTags(row[tagsIndex]) : [],
      imageUrl: imageIndex >= 0 ? cleanText(row[imageIndex], 2000) : null,
    });
  });

  if (!items.length) throw new Error("Nenhum item válido foi encontrado na planilha");
  return { items, warnings };
}
