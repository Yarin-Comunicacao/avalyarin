import axios from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { extractGetInMenu } from "./digital-menu-scraper";

describe("digital menu scraper", () => {
  afterEach(() => vi.restoreAllMocks());

  it("agrega todas as sessões publicadas do Get In e converte centavos", async () => {
    vi.spyOn(axios, "get").mockImplementation(async (url) => {
      const value = String(url);
      if (value.endsWith("/menus?pagination=0")) {
        return { data: { success: true, data: [
          { id: "menu-a", title: "A la Carte" },
          { id: "menu-b", title: "Omakase e Menus Especiais" },
        ] } } as any;
      }
      if (value.includes("/menus/menu-a/categories")) {
        return { data: { success: true, data: [{ id: "cat-a", title: "Entradas", items: [{ title: "Provoleta", description: "Na brasa", price: 8100, images: [], tags: [] }] }] } } as any;
      }
      return { data: { success: true, data: [{ id: "cat-b", title: "Especiais", items: [{ title: "Menu degustação", description: "Sete etapas", price: 250, images: [], tags: ["especial"] }] }] } } as any;
    });

    const result = await extractGetInMenu("https://menu.getin.app/pt-br/unit-123/menus/menu-a");

    expect(result.menus).toBe(2);
    expect(result.categories).toBe(2);
    expect(result.items).toEqual([
      expect.objectContaining({ name: "Provoleta", category: "A la Carte · Entradas", price: 81 }),
      expect.objectContaining({ name: "Menu degustação", category: "Omakase e Menus Especiais · Especiais", price: 2.5 }),
    ]);
  });

  it("rejeita host que não seja Get In", async () => {
    await expect(extractGetInMenu("https://example.com/menu")).rejects.toThrow(/Get In/);
  });
});
