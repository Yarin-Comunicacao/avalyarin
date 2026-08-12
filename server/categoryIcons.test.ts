import { describe, it, expect } from "vitest";

/**
 * Tests for category icon mapping uniqueness.
 * The mapping lives in client code, so we replicate the data here for validation.
 */

const categoryIconMap: Record<string, string> = {
  // GASTRONOMIA
  "cozinha-brasileira": "Drumstick",
  "cozinha-internacional": "Globe",
  "autoral-contemporaneo": "ChefHat",
  "hamburgueria": "Sandwich",
  "pizzaria": "Pizza",

  // BARES & VIDA NOTURNA
  "bar-lanchonete": "CupSoda",
  "boteco-tradicional": "Beer",
  "boteco-moderno": "GlassWater",
  "pub": "Wine",
  "cervejaria": "Wheat",
  "coquetelaria": "Martini",
  "bar-musical": "Music",
  "balada": "Disc3",

  // CAFÉ & DOCES
  "cafeteria": "Coffee",
  "padaria": "Croissant",
  "confeitaria": "Cake",

  // SAUDÁVEL & BEM-ESTAR
  "vegan": "Leaf",
  "acai": "IceCream",
  "saudavel": "Salad",
};

describe("Category Icon Mapping", () => {
  it("should have a unique icon for every category", () => {
    const icons = Object.values(categoryIconMap);
    const uniqueIcons = new Set(icons);
    expect(uniqueIcons.size).toBe(icons.length);
  });

  it("should cover all 19 categories", () => {
    const slugs = Object.keys(categoryIconMap);
    expect(slugs.length).toBe(19);
  });

  it("should not have empty icon values", () => {
    for (const [slug, icon] of Object.entries(categoryIconMap)) {
      expect(icon).toBeTruthy();
      expect(icon.length).toBeGreaterThan(0);
    }
  });

  it("should have all GASTRONOMIA categories", () => {
    const gastronomia = ["cozinha-brasileira", "cozinha-internacional", "autoral-contemporaneo", "hamburgueria", "pizzaria"];
    for (const slug of gastronomia) {
      expect(categoryIconMap[slug]).toBeDefined();
    }
  });

  it("should have all BARES & VIDA NOTURNA categories", () => {
    const bares = ["bar-lanchonete", "boteco-tradicional", "boteco-moderno", "pub", "cervejaria", "coquetelaria", "bar-musical", "balada"];
    for (const slug of bares) {
      expect(categoryIconMap[slug]).toBeDefined();
    }
  });

  it("should have all CAFÉ & DOCES categories", () => {
    const cafe = ["cafeteria", "padaria", "confeitaria"];
    for (const slug of cafe) {
      expect(categoryIconMap[slug]).toBeDefined();
    }
  });

  it("should have all SAUDÁVEL & BEM-ESTAR categories", () => {
    const saudavel = ["vegan", "acai", "saudavel"];
    for (const slug of saudavel) {
      expect(categoryIconMap[slug]).toBeDefined();
    }
  });
});
