import { describe, expect, it } from "vitest";
import { getEstablishmentVisibilityStatus } from "./db";

describe("visibility requires menu items", () => {
  it("keeps an establishment pending when the menu has no items", () => {
    expect(getEstablishmentVisibilityStatus({ address: "Rua A", hours: "18:00-23:00", hasMenu: true, menuItemCount: 0 })).toBe("pending");
  });

  it("activates an establishment with at least one item and complete data", () => {
    expect(getEstablishmentVisibilityStatus({ address: "Rua A", hours: "18:00-23:00", hasMenu: true, menuItemCount: 1 })).toBe("active");
  });
});
