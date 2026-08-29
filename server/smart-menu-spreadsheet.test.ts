import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { createMenuSpreadsheetTemplate, parseMenuSpreadsheet } from "./smart-menu-spreadsheet";

function workbookBuffer(rows: unknown[][]): Buffer {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), "Cardápio");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

describe("menu spreadsheet", () => {
  it("parses structured menu rows with Brazilian prices", () => {
    const result = parseMenuSpreadsheet(workbookBuffer([
      ["categoria", "nome", "descricao", "preco", "tags"],
      ["Lanches", "X-Burger", "Pão, carne e queijo", "R$ 25,90", "hambúrguer, lanche"],
      ["Bebidas", "Suco natural", "Laranja", 8.5, "suco"],
    ]));
    expect(result.items).toEqual([
      { category: "Lanches", name: "X-Burger", description: "Pão, carne e queijo", price: 25.9, tags: ["hambúrguer", "lanche"], imageUrl: null },
      { category: "Bebidas", name: "Suco natural", description: "Laranja", price: 8.5, tags: ["suco"], imageUrl: null },
    ]);
  });

  it("rejects duplicate rows and requires the standard columns", () => {
    const result = parseMenuSpreadsheet(workbookBuffer([
      ["categoria", "nome", "descricao", "preco"],
      ["Porções", "Batata", "", "20,00"],
      ["Porções", "Batata", "duplicado", "22,00"],
    ]));
    expect(result.items).toHaveLength(1);
    expect(result.warnings[0]).toContain("duplicado");
    expect(() => parseMenuSpreadsheet(workbookBuffer([["nome", "preco"], ["Item", "10"]]))).toThrow("categoria");
  });

  it("generates a non-empty XLSX template", () => {
    const buffer = createMenuSpreadsheetTemplate();
    expect(buffer.length).toBeGreaterThan(100);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    expect(workbook.SheetNames).toEqual(["Cardápio", "Instruções"]);
  });
});
