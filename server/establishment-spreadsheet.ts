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
  state: string | null;
  zipCode: string | null;
  lat: number | null;
  lng: number | null;
  image: string | null;
  logo: string | null;
  menuUrl: string | null;
  lastMenuUpdate: Date | null;
  validationScore: number | null;
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
  estado: "state", state: "state",
  cep: "zipCode", zip_code: "zipCode", zipcode: "zipCode", zipCode: "zipCode",
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
  menu_url: "menuUrl", menuurl: "menuUrl", menuUrl: "menuUrl",
  last_menu_update: "lastMenuUpdate", lastmenuupdate: "lastMenuUpdate", lastMenuUpdate: "lastMenuUpdate",
  validation_score: "validationScore", validationscore: "validationScore", validationScore: "validationScore",
};

function normalizeHeader(value: unknown): string {
  return String(value ?? "").trim().toLocaleLowerCase("pt-BR").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function text(value: unknown, maxLength: number): string | null {
  const result = String(value ?? "").replace(/\s+/g, " ").trim();
  return result ? result.slice(0, maxLength) : null;
}

function numberValue(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const raw = String(value).trim();
  if (!raw) return null;
  const brDate = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(.*))?$/);
  const normalized = brDate
    ? `${brDate[3]}-${brDate[2].padStart(2, "0")}-${brDate[1].padStart(2, "0")}${brDate[4] ? `T${brDate[4]}` : "T00:00:00"}`
    : raw;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function validAddressNumber(value: string | null): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  if (normalized === "s/n" || normalized === "sn") return true;
  const parsed = Number(normalized);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 15000 && String(parsed) === normalized;
}

function coordinate(value: unknown, min: number, max: number): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).trim().replace(",", "."));
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

export function createEstablishmentSpreadsheetTemplate(): Buffer {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([[
    "nome", "categoria", "endereco", "numero", "complemento", "bairro", "regiao", "cidade", "estado", "cep",
    "telefone", "instagram", "google_maps_url", "facebook", "site", "descricao", "horario",
    "latitude", "longitude", "foto_fundo_url", "logo_url", "menu_url", "last_menu_update", "validation_score",
  ]]);
  sheet["!cols"] = [
    { wch: 32 }, { wch: 24 }, { wch: 38 }, { wch: 12 }, { wch: 24 }, { wch: 24 }, { wch: 18 }, { wch: 20 }, { wch: 14 }, { wch: 14 },
    { wch: 20 }, { wch: 30 }, { wch: 55 }, { wch: 35 }, { wch: 45 }, { wch: 60 }, { wch: 60 },
    { wch: 14 }, { wch: 14 }, { wch: 55 }, { wch: 55 }, { wch: 55 }, { wch: 22 }, { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(workbook, sheet, "Estabelecimentos");
  const instructions = XLSX.utils.aoa_to_sheet([
    ["MODELO DE CADASTRO EM MASSA — AVALYARIN"],
    ["Preencha uma linha por estabelecimento. Não altere os nomes das colunas."],
    ["Obrigatórios", "nome, categoria, endereco, numero (ou s/n), bairro, cidade, google_maps_url, instagram e horario"],
    ["categoria", "Use o nome exato de uma categoria já cadastrada no Avalyarin."],
    ["numero", "Obrigatório. Use um número inteiro de 1 a 15000 ou s/n."],
    ["cidade", "Obrigatório."],
    ["google_maps_url", "URL completa do Google Maps. Obrigatória."],
    ["telefone", "Opcional."],
    ["horario", "Ex.: Segunda a Sexta, das 11:00 às 22:00; Sábado, das 11:00 às 00:00"],
    ["latitude/longitude", "Opcional. Use números decimais, como -23.5612463 e -46.5697117."],
    ["menu_url", "URL do cardápio; opcional."],
    ["last_menu_update", "Data da última actualização do cardápio; opcional."],
    ["validation_score", "Pontuação numérica de validação; opcional."],
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
    ["name", "nome"], ["category", "categoria"], ["address", "endereco"], ["addressNumber", "numero"],
    ["neighborhood", "bairro"], ["city", "cidade"], ["googleMapsUrl", "google_maps_url"],
    ["instagram", "instagram"], ["hours", "horario"],
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
    const addressNumber = text(row[index("addressNumber")], 20);
    const neighborhood = text(row[index("neighborhood")], 128);
    const city = text(row[index("city")], 128);
    const phone = text(row[index("phone")], 64);
    const instagram = text(row[index("instagram")], 128);
    const hours = text(row[index("hours")], 370);
    const googleMapsUrl = text(row[index("googleMapsUrl")], 2000);
    if (!name || !category || !address || !validAddressNumber(addressNumber) || !neighborhood || !city || !googleMapsUrl || !instagram || !hours) {
      warnings.push(`Linha ${rowNumber} ignorada: preencha nome, categoria, endereço, número (ou s/n), bairro, cidade, Google Maps, Instagram e horário.`);
      continue;
    }
    const nameKey = name.toLocaleLowerCase("pt-BR");
    if (names.has(nameKey)) { warnings.push(`Linha ${rowNumber} ignorada: nome duplicado na planilha.`); continue; }
    names.add(nameKey);
    rows.push({
      name, category, address, neighborhood, phone, instagram, hours,
      addressNumber, complement: text(row[index("complement")], 255),
      region: text(row[index("region")], 64), city,
      state: text(row[index("state")], 64), zipCode: text(row[index("zipCode")], 16),
      googleMapsUrl, facebook: text(row[index("facebook")], 2000),
      website: text(row[index("website")], 2000), description: text(row[index("description")], 500),
      lat: coordinate(row[index("lat")], -90, 90), lng: coordinate(row[index("lng")], -180, 180),
      image: text(row[index("image")], 2000), logo: text(row[index("logo")], 2000),
      menuUrl: text(row[index("menuUrl")], 2000),
      lastMenuUpdate: parseDate(row[index("lastMenuUpdate")]),
      validationScore: numberValue(row[index("validationScore")]),
    });
  }
  if (!rows.length) throw new Error("Nenhum estabelecimento válido foi encontrado na planilha");
  return { rows, warnings };
}
