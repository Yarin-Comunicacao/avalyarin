import { describe, expect, it } from "vitest";
import { parseMenuText } from "./smart-menu-ocr";
import { vi } from "vitest";

describe("menu OCR parser", () => {
  it("separa categorias e converte preços brasileiros", () => {
    const result = parseMenuText(`
      LANCHES
      X-Salada ........ R$ 25,90
      Hambúrguer artesanal 32,50
      BEBIDAS
      Cerveja long neck R$ 12,00
    `);

    expect(result.sections.map(section => section.name)).toEqual(["LANCHES", "BEBIDAS"]);
    expect(result.sections[0].items).toEqual([
      { name: "X-Salada", description: null, price: 25.9 },
      { name: "Hambúrguer artesanal", description: null, price: 32.5 },
    ]);
    expect(result.sections[1].items[0].price).toBe(12);
  });

  it("mantém itens legíveis sem preço e associa uma linha descritiva", () => {
    const result = parseMenuText(`PORÇÕES\nBatata frita\nPorção individual para acompanhar\nR$ 22,00`);
    expect(result.sections[0].items[0].name).toBe("Batata frita");
    expect(result.sections[0].items[0].description).toContain("Porção individual");
    expect(result.sections[0].items[0].price).toBe(22);
  });

  it("rejeita resultados OCR evidentemente corrompidos", async () => {
    const { hasAcceptableMenuQuality } = await import("./smart-menu-ocr");
    expect(hasAcceptableMenuQuality({
      confidence: 80,
      sections: [{ name: "Outros", items: [{ name: "WRX) x", description: null, price: 3830 }] }],
    })).toBe(false);

    expect(hasAcceptableMenuQuality({
      confidence: 80,
      sections: [{ name: "Bebidas", items: [{ name: "Cerveja long neck", description: null, price: 12 }] }],
    })).toBe(true);
  });
});


describe("menu PDF extraction", () => {
  it("lê seções e preços de um PDF digital", async () => {
    const { readFile } = await import("node:fs/promises");
    const { resolve } = await import("node:path");
    const { extractMenuWithOcr } = await import("./smart-menu-ocr");
    const pdfBuffer = await readFile(resolve(process.cwd(), "server/fixtures/menu-text.pdf"));
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(pdfBuffer, { status: 200, headers: { "content-type": "application/pdf" } }),
    );

    try {
      const result = await extractMenuWithOcr([
        { url: "https://example.test/cardapio.pdf", mimeType: "application/pdf" },
      ], 1, 1);
      expect(result.sections.map(section => section.name)).toEqual(["BEBIDAS", "LANCHES"]);
      expect(result.sections[0].items[0]).toMatchObject({ name: "Cerveja long neck", price: 12 });
      expect(result.sections[1].items[0]).toMatchObject({ name: "X-Salada", price: 25.9 });
    } finally {
      fetchMock.mockRestore();
    }
  });
});
