import { describe, it, expect } from "vitest";
import { canSeeRole, getVisibleRoles, ROLE_HIERARCHY, ROLE_BOTTOM_NAV, ROLE_COLORS, type AppRole } from "../shared/role-visibility";

describe("Role Visibility Rules", () => {
  describe("canSeeRole", () => {
    it("user can see user, influencer, business", () => {
      expect(canSeeRole("user", "user")).toBe(true);
      expect(canSeeRole("user", "influencer")).toBe(true);
      expect(canSeeRole("user", "business")).toBe(true);
    });

    it("user cannot see support, admin, owner", () => {
      expect(canSeeRole("user", "support")).toBe(false);
      expect(canSeeRole("user", "admin")).toBe(false);
      expect(canSeeRole("user", "owner")).toBe(false);
    });

    it("influencer can see user, influencer, business, support", () => {
      expect(canSeeRole("influencer", "user")).toBe(true);
      expect(canSeeRole("influencer", "influencer")).toBe(true);
      expect(canSeeRole("influencer", "business")).toBe(true);
      expect(canSeeRole("influencer", "support")).toBe(true);
    });

    it("influencer cannot see admin, owner", () => {
      expect(canSeeRole("influencer", "admin")).toBe(false);
      expect(canSeeRole("influencer", "owner")).toBe(false);
    });

    it("business can see user, influencer, business, support", () => {
      expect(canSeeRole("business", "user")).toBe(true);
      expect(canSeeRole("business", "influencer")).toBe(true);
      expect(canSeeRole("business", "business")).toBe(true);
      expect(canSeeRole("business", "support")).toBe(true);
    });

    it("business cannot see admin, owner", () => {
      expect(canSeeRole("business", "admin")).toBe(false);
      expect(canSeeRole("business", "owner")).toBe(false);
    });

    it("support can see all except owner", () => {
      expect(canSeeRole("support", "user")).toBe(true);
      expect(canSeeRole("support", "influencer")).toBe(true);
      expect(canSeeRole("support", "business")).toBe(true);
      expect(canSeeRole("support", "support")).toBe(true);
      expect(canSeeRole("support", "admin")).toBe(true);
    });

    it("support cannot see owner", () => {
      expect(canSeeRole("support", "owner")).toBe(false);
    });

    it("admin can see all roles", () => {
      const allRoles: AppRole[] = ["user", "influencer", "critic", "business", "support", "admin", "owner"];
      allRoles.forEach((role) => {
        expect(canSeeRole("admin", role)).toBe(true);
      });
    });

    it("owner can see all roles", () => {
      const allRoles: AppRole[] = ["user", "influencer", "critic", "business", "support", "admin", "owner"];
      allRoles.forEach((role) => {
        expect(canSeeRole("owner", role)).toBe(true);
      });
    });
  });

  describe("getVisibleRoles", () => {
    it("returns correct number of visible roles per role", () => {
      expect(getVisibleRoles("user")).toHaveLength(4);
      expect(getVisibleRoles("influencer")).toHaveLength(5);
      expect(getVisibleRoles("critic")).toHaveLength(5);
      expect(getVisibleRoles("business")).toHaveLength(5);
      expect(getVisibleRoles("support")).toHaveLength(6);
      expect(getVisibleRoles("admin")).toHaveLength(7);
      expect(getVisibleRoles("owner")).toHaveLength(7);
    });
  });

  describe("ROLE_HIERARCHY", () => {
    it("owner has highest hierarchy", () => {
      expect(ROLE_HIERARCHY.owner).toBe(7);
    });

    it("user has lowest hierarchy", () => {
      expect(ROLE_HIERARCHY.user).toBe(1);
    });

    it("support is between business and admin", () => {
      expect(ROLE_HIERARCHY.support).toBeGreaterThan(ROLE_HIERARCHY.business);
      expect(ROLE_HIERARCHY.support).toBeLessThan(ROLE_HIERARCHY.admin);
    });
  });

  describe("ROLE_BOTTOM_NAV", () => {
    it("each role has at least 5 nav items", () => {
      const allRoles: AppRole[] = ["user", "influencer", "critic", "business", "support", "admin", "owner"];
      allRoles.forEach((role) => {
        expect(ROLE_BOTTOM_NAV[role].length).toBeGreaterThanOrEqual(5);
      });
    });

    it("user nav includes Busca, Mapa, Grupos, Avaliações, Perfil", () => {
      const labels = ROLE_BOTTOM_NAV.user.map((item) => item.label);
      expect(labels).toContain("Busca");
      expect(labels).toContain("Mapa");
      expect(labels).toContain("Grupos");
      expect(labels).toContain("Avaliações");
      expect(labels).toContain("Perfil");
    });

    it("support nav has Estabs as central item", () => {
      const supportNav = ROLE_BOTTOM_NAV.support;
      // Central item is index 2
      expect(supportNav[2].label).toBe("Estabs");
      expect(supportNav[2].icon).toBe("Store");
    });

    it("business nav includes Meus Locais", () => {
      const labels = ROLE_BOTTOM_NAV.business.map((item) => item.label);
      expect(labels).toContain("Meus Locais");
    });
  });

  describe("ROLE_COLORS", () => {
    it("all roles have primary, border, and badge colors defined", () => {
      const allRoles: AppRole[] = ["user", "influencer", "critic", "business", "support", "admin", "owner"];
      allRoles.forEach((role) => {
        expect(ROLE_COLORS[role]).toHaveProperty("primary");
        expect(ROLE_COLORS[role]).toHaveProperty("border");
        expect(ROLE_COLORS[role]).toHaveProperty("badge");
      });
    });

    it("support color is teal", () => {
      expect(ROLE_COLORS.support.primary).toBe("#14b8a6");
    });

    it("admin color is red", () => {
      expect(ROLE_COLORS.admin.primary).toBe("#ef4444");
    });
  });
});
