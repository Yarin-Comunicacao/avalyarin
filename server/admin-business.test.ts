import { describe, expect, it } from "vitest";
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

// ============ ADMIN PROCEDURES ============

describe("admin.stats", () => {
  it("rejects unauthenticated users", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.admin.stats()).rejects.toThrow();
  });

  it("rejects regular users", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.admin.stats()).rejects.toThrow();
  });

  it("rejects business users", async () => {
    const caller = appRouter.createCaller(createContext("business"));
    await expect(caller.admin.stats()).rejects.toThrow();
  });

  it("allows admin users", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    const result = await caller.admin.stats();
    expect(result).toBeDefined();
    expect(result).toHaveProperty("users");
  });

  it("allows owner users", async () => {
    const caller = appRouter.createCaller(createContext("owner"));
    const result = await caller.admin.stats();
    expect(result).toBeDefined();
  });
});

describe("admin.updateUserRole", () => {
  it("rejects regular users", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(
      caller.admin.updateUserRole({ userId: 1, role: "admin" })
    ).rejects.toThrow();
  });

  it("validates role enum", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    await expect(
      caller.admin.updateUserRole({ userId: 1, role: "superadmin" as any })
    ).rejects.toThrow();
  });
});

describe("admin.reviewClaim", () => {
  it("rejects unauthenticated users", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(
      caller.admin.reviewClaim({ claimId: 1, status: "approved" })
    ).rejects.toThrow();
  });

  it("validates status enum (approved/rejected only)", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    await expect(
      caller.admin.reviewClaim({ claimId: 1, status: "pending" as any })
    ).rejects.toThrow();
  });
});

// ============ BUSINESS PROCEDURES ============

describe("business.submitClaim", () => {
  it("rejects unauthenticated users", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(
      caller.business.submitClaim({
        establishmentId: 1,
        businessName: "Meu Bar",
        contactPhone: "11999999999",
        contactEmail: "bar@test.com",
        proofDescription: "Sou o proprietário, tenho CNPJ e alvará",
      })
    ).rejects.toThrow();
  });

  it("validates email format", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(
      caller.business.submitClaim({
        establishmentId: 1,
        businessName: "Meu Bar",
        contactPhone: "11999999999",
        contactEmail: "invalid-email",
        proofDescription: "Sou o proprietário, tenho CNPJ e alvará",
      })
    ).rejects.toThrow();
  });

  it("validates proofDescription minimum length", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(
      caller.business.submitClaim({
        establishmentId: 1,
        businessName: "Meu Bar",
        contactPhone: "11999999999",
        contactEmail: "bar@test.com",
        proofDescription: "short",
      })
    ).rejects.toThrow();
  });
});

describe("business.myEstablishments", () => {
  it("rejects unauthenticated users", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.business.myEstablishments()).rejects.toThrow();
  });

  it("rejects regular users", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.business.myEstablishments()).rejects.toThrow();
  });

  it("allows business users", async () => {
    const caller = appRouter.createCaller(createContext("business"));
    const result = await caller.business.myEstablishments();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("business.addMenuItem", () => {
  it("rejects regular users", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(
      caller.business.addMenuItem({
        establishmentId: 1,
        name: "Nova Cerveja",
        price: 15.90,
        category: "bebida",
      })
    ).rejects.toThrow();
  });

  it("validates name is required (min 1 char)", async () => {
    const caller = appRouter.createCaller(createContext("business"));
    await expect(
      caller.business.addMenuItem({
        establishmentId: 1,
        name: "",
        price: 15.90,
      })
    ).rejects.toThrow();
  });
});

describe("business.updateMenuItem", () => {
  it("rejects unauthenticated users", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(
      caller.business.updateMenuItem({
        menuItemId: 1,
        name: "Updated Name",
      })
    ).rejects.toThrow();
  });

  it("rejects regular users", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(
      caller.business.updateMenuItem({
        menuItemId: 1,
        name: "Updated Name",
      })
    ).rejects.toThrow();
  });

  it("validates menuItemId is required", async () => {
    const caller = appRouter.createCaller(createContext("business"));
    await expect(
      // @ts-expect-error - testing missing required field
      caller.business.updateMenuItem({
        name: "Updated Name",
      })
    ).rejects.toThrow();
  });

  it("allows business users with valid input", async () => {
    const caller = appRouter.createCaller(createContext("business"));
    // This will fail at DB level (item not found) but validates input schema passes
    try {
      await caller.business.updateMenuItem({
        menuItemId: 999999,
        name: "Updated Name",
        price: 25.50,
      });
    } catch (e: any) {
      // Expected: DB error (item not found or not owned), NOT a validation error
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

describe("business.notifications", () => {
  it("rejects unauthenticated users", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.business.notifications()).rejects.toThrow();
  });

  it("rejects regular users", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.business.notifications()).rejects.toThrow();
  });

  it("allows business users and returns array", async () => {
    const caller = appRouter.createCaller(createContext("business"));
    const result = await caller.business.notifications();
    expect(Array.isArray(result)).toBe(true);
  });
});
