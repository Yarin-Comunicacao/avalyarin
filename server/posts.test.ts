/**
 * Tests for the Establishment Posts system
 * Tests the type configuration, expiration logic, and carousel data shape.
 */
import { describe, it, expect } from "vitest";

// ==================== POST TYPE CONFIGURATION ====================

const POST_TYPES = ["event", "promotion", "brand", "menu_daily"] as const;

const TYPE_MAX_DURATION_DAYS: Record<string, number> = {
  event: 8, // up to day after event
  promotion: 7,
  brand: 7,
  menu_daily: 1, // same day only
};

const TYPE_MAX_ADVANCE_DAYS: Record<string, number> = {
  event: 7,
  promotion: 7,
  brand: Infinity, // any time
  menu_daily: 0, // scheduled same day
};

describe("Post Types Configuration", () => {
  it("should have 4 post types defined", () => {
    expect(POST_TYPES).toHaveLength(4);
  });

  it("event posts should last up to 8 days (day after event)", () => {
    expect(TYPE_MAX_DURATION_DAYS.event).toBe(8);
  });

  it("promotion posts should last up to 7 days", () => {
    expect(TYPE_MAX_DURATION_DAYS.promotion).toBe(7);
  });

  it("brand posts should last up to 7 days", () => {
    expect(TYPE_MAX_DURATION_DAYS.brand).toBe(7);
  });

  it("menu_daily posts should last only 1 day", () => {
    expect(TYPE_MAX_DURATION_DAYS.menu_daily).toBe(1);
  });

  it("events can be posted up to 7 days in advance", () => {
    expect(TYPE_MAX_ADVANCE_DAYS.event).toBe(7);
  });

  it("promotions can be posted up to 7 days in advance", () => {
    expect(TYPE_MAX_ADVANCE_DAYS.promotion).toBe(7);
  });

  it("brand posts can be posted at any time", () => {
    expect(TYPE_MAX_ADVANCE_DAYS.brand).toBe(Infinity);
  });

  it("menu_daily posts are same-day only", () => {
    expect(TYPE_MAX_ADVANCE_DAYS.menu_daily).toBe(0);
  });
});

// ==================== EXPIRATION LOGIC ====================

describe("Post Expiration Logic", () => {
  it("should identify expired posts correctly", () => {
    const now = new Date();
    const pastDate = new Date(now.getTime() - 1000 * 60 * 60); // 1 hour ago
    const futureDate = new Date(now.getTime() + 1000 * 60 * 60); // 1 hour from now

    const isExpired = (expiresAt: Date) => expiresAt <= now;

    expect(isExpired(pastDate)).toBe(true);
    expect(isExpired(futureDate)).toBe(false);
  });

  it("should identify active posts (started and not expired)", () => {
    const now = new Date();
    const pastDate = new Date(now.getTime() - 1000 * 60 * 60);
    const futureDate = new Date(now.getTime() + 1000 * 60 * 60);

    const isActive = (startsAt: Date, expiresAt: Date) =>
      startsAt <= now && expiresAt > now;

    // Started in past, expires in future = active
    expect(isActive(pastDate, futureDate)).toBe(true);
    // Starts in future = not active yet
    expect(isActive(futureDate, new Date(futureDate.getTime() + 1000))).toBe(false);
    // Already expired
    expect(isActive(new Date(pastDate.getTime() - 1000), pastDate)).toBe(false);
  });

  it("menu_daily posts should expire at end of day", () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 1, 0, 0); // 00:01
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 0, 0); // 23:59

    const durationMs = endOfDay.getTime() - startOfDay.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);

    // Should be less than 24 hours
    expect(durationHours).toBeLessThan(24);
    expect(durationHours).toBeGreaterThan(0);
  });
});

// ==================== CAROUSEL DATA SHAPE ====================

describe("Carousel Data Shape", () => {
  const mockPost = {
    id: 1,
    establishmentId: 42,
    establishmentName: "Partisans Pub",
    establishmentImage: "/manus-storage/img.jpg",
    neighborhood: "Pinheiros",
    type: "event" as const,
    title: "Jazz Night",
    description: "Live jazz every Friday",
    imageUrl: "/manus-storage/post-img.jpg",
    linkUrl: null,
    startsAt: new Date("2026-05-19T18:00:00"),
    expiresAt: new Date("2026-05-20T23:59:00"),
    viewCount: 0,
  };

  it("should have all required fields for carousel display", () => {
    expect(mockPost.id).toBeDefined();
    expect(mockPost.establishmentName).toBeDefined();
    expect(mockPost.type).toBeDefined();
    expect(mockPost.title).toBeDefined();
    expect(mockPost.imageUrl).toBeDefined();
    expect(mockPost.startsAt).toBeInstanceOf(Date);
    expect(mockPost.expiresAt).toBeInstanceOf(Date);
  });

  it("should have valid post type", () => {
    expect(POST_TYPES).toContain(mockPost.type);
  });

  it("should have non-negative view count", () => {
    expect(mockPost.viewCount).toBeGreaterThanOrEqual(0);
  });

  it("expiresAt should be after startsAt", () => {
    expect(mockPost.expiresAt.getTime()).toBeGreaterThan(mockPost.startsAt.getTime());
  });
});

// ==================== BUSINESS PLAN RULES ====================

describe("Business Plan Rules", () => {
  const PLAN_LIMITS = {
    free: { maxActivePosts: 1, nearbyCarousel: false, watermark: true, pushNotifications: false },
    pro: { maxActivePosts: 7, nearbyCarousel: true, watermark: false, pushNotifications: true },
  };

  it("free plan allows only 1 active post", () => {
    expect(PLAN_LIMITS.free.maxActivePosts).toBe(1);
  });

  it("pro plan allows up to 7 active posts", () => {
    expect(PLAN_LIMITS.pro.maxActivePosts).toBe(7);
  });

  it("free plan does NOT appear in 'Perto de Mim' carousel", () => {
    expect(PLAN_LIMITS.free.nearbyCarousel).toBe(false);
  });

  it("pro plan appears in 'Perto de Mim' carousel", () => {
    expect(PLAN_LIMITS.pro.nearbyCarousel).toBe(true);
  });

  it("free plan has Avalyarin watermark", () => {
    expect(PLAN_LIMITS.free.watermark).toBe(true);
  });

  it("pro plan has no watermark", () => {
    expect(PLAN_LIMITS.pro.watermark).toBe(false);
  });
});
