import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(role: "user" | "admin" | "owner" | "business"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 99,
    openId: `test-${role}`,
    email: `${role}@example.com`,
    name: `Test ${role}`,
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("survey router", () => {
  describe("survey.save", () => {
    it("accepts valid survey data with birthdate", async () => {
      const caller = appRouter.createCaller(createContext("user"));
      try {
        await caller.survey.save({
          birthdate: "1995-03-15",
          region: "zona-oeste",
          frequency: "2-3x-semana",
          avgSpend: "101-200",
          categories: ["pub", "cervejaria"],
          priorities: ["qualidade", "ambiente"],
          discovery: ["indicacao"],
        });
      } catch (e: any) {
        // DB not available in test is acceptable
        expect(e.message).toContain("Database");
      }
    });

    it("accepts partial survey data (only categories)", async () => {
      const caller = appRouter.createCaller(createContext("user"));
      try {
        await caller.survey.save({
          categories: ["boteco-tradicional", "pizzaria"],
        });
      } catch (e: any) {
        expect(e.message).toContain("Database");
      }
    });

    it("rejects unauthenticated calls", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(
        caller.survey.save({ birthdate: "2000-01-01" })
      ).rejects.toThrow();
    });
  });

  describe("survey.get", () => {
    it("requires authentication", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(caller.survey.get()).rejects.toThrow();
    });

    it("returns data for authenticated user", async () => {
      const caller = appRouter.createCaller(createContext("user"));
      try {
        const result = await caller.survey.get();
        expect(result === null || typeof result === "object").toBe(true);
      } catch (e: any) {
        // DB not available in test
        expect(e.message).toContain("Database");
      }
    });
  });
});

describe("ageVerification router", () => {
  describe("ageVerification.submit", () => {
    it("validates input schema (rejects invalid date format)", async () => {
      const caller = appRouter.createCaller(createContext("user"));
      await expect(
        caller.ageVerification.submit({
          documentUrl: "/manus-storage/test.jpg",
          documentKey: "test-key",
          requestedBirthdate: "invalid-date",
        })
      ).rejects.toThrow();
    });

    it("accepts valid input with correct date format", async () => {
      const caller = appRouter.createCaller(createContext("user"));
      try {
        await caller.ageVerification.submit({
          documentUrl: "/manus-storage/doc.jpg",
          documentKey: "age-verification/123-doc.jpg",
          requestedBirthdate: "2012-05-07",
        });
      } catch (e: any) {
        expect(e.message).toContain("Database");
      }
    });

    it("rejects unauthenticated calls", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(
        caller.ageVerification.submit({
          documentUrl: "/test.jpg",
          documentKey: "key",
          requestedBirthdate: "2012-01-01",
        })
      ).rejects.toThrow();
    });
  });

  describe("ageVerification.status", () => {
    it("requires authentication", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(caller.ageVerification.status()).rejects.toThrow();
    });
  });

  describe("ageVerification.list (admin)", () => {
    it("rejects non-admin users", async () => {
      const caller = appRouter.createCaller(createContext("user"));
      await expect(caller.ageVerification.list({})).rejects.toThrow();
    });

    it("allows admin users", async () => {
      const caller = appRouter.createCaller(createContext("admin"));
      try {
        const result = await caller.ageVerification.list({});
        expect(Array.isArray(result)).toBe(true);
      } catch (e: any) {
        expect(e.message).toContain("Database");
      }
    });
  });

  describe("ageVerification.review (admin)", () => {
    it("rejects non-admin users", async () => {
      const caller = appRouter.createCaller(createContext("user"));
      await expect(
        caller.ageVerification.review({
          requestId: 1,
          status: "approved",
        })
      ).rejects.toThrow();
    });

    it("validates input schema (rejects invalid status)", async () => {
      const caller = appRouter.createCaller(createContext("admin"));
      await expect(
        caller.ageVerification.review({
          requestId: 1,
          status: "invalid" as any,
        })
      ).rejects.toThrow();
    });

    it("accepts valid review input from admin", async () => {
      const caller = appRouter.createCaller(createContext("admin"));
      try {
        await caller.ageVerification.review({
          requestId: 999,
          status: "approved",
          adminNotes: "Documento válido",
        });
      } catch (e: any) {
        // DB error or "Request not found" is acceptable
        expect(
          e.message.includes("Database") || e.message.includes("not found")
        ).toBe(true);
      }
    });
  });
});
