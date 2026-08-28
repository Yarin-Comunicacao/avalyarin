import { describe, expect, it } from "vitest";
import { parseMenuText } from "./smart-menu-ocr";

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
});
