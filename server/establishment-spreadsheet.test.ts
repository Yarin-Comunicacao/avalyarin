import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { parseEstablishmentSpreadsheet } from "./establishment-spreadsheet";

function makeWorkbookBuffer(hours: string): Buffer {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([
    ["nome", "categoria", "endereco", "bairro", "telefone", "instagram", "horario"],
    ["Galo", "Bar & Lanchonete", "Rua Álvaro Anes", "Pinheiros", "(11) 99999999", "https://instagram.com/galo_________/", hours],
  ]);
  XLSX.utils.book_append_sheet(workbook, sheet, "Estabelecimentos");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

describe("parseEstablishmentSpreadsheet", () => {
  it("preserva horários semanais maiores que 255 caracteres", () => {
    const hours = [
      "segunda-feira: Fechado",
      "terça-feira: 11:30–15:00 e 17:00–01:00",
      "quarta-feira: 11:30–15:00 e 17:00–01:00",
      "quinta-feira: 11:30–15:00 e 17:00–01:00",
      "sexta-feira: 11:30–15:00 e 17:00–01:00",
      "sábado: 11:30–15:00 e 17:00–01:00",
      "domingo: 11:30–15:00 e 17:00–01:00",
    ].join(" | ");

    expect(hours.length).toBeGreaterThan(255);
    const result = parseEstablishmentSpreadsheet(makeWorkbookBuffer(hours));

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.hours).toBe(hours);
  });

  it("continua normalizando espaços do horário sem descartar o registro", () => {
    const result = parseEstablishmentSpreadsheet(makeWorkbookBuffer("Segunda a domingo: 11:00   às   23:00"));

    expect(result.rows[0]?.hours).toBe("Segunda a domingo: 11:00 às 23:00");
    expect(result.warnings).toEqual([]);
  });
});
