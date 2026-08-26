import { describe, expect, it } from "vitest";
import { generateMenuItemTags, generateProductTags } from "./auto-tags";

describe("automatic menu item tags", () => {
  it("includes the physical menu section with the item tags", () => {
    const tags = generateMenuItemTags("Cachaça Artesanal", "Bebidas de Boteco");

    expect(tags).toContain("cachaça");
    expect(tags).toContain("bebidas de boteco");
    expect(tags).toContain("bebidas de boteco cachaça");
    expect(tags).toContain("bebidas de boteco cachaça artesanal");
  });

  it("keeps the existing product tag behavior when no category is provided", () => {
    expect(generateMenuItemTags("Bolinho de Carne", null)).toEqual(generateProductTags("Bolinho de Carne"));
  });
});
