import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { ratings } from "../drizzle/schema";
import { eq } from "drizzle-orm";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "user" | "admin" | "owner" | "business" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 99,
    openId: "test-user-ratings",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("ratings.save", () => {
  beforeAll(async () => {
    // Clean up test user ratings to avoid daily limit issues
    const db = await getDb();
    if (db) {
      await db.delete(ratings).where(eq(ratings.userId, 99));
    }
  });

  it("rejects unauthenticated users", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.ratings.save({
        establishmentId: 1,
        type: "direct",
        overallScore: 7.5,
        items: [{ itemName: "Test Item", score: 8 }],
      })
    ).rejects.toThrow();
  });

  it("validates input schema - type must be direct or analytic", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.ratings.save({
        establishmentId: 1,
        type: "invalid" as any,
        overallScore: 7.5,
        items: [{ itemName: "Test Item", score: 8 }],
      })
    ).rejects.toThrow();
  });

  it("validates overallScore range (0-10)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.ratings.save({
        establishmentId: 1,
        type: "direct",
        overallScore: 25,
        items: [{ itemName: "Test Item", score: 8 }],
      })
    ).rejects.toThrow();
  });

  it("validates item score range (0-10)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.ratings.save({
        establishmentId: 1,
        type: "direct",
        overallScore: 8,
        items: [{ itemName: "Test Item", score: 15 }],
      })
    ).rejects.toThrow();
  });

  it("accepts empty items array (saves rating without items)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ratings.save({
      establishmentId: 1,
      type: "direct",
      overallScore: 7.5,
      items: [],
    });
    expect(result).toHaveProperty("success", true);
  });

  it("accepts valid input with all optional fields (no bonusScores)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.ratings.save({
        establishmentId: 999999,
        type: "analytic",
        visitDate: "2025-01-15T00:00:00.000Z",
        overallScore: 8.5,
        subtotal: 150.50,
        servicePercent: 10,
        couvert: 15,
        valet: 30,
        parking: 20,
        totalCost: 215.50,
        criteriaScores: { globalRatings: [], itemRatings: [] },
        items: [
          {
            menuItemId: 1,
            itemName: "Cerveja Artesanal",
            score: 9,
            comment: "Excelente sabor e temperatura perfeita",
            quantity: 2,
            price: 25.90,
          },
        ],
      });
    } catch (e: any) {
      // Expected to fail at DB level, but should NOT be a validation error
      expect(e.message).not.toContain("Expected");
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

describe("ratings.byEstablishment", () => {
  it("is a public procedure (no auth required)", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.ratings.byEstablishment({
        establishmentId: 1,
        limit: 10,
        offset: 0,
      });
    } catch (e: any) {
      // Should not be an auth error
      expect(e.message).not.toContain("login");
    }
  });
});
