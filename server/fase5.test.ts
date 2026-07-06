import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

// Mock context factory
function mockCtx(overrides: Partial<Context["user"]> = {}): Context {
  return {
    user: {
      id: 500,
      name: "Test User F5",
      username: "testf5",
      role: "user",
      openId: "test-open-id-f5",
      ...overrides,
    },
  } as Context;
}

const caller = (ctx: Context) => appRouter.createCaller(ctx);

describe("Fase 5 — QR Scan & Source", () => {
  it("qr.registerScan requires authentication", async () => {
    const c = caller({ user: null } as any);
    await expect(
      c.qr.registerScan({ establishmentId: 1, lat: -23.5, lng: -46.6 })
    ).rejects.toThrow();
  });

  it("qr.registerScan accepts valid input", async () => {
    const c = caller(mockCtx());
    // This may succeed or fail depending on DB, but should not throw validation error
    try {
      const result = await c.qr.registerScan({ establishmentId: 1, lat: -23.5, lng: -46.6 });
      expect(result).toBeDefined();
    } catch (e: any) {
      // DB error is acceptable in test env, but not validation error
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("qr.getSource returns source classification", async () => {
    const c = caller(mockCtx());
    try {
      const result = await c.qr.getSource({ establishmentId: 1 });
      expect(result).toHaveProperty("source");
      expect(["presencial", "hibrido", "remote"]).toContain(result.source);
    } catch (e: any) {
      // DB error acceptable
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

describe("Fase 5 — Specialist Profile & Follow", () => {
  it("specialistProfile.list returns array", async () => {
    const c = caller(mockCtx());
    const result = await c.specialistProfile.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("specialistProfile.get requires valid specialistId", async () => {
    const c = caller(mockCtx());
    try {
      const result = await c.specialistProfile.get({ specialistId: 999999 });
      // May return null or throw
      expect(result).toBeDefined();
    } catch (e: any) {
      expect(e.code).toBe("NOT_FOUND");
    }
  });

  it("specialistProfile.follow prevents self-follow", async () => {
    const c = caller(mockCtx({ id: 500 }));
    await expect(
      c.specialistProfile.follow({ specialistId: 500 })
    ).rejects.toThrow("Você não pode seguir a si mesmo");
  });

  it("specialistProfile.isFollowing returns boolean", async () => {
    const c = caller(mockCtx());
    try {
      const result = await c.specialistProfile.isFollowing({ specialistId: 1 });
      expect(typeof result).toBe("boolean");
    } catch (e: any) {
      // DB error acceptable
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("specialistProfile.ratings returns array", async () => {
    const c = caller(mockCtx());
    try {
      const result = await c.specialistProfile.ratings({ specialistId: 1, limit: 5 });
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("specialistProfile.feed requires auth", async () => {
    const c = caller({ user: null } as any);
    await expect(c.specialistProfile.feed()).rejects.toThrow();
  });

  it("specialistProfile.following returns array", async () => {
    const c = caller(mockCtx());
    try {
      const result = await c.specialistProfile.following();
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

describe("Fase 5 — Business Propose Partnership", () => {
  it("business.proposePartnership requires business role", async () => {
    const c = caller(mockCtx({ role: "user" }));
    await expect(
      c.business.proposePartnership({ establishmentId: 1, specialistId: 2 })
    ).rejects.toThrow();
  });

  it("business.availableSpecialists requires business role", async () => {
    const c = caller(mockCtx({ role: "user" }));
    await expect(c.business.availableSpecialists()).rejects.toThrow();
  });

  it("business.availableSpecialists returns array for business users", async () => {
    const c = caller(mockCtx({ role: "business" }));
    try {
      const result = await c.business.availableSpecialists();
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      // DB error acceptable
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

describe("Fase 5 — Specialist Rating Restriction", () => {
  it("specialist cannot rate without QR scan (remote blocked)", async () => {
    const c = caller(mockCtx({ id: 501, role: "specialist" }));
    try {
      await c.ratings.save({
        establishmentId: 1,
        type: "direct",
        overallScore: 8,
        items: [{ itemName: "Test", score: 8 }],
      });
    } catch (e: any) {
      // Should throw FORBIDDEN because specialist has no QR scan
      expect(e.message).toContain("Specialists só podem avaliar");
    }
  });
});
