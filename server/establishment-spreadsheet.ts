import * as XLSX from "xlsx";

export type EstablishmentSpreadsheetRow = {
  name: string;
  category: string;
  address: string;
  addressNumber: string | null;
  complement: string | null;
  neighborhood: string;
  region: string | null;
  city: string | null;
  phone: string;
  instagram: string;
  googleMapsUrl: string | null;
  facebook: string | null;
  website: string | null;
  description: string | null;
  hours: string;
  lat: number | null;
  lng: number | null;
  image: string | null;
  logo: string | null;
};

export type EstablishmentSpreadsheetParseResult = {
  rows: EstablishmentSpreadsheetRow[];
  warnings: string[];
};

const HEADER_ALIASES: Record<string, keyof EstablishmentSpreadsheetRow> = {
  nome: "name", estabelecimento: "name", name: "name",
  categoria: "category", category: "category",
  endereco: "address", endereço: "address", address: "address",
  numero: "addressNumber", número: "addressNumber", address_number: "addressNumber",
  complemento: "complement", complement: "complement",
  bairro: "neighborhood", neighborhood: "neighborhood",
  regiao: "region", região: "region", region: "region",
  cidade: "city", city: "city",
  telefone: "phone", whatsapp: "phone", phone: "phone",
  instagram: "instagram",
  google_maps: "googleMapsUrl", google_maps_url: "googleMapsUrl", googlemapsurl: "googleMapsUrl",
  facebook: "facebook",
  site: "website", website: "website",
  descricao: "description", descrição: "description", description: "description",
  horario: "hours", horários: "hours", horarios: "hours", hours: "hours",
  latitude: "lat", lat: "lat",
  longitude: "lng", lng: "lng",
  foto_fundo_url: "image", foto_principal_url: "image", imagem: "image", image: "image",
  logo_url: "logo", logo: "logo",
};

function normalizeHeader(value: unknown): string {
  return String(value ?? "").trim().toLocaleLowerCase("pt-BR").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function text(value: unknown, maxLength: number): string | null {
  const result = String(value ?? "").replace(/\s+/g, " ").trim();
  return result ? result.slice(0, maxLength) : null;
}

function coordinate(value: unknown, min: number, max: number): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).trim().replace(",", "."));
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

export function createEstablishmentSpreadsheetTemplate(): Buffer {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([[
    "nome", "categoria", "endereco", "numero", "complemento", "bairro", "regiao", "cidade",
    "telefone", "instagram", "google_maps_url", "facebook", "site", "descricao", "horario",
    "latitude", "longitude", "foto_fundo_url", "logo_url",
  ]]);
  sheet["!cols"] = [
    { wch: 32 }, { wch: 24 }, { wch: 38 }, { wch: 12 }, { wch: 24 }, { wch: 24 }, { wch: 18 }, { wch: 20 },
    { wch: 20 }, { wch: 30 }, { wch: 55 }, { wch: 35 }, { wch: 45 }, { wch: 60 }, { wch: 60 },
    { wch: 14 }, { wch: 14 }, { wch: 55 }, { wch: 55 },
  ];
  XLSX.utils.book_append_sheet(workbook, sheet, "Estabelecimentos");
  const instructions = XLSX.utils.aoa_to_sheet([
    ["MODELO DE CADASTRO EM MASSA — AVALYARIN"],
    ["Preencha uma linha por estabelecimento. Não altere os nomes das colunas."],
    ["Obrigatórios", "nome, categoria, endereco, bairro, telefone, instagram e horario"],
    ["categoria", "Use o nome exato de uma categoria já cadastrada no Avalyarin."],
    ["google_maps_url", "URL completa do Google Maps. Opcional, mas recomendada."],
    ["horario", "Ex.: Segunda a Sexta, das 11:00 às 22:00; Sábado, das 11:00 às 00:00"],
    ["latitude/longitude", "Opcional. Use números decimais, como -23.5612463 e -46.5697117."],
    ["foto_fundo_url/logo_url", "Opcional. Use URLs públicas das imagens; o upload de arquivos permanece disponível no cadastro único."],
    ["Visibilidade", "Sem cardápio, o estabelecimento será criado como pending conforme a regra do projeto."],
  ]);
  instructions["!cols"] = [{ wch: 28 }, { wch: 110 }];
  XLSX.utils.book_append_sheet(workbook, instructions, "Instruções");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function parseEstablishmentSpreadsheet(buffer: Buffer, fileName = "estabelecimentos.xlsx"): EstablishmentSpreadsheetParseResult {
  if (!buffer.length) throw new Error("A planilha está vazia");
  if (buffer.length > 10 * 1024 * 1024) throw new Error("A planilha deve ter no máximo 10 MB");
  let workbook: XLSX.WorkBook;
  try { workbook = XLSX.read(buffer, { type: "buffer", raw: true }); }
  catch { throw new Error(`Não foi possível ler a planilha ${fileName}`); }
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("A planilha não possui nenhuma aba");
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, defval: "", raw: true });
  if (matrix.length < 2) throw new Error("A planilha precisa ter cabeçalho e pelo menos um estabelecimento");
  const mapped = (matrix[0] || []).map(value => HEADER_ALIASES[normalizeHeader(value)] || null);
  const required: Array<[keyof EstablishmentSpreadsheetRow, string]> = [
    ["name", "nome"], ["category", "categoria"], ["address", "endereco"], ["neighborhood", "bairro"],
    ["phone", "telefone"], ["instagram", "instagram"], ["hours", "horario"],
  ];
  for (const [field, label] of required) if (mapped.indexOf(field) < 0) throw new Error(`A planilha precisa conter a coluna obrigatória '${label}'`);

  const index = (field: keyof EstablishmentSpreadsheetRow) => mapped.indexOf(field);
  const rows: EstablishmentSpreadsheetRow[] = [];
  const warnings: string[] = [];
  const names = new Set<string>();
  for (const [offset, rawRow] of matrix.slice(1).entries()) {
    const rowNumber = offset + 2;
    const row = rawRow as unknown[];
    if (!row.some(value => String(value ?? "").trim())) continue;
    const name = text(row[index("name")], 255);
    const category = text(row[index("category")], 255);
    const address = text(row[index("address")], 255);
    const neighborhood = text(row[index("neighborhood")], 128);
    const phone = text(row[index("phone")], 64);
    const instagram = text(row[index("instagram")], 128);
    const hours = text(row[index("hours")], 255);
    if (!name || !category || !address || !neighborhood || !phone || !instagram || !hours) {
      warnings.push(`Linha ${rowNumber} ignorada: preencha nome, categoria, endereço, bairro, telefone, Instagram e horário.`);
      continue;
    }
    const nameKey = name.toLocaleLowerCase("pt-BR");
    if (names.has(nameKey)) { warnings.push(`Linha ${rowNumber} ignorada: nome duplicado na planilha.`); continue; }
    names.add(nameKey);
    rows.push({
      name, category, address, neighborhood, phone, instagram, hours,
      addressNumber: text(row[index("addressNumber")], 20), complement: text(row[index("complement")], 255),
      region: text(row[index("region")], 64), city: text(row[index("city")], 128),
      googleMapsUrl: text(row[index("googleMapsUrl")], 2000), facebook: text(row[index("facebook")], 2000),
      website: text(row[index("website")], 2000), description: text(row[index("description")], 500),
      lat: coordinate(row[index("lat")], -90, 90), lng: coordinate(row[index("lng")], -180, 180),
      image: text(row[index("image")], 2000), logo: text(row[index("logo")], 2000),
    });
  }
  if (!rows.length) throw new Error("Nenhum estabelecimento válido foi encontrado na planilha");
  return { rows, warnings };
}
