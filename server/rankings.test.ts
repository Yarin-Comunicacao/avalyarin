import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { Request, Response } from "express";

// ── helpers ────────────────────────────────────────────────────────────────
const fakeReq = {} as Request;
const fakeRes = { clearCookie: () => {} } as unknown as Response;

function makeCtx(user: TrpcContext["user"] = null): TrpcContext {
  return { req: fakeReq, res: fakeRes, user };
}

const authedCtx = makeCtx({ id: 99, openId: "test-user-99", name: "Tester", role: "user" } as any);
const unauthedCtx = makeCtx(null);

// ── tests ──────────────────────────────────────────────────────────────────
describe("rankings router", () => {
  const caller = appRouter.createCaller(authedCtx);
  const unauthedCaller = appRouter.createCaller(unauthedCtx);

  describe("rankings.save", () => {
    it("rejects unauthenticated users", async () => {
      await expect(
        unauthedCaller.rankings.save({
          categoryId: 1,
          items: [{ establishmentId: 1, position: 1 }],
        })
      ).rejects.toThrow();
    });

    it("validates position range (min 1)", async () => {
      await expect(
        caller.rankings.save({
          categoryId: 1,
          items: [{ establishmentId: 1, position: 0 }],
        })
      ).rejects.toThrow();
    });

    it("validates position range (max 10)", async () => {
      await expect(
        caller.rankings.save({
          categoryId: 1,
          items: [{ establishmentId: 1, position: 11 }],
        })
      ).rejects.toThrow();
    });

    it("validates items array (min 1 item required)", async () => {
      await expect(
        caller.rankings.save({
          categoryId: 1,
          items: [],
        })
      ).rejects.toThrow();
    });

    it("validates items array (max 10 items)", async () => {
      const items = Array.from({ length: 11 }, (_, i) => ({
        establishmentId: i + 1,
        position: Math.min(i + 1, 10),
      }));
      await expect(
        caller.rankings.save({
          categoryId: 1,
          items,
        })
      ).rejects.toThrow();
    });

    it("accepts valid ranking input (schema passes)", async () => {
      try {
        await caller.rankings.save({
          categoryId: 1,
          items: [
            { establishmentId: 10, position: 1 },
            { establishmentId: 20, position: 2 },
            { establishmentId: 30, position: 3 },
          ],
        });
      } catch (e: any) {
        // If it fails, it should NOT be a Zod validation error
        expect(e.code).not.toBe("BAD_REQUEST");
      }
    });
  });

  describe("rankings.ratedInCategory", () => {
    it("rejects unauthenticated users", async () => {
      await expect(
        unauthedCaller.rankings.ratedInCategory({ categoryId: 1 })
      ).rejects.toThrow();
    });

    it("validates categoryId is required", async () => {
      await expect(
        // @ts-expect-error testing missing input
        caller.rankings.ratedInCategory({})
      ).rejects.toThrow();
    });
  });

  describe("rankings.getByCategory", () => {
    it("rejects unauthenticated users", async () => {
      await expect(
        unauthedCaller.rankings.getByCategory({ categoryId: 1 })
      ).rejects.toThrow();
    });
  });

  describe("rankings.summary", () => {
    it("rejects unauthenticated users", async () => {
      await expect(
        unauthedCaller.rankings.summary()
      ).rejects.toThrow();
    });
  });

  describe("rankings.discover", () => {
    it("rejects unauthenticated users", async () => {
      await expect(
        unauthedCaller.rankings.discover({ categoryId: 1 })
      ).rejects.toThrow();
    });

    it("validates limit range", async () => {
      await expect(
        caller.rankings.discover({ categoryId: 1, limit: 25 })
      ).rejects.toThrow();
    });

    it("accepts optional lat/lng", async () => {
      try {
        await caller.rankings.discover({ categoryId: 1, lat: -23.56, lng: -46.66, limit: 6 });
      } catch (e: any) {
        // Should not be a validation error
        expect(e.code).not.toBe("BAD_REQUEST");
      }
    });
  });
});
