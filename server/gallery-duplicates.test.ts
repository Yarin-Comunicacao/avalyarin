import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(role: string = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: role as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { headers: {} } as any,
    res: { cookie: () => {}, clearCookie: () => {} } as any,
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { headers: {} } as any,
    res: { cookie: () => {}, clearCookie: () => {} } as any,
  };
}

describe("Gallery endpoints", () => {
  it("myGallery should be a protected procedure", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.ratings.myGallery({ limit: 10 })).rejects.toThrow();
  });

  it("myGallery should accept limit parameter", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.ratings.myGallery({ limit: 5 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("toggleLike should be a protected procedure", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.ratings.toggleLike({ photoId: 1 })).rejects.toThrow();
  });

  it("likesBatch should return like data for given photoIds", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.ratings.likesBatch({ photoIds: [1, 2] });
    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
  });

  it("userGallery should be a public procedure", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.ratings.userGallery({ userId: 999, limit: 10 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Duplicate alerts endpoints", () => {
  it("admin.duplicateAlerts should require admin role", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));
    await expect(caller.admin.duplicateAlerts({ status: "pending" })).rejects.toThrow();
  });

  it("admin.duplicateAlerts should work for admin", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    const result = await caller.admin.duplicateAlerts({ status: "pending" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("admin.duplicateAlertCount should return a number for admin", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    const result = await caller.admin.duplicateAlertCount();
    expect(typeof result).toBe("number");
  });

  it("support.detectDuplicates should require support role", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));
    await expect(caller.support.detectDuplicates({ phone: "11999999999" })).rejects.toThrow();
  });

  it("support.detectDuplicates should work for support role", async () => {
    const caller = appRouter.createCaller(createUserContext("support"));
    const result = await caller.support.detectDuplicates({ phone: "11999999999" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("support.flagDuplicate should require support role", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));
    await expect(
      caller.support.flagDuplicate({
        existingEstablishmentId: 1,
        newEstablishmentId: 2,
        reason: "same_phone",
      })
    ).rejects.toThrow();
  });
});

describe("Complement validation for multi-tenant addresses", () => {
  it("should reject creation without complement when address contains 'shopping'", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    await expect(
      caller.admin.createEstablishment({
        name: "Loja Teste Shopping",
        categoryId: 1,
        address: "Avenida Paulista, 1000 - Shopping Cidade",
        neighborhood: "Bela Vista",
        phone: "(11) 99999-9999",
        instagram: "@lojateste",
        hours: "Seg a Sex: 10h-22h",
      })
    ).rejects.toThrow(/[Cc]omplemento/);
  });

  it("should accept creation with complement when address contains 'shopping'", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    // This may fail due to DB constraints but should NOT fail on complement validation
    try {
      await caller.admin.createEstablishment({
        name: "Loja Teste Shopping OK",
        categoryId: 1,
        address: "Avenida Paulista, 1000 - Shopping Cidade",
        complement: "Loja 42, Piso 2",
        neighborhood: "Bela Vista",
        phone: "(11) 99999-9999",
        instagram: "@lojatesteok",
        hours: "Seg a Sex: 10h-22h",
      });
    } catch (e: any) {
      // Should NOT be a complement error
      expect(e.message).not.toMatch(/[Cc]omplemento/);
    }
  });

  it("should accept creation without complement when address does NOT contain multi-tenant keywords", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    try {
      await caller.admin.createEstablishment({
        name: "Bar Normal Teste",
        categoryId: 1,
        address: "Rua Augusta, 500",
        neighborhood: "Consolação",
        phone: "(11) 88888-8888",
        instagram: "@barnormal",
        hours: "Seg a Sab: 18h-02h",
      });
    } catch (e: any) {
      // Should NOT be a complement error
      expect(e.message).not.toMatch(/[Cc]omplemento/);
    }
  });
});
