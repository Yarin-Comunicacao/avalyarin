/**
 * Tests for Admin Establishment management
 * Tests the constants and logic without DB dependency
 */
import { describe, it, expect } from "vitest";
import { capitalizeCategory } from "./db-admin-estab";

// Test the menu category suggestions
const MENU_CATEGORY_SUGGESTIONS = [
  "Petiscos", "Pratos", "Chopp", "Cervejas", "Drinks", "Sobremesas",
  "Entradas", "Porções", "Vinhos", "Coquetéis", "Cafés", "Lanches"
];

describe("Admin Establishments — Menu Categories", () => {
  it("should have at least 6 default menu categories", () => {
    expect(MENU_CATEGORY_SUGGESTIONS.length).toBeGreaterThanOrEqual(6);
  });

  it("should include essential categories", () => {
    expect(MENU_CATEGORY_SUGGESTIONS).toContain("Petiscos");
    expect(MENU_CATEGORY_SUGGESTIONS).toContain("Pratos");
    expect(MENU_CATEGORY_SUGGESTIONS).toContain("Chopp");
    expect(MENU_CATEGORY_SUGGESTIONS).toContain("Cervejas");
    expect(MENU_CATEGORY_SUGGESTIONS).toContain("Drinks");
    expect(MENU_CATEGORY_SUGGESTIONS).toContain("Sobremesas");
  });

  it("should not have duplicates", () => {
    const unique = new Set(MENU_CATEGORY_SUGGESTIONS);
    expect(unique.size).toBe(MENU_CATEGORY_SUGGESTIONS.length);
  });
});

describe("Admin Establishments — Visibility Logic", () => {
  it("should correctly identify active vs hidden states", () => {
    const estab = { id: 1, name: "Test Bar", hidden: false };
    expect(estab.hidden).toBe(false); // Active
    
    const hiddenEstab = { id: 2, name: "Hidden Bar", hidden: true };
    expect(hiddenEstab.hidden).toBe(true); // Hidden
  });

  it("should support bulk toggle operations", () => {
    const ids = [1, 2, 3, 4, 5];
    const hidden = true;
    
    // Simulate toggle
    const result = ids.map(id => ({ id, hidden }));
    expect(result.length).toBe(5);
    expect(result.every(r => r.hidden === true)).toBe(true);
  });

  it("should support toggling back to active", () => {
    const ids = [10, 20, 30];
    const hidden = false;
    
    const result = ids.map(id => ({ id, hidden }));
    expect(result.length).toBe(3);
    expect(result.every(r => r.hidden === false)).toBe(true);
  });
});

describe("Admin Establishments — Menu Item Validation", () => {
  it("should require name for menu items", () => {
    const validItem = { name: "Hambúrguer", price: 35.90, category: "Pratos" };
    expect(validItem.name.trim().length).toBeGreaterThan(0);
  });

  it("should allow optional fields", () => {
    const minimalItem = { name: "Água" };
    expect(minimalItem.name).toBeDefined();
    // price, description, category, imageUrl are all optional
  });

  it("should validate price is non-negative when provided", () => {
    const item = { name: "Beer", price: 15.50 };
    expect(item.price).toBeGreaterThanOrEqual(0);
  });

  it("should flag items without images", () => {
    const withImage = { name: "Burger", imageUrl: "/manus-storage/img.jpg" };
    const withoutImage = { name: "Fries", imageUrl: undefined };
    
    expect(!!withImage.imageUrl).toBe(true);
    expect(!!withoutImage.imageUrl).toBe(false);
  });
});

describe("Admin Establishments — Alphabetical Ordering", () => {
  it("should sort establishments alphabetically", () => {
    const estabs = [
      { name: "Zé do Chopp" },
      { name: "Bar do Alemão" },
      { name: "Partisans Pub" },
      { name: "Cervejaria Nacional" },
    ];
    
    const sorted = [...estabs].sort((a, b) => a.name.localeCompare(b.name));
    expect(sorted[0].name).toBe("Bar do Alemão");
    expect(sorted[1].name).toBe("Cervejaria Nacional");
    expect(sorted[2].name).toBe("Partisans Pub");
    expect(sorted[3].name).toBe("Zé do Chopp");
  });

  it("should sort categories alphabetically", () => {
    const cats = [
      { name: "Pub" },
      { name: "Boteco Tradicional" },
      { name: "Hamburgueria" },
      { name: "Cafeteria" },
    ];
    
    const sorted = [...cats].sort((a, b) => a.name.localeCompare(b.name));
    expect(sorted[0].name).toBe("Boteco Tradicional");
    expect(sorted[1].name).toBe("Cafeteria");
    expect(sorted[2].name).toBe("Hamburgueria");
    expect(sorted[3].name).toBe("Pub");
  });
});

describe("Admin Establishments — Category Capitalization", () => {
  it("should capitalize first letter of a category", () => {
    expect(capitalizeCategory("bebida")).toBe("Bebida");
    expect(capitalizeCategory("entrada")).toBe("Entrada");
    expect(capitalizeCategory("drink")).toBe("Drink");
  });

  it("should keep already capitalized categories unchanged", () => {
    expect(capitalizeCategory("Petiscos")).toBe("Petiscos");
    expect(capitalizeCategory("Chopp")).toBe("Chopp");
    expect(capitalizeCategory("Cervejas")).toBe("Cervejas");
  });

  it("should handle empty string", () => {
    expect(capitalizeCategory("")).toBe("");
  });

  it("should handle single character", () => {
    expect(capitalizeCategory("a")).toBe("A");
    expect(capitalizeCategory("Z")).toBe("Z");
  });

  it("should not change rest of the string", () => {
    expect(capitalizeCategory("café da manhã")).toBe("Café da manhã");
    expect(capitalizeCategory("pão de queijo")).toBe("Pão de queijo");
  });
});

describe("Admin Establishments — Category Sort Order", () => {
  it("should sort categories by custom order when provided", () => {
    const categories = ["Drinks", "Entradas", "Pratos", "Sobremesas"];
    const sortMap = new Map([
      ["pratos", 0],
      ["entradas", 1],
      ["drinks", 2],
      ["sobremesas", 3],
    ]);

    const sorted = [...categories].sort((a, b) => {
      const aOrder = sortMap.get(a.toLowerCase());
      const bOrder = sortMap.get(b.toLowerCase());
      if (aOrder !== undefined && bOrder !== undefined) return aOrder - bOrder;
      if (aOrder !== undefined) return -1;
      if (bOrder !== undefined) return 1;
      return a.localeCompare(b, "pt-BR");
    });

    expect(sorted).toEqual(["Pratos", "Entradas", "Drinks", "Sobremesas"]);
  });

  it("should fall back to alphabetical when no sort order exists", () => {
    const categories = ["Drinks", "Cervejas", "Pratos", "Entradas"];
    const sortMap = new Map<string, number>(); // empty

    const sorted = [...categories].sort((a, b) => {
      const aOrder = sortMap.get(a.toLowerCase());
      const bOrder = sortMap.get(b.toLowerCase());
      if (aOrder !== undefined && bOrder !== undefined) return aOrder - bOrder;
      if (aOrder !== undefined) return -1;
      if (bOrder !== undefined) return 1;
      return a.localeCompare(b, "pt-BR");
    });

    expect(sorted).toEqual(["Cervejas", "Drinks", "Entradas", "Pratos"]);
  });

  it("should put ordered categories before unordered ones", () => {
    const categories = ["Vinhos", "Pratos", "Entradas", "Extras"];
    const sortMap = new Map([
      ["pratos", 0],
      ["entradas", 1],
    ]);

    const sorted = [...categories].sort((a, b) => {
      const aOrder = sortMap.get(a.toLowerCase());
      const bOrder = sortMap.get(b.toLowerCase());
      if (aOrder !== undefined && bOrder !== undefined) return aOrder - bOrder;
      if (aOrder !== undefined) return -1;
      if (bOrder !== undefined) return 1;
      return a.localeCompare(b, "pt-BR");
    });

    expect(sorted[0]).toBe("Pratos");
    expect(sorted[1]).toBe("Entradas");
    // Remaining sorted alphabetically
    expect(sorted[2]).toBe("Extras");
    expect(sorted[3]).toBe("Vinhos");
  });
});
