import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import { TrpcContext } from "./_core/context";

function createMockContext(userId: number | null): TrpcContext {
  return {
    req: {} as any,
    res: { clearCookie: vi.fn() } as any,
    user: userId ? {
      id: userId,
      openId: `test_${userId}`,
      name: "Test User",
      email: "test@example.com",
      role: "user",
      verified: false,
      phoneVerified: false,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } as any : null,
  };
}

describe("Profile Photo Upload", () => {
  it("should reject unauthenticated upload", async () => {
    const caller = appRouter.createCaller(createMockContext(null));
    await expect(
      caller.profile.uploadProfilePhoto({
        base64: "dGVzdA==", // "test" in base64
        mimeType: "image/jpeg",
      })
    ).rejects.toThrow();
  });

  it("should reject invalid mime type", async () => {
    const caller = appRouter.createCaller(createMockContext(1));
    await expect(
      caller.profile.uploadProfilePhoto({
        base64: "dGVzdA==",
        mimeType: "image/gif" as any,
      })
    ).rejects.toThrow();
  });

  it("should reject oversized images (>5MB)", async () => {
    const caller = appRouter.createCaller(createMockContext(1));
    // Create a base64 string that decodes to >5MB
    const largeBase64 = Buffer.alloc(6 * 1024 * 1024).toString("base64");
    await expect(
      caller.profile.uploadProfilePhoto({
        base64: largeBase64,
        mimeType: "image/jpeg",
      })
    ).rejects.toThrow(/muito grande/);
  });
});

describe("Auth Own Routes Structure", () => {
  it("should export registerOwnAuthRoutes function", async () => {
    const { registerOwnAuthRoutes } = await import("./auth-own");
    expect(typeof registerOwnAuthRoutes).toBe("function");
  });

  it("should register 4 auth routes", async () => {
    const { registerOwnAuthRoutes } = await import("./auth-own");
    const routes: string[] = [];
    const mockApp = {
      post: (path: string) => { routes.push(path); },
    } as any;
    registerOwnAuthRoutes(mockApp);
    expect(routes).toContain("/api/auth/facebook");
    expect(routes).toContain("/api/auth/google");
    expect(routes).toContain("/api/auth/register");
    expect(routes).toContain("/api/auth/login");
  });
});

describe("Schema - User Profile Fields", () => {
  it("should have profilePhotoUrl and social login fields in users schema", async () => {
    const { users } = await import("../drizzle/schema");
    // Check that the columns exist in the schema definition
    expect(users.profilePhotoUrl).toBeDefined();
    expect(users.profilePhotoKey).toBeDefined();
    expect(users.facebookId).toBeDefined();
    expect(users.googleId).toBeDefined();
    expect(users.passwordHash).toBeDefined();
    expect(users.emailVerified).toBeDefined();
  });
});
