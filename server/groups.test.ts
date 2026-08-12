import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

// ─── Schema Validation Tests ─────────────────────────────────────────────────
describe("Groups - Schema Validation", () => {
  const createGroupSchema = z.object({
    name: z.string().min(2).max(255),
    description: z.string().max(500).optional(),
    type: z.enum(["private", "specialist"]),
  });

  it("should accept valid private group creation", () => {
    const result = createGroupSchema.safeParse({
      name: "Amigos Foodie",
      description: "Grupo de amigos que amam comida",
      type: "private",
    });
    expect(result.success).toBe(true);
  });

  it("should accept valid specialist group creation", () => {
    const result = createGroupSchema.safeParse({
      name: "Chef Reviews",
      type: "specialist",
    });
    expect(result.success).toBe(true);
  });

  it("should reject group with empty name", () => {
    const result = createGroupSchema.safeParse({
      name: "",
      type: "private",
    });
    expect(result.success).toBe(false);
  });

  it("should reject group with name too short", () => {
    const result = createGroupSchema.safeParse({
      name: "A",
      type: "private",
    });
    expect(result.success).toBe(false);
  });

  it("should reject group with invalid type", () => {
    const result = createGroupSchema.safeParse({
      name: "Test Group",
      type: "public",
    });
    expect(result.success).toBe(false);
  });

  it("should accept group without description", () => {
    const result = createGroupSchema.safeParse({
      name: "No Desc Group",
      type: "private",
    });
    expect(result.success).toBe(true);
  });
});

// ─── Invite Schema Tests ─────────────────────────────────────────────────────
describe("Groups - Invite Schema Validation", () => {
  const inviteSchema = z.object({
    groupId: z.number().int().positive(),
    username: z.string().min(1),
  });

  it("should accept valid invite", () => {
    const result = inviteSchema.safeParse({
      groupId: 1,
      username: "johndoe",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invite with invalid groupId", () => {
    const result = inviteSchema.safeParse({
      groupId: -1,
      username: "johndoe",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invite with empty username", () => {
    const result = inviteSchema.safeParse({
      groupId: 1,
      username: "",
    });
    expect(result.success).toBe(false);
  });
});

// ─── Respond Invite Schema Tests ─────────────────────────────────────────────
describe("Groups - Respond Invite Schema Validation", () => {
  const respondInviteSchema = z.object({
    inviteId: z.number().int().positive(),
    accept: z.boolean(),
  });

  it("should accept valid accept response", () => {
    const result = respondInviteSchema.safeParse({
      inviteId: 1,
      accept: true,
    });
    expect(result.success).toBe(true);
  });

  it("should accept valid decline response", () => {
    const result = respondInviteSchema.safeParse({
      inviteId: 1,
      accept: false,
    });
    expect(result.success).toBe(true);
  });

  it("should reject response with invalid inviteId", () => {
    const result = respondInviteSchema.safeParse({
      inviteId: 0,
      accept: true,
    });
    expect(result.success).toBe(false);
  });
});

// ─── Plan Limit Logic Tests ──────────────────────────────────────────────────
describe("Groups - Plan Limit Logic", () => {
  const FREE_GROUP_LIMIT = 3;

  function canCreateGroup(plan: string, type: string, currentGroupCount: number): { allowed: boolean; reason?: string } {
    if (type === "specialist" && plan !== "premium") {
      return { allowed: false, reason: "PLAN_REQUIRED" };
    }
    if (plan === "free" && currentGroupCount >= FREE_GROUP_LIMIT) {
      return { allowed: false, reason: "PLAN_LIMIT" };
    }
    return { allowed: true };
  }

  it("should allow free user to create private group (under limit)", () => {
    const result = canCreateGroup("free", "private", 0);
    expect(result.allowed).toBe(true);
  });

  it("should allow free user to create up to 3 private groups", () => {
    expect(canCreateGroup("free", "private", 0).allowed).toBe(true);
    expect(canCreateGroup("free", "private", 1).allowed).toBe(true);
    expect(canCreateGroup("free", "private", 2).allowed).toBe(true);
  });

  it("should block free user from creating 4th group", () => {
    const result = canCreateGroup("free", "private", 3);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("PLAN_LIMIT");
  });

  it("should block free user from creating specialist group", () => {
    const result = canCreateGroup("free", "specialist", 0);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("PLAN_REQUIRED");
  });

  it("should allow premium user to create specialist group", () => {
    const result = canCreateGroup("premium", "specialist", 0);
    expect(result.allowed).toBe(true);
  });

  it("should allow premium user to create unlimited groups", () => {
    const result = canCreateGroup("premium", "private", 10);
    expect(result.allowed).toBe(true);
  });

  it("should allow premium user to create specialist group even with many groups", () => {
    const result = canCreateGroup("premium", "specialist", 50);
    expect(result.allowed).toBe(true);
  });
});

// ─── Share Rating Logic Tests ────────────────────────────────────────────────
describe("Groups - Share Rating Logic", () => {
  function canShareRating(
    groupType: string,
    userId: number,
    creatorId: number,
    ratingOwnerId: number
  ): { allowed: boolean; reason?: string } {
    // User can only share their own ratings
    if (userId !== ratingOwnerId) {
      return { allowed: false, reason: "NOT_OWNER" };
    }
    // In specialist groups, only the creator can share
    if (groupType === "specialist" && userId !== creatorId) {
      return { allowed: false, reason: "CREATOR_ONLY" };
    }
    return { allowed: true };
  }

  it("should allow user to share own rating in private group", () => {
    const result = canShareRating("private", 1, 2, 1);
    expect(result.allowed).toBe(true);
  });

  it("should block sharing another user's rating", () => {
    const result = canShareRating("private", 1, 2, 3);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("NOT_OWNER");
  });

  it("should allow creator to share in specialist group", () => {
    const result = canShareRating("specialist", 1, 1, 1);
    expect(result.allowed).toBe(true);
  });

  it("should block non-creator from sharing in specialist group", () => {
    const result = canShareRating("specialist", 2, 1, 2);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("CREATOR_ONLY");
  });
});

// ─── Search Users Schema Tests ───────────────────────────────────────────────
describe("Groups - Search Users Schema", () => {
  const searchSchema = z.object({
    query: z.string().min(2).max(50),
  });

  it("should accept valid search query", () => {
    const result = searchSchema.safeParse({ query: "john" });
    expect(result.success).toBe(true);
  });

  it("should reject too short query", () => {
    const result = searchSchema.safeParse({ query: "j" });
    expect(result.success).toBe(false);
  });

  it("should reject empty query", () => {
    const result = searchSchema.safeParse({ query: "" });
    expect(result.success).toBe(false);
  });
});

// ─── Follow/Unfollow Schema Tests ────────────────────────────────────────────
describe("Groups - Follow/Unfollow Schema", () => {
  const followSchema = z.object({
    groupId: z.number().int().positive(),
  });

  it("should accept valid follow request", () => {
    const result = followSchema.safeParse({ groupId: 42 });
    expect(result.success).toBe(true);
  });

  it("should reject invalid groupId", () => {
    const result = followSchema.safeParse({ groupId: 0 });
    expect(result.success).toBe(false);
  });

  it("should reject negative groupId", () => {
    const result = followSchema.safeParse({ groupId: -5 });
    expect(result.success).toBe(false);
  });
});
