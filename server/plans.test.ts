import { describe, it, expect } from "vitest";
import {
  PLAN_LIMITS,
  BUSINESS_PLAN_LIMITS,
} from "./db-plans";

describe("Plans System", () => {
  describe("PLAN_LIMITS constants", () => {
    it("should define 3 user plan tiers", () => {
      expect(Object.keys(PLAN_LIMITS)).toEqual(["free", "premium", "embaixador"]);
    });

    it("free plan should have 3 daily ratings limit", () => {
      expect(PLAN_LIMITS.free.dailyRatings).toBe(3);
    });

    it("premium plan should have 5 daily ratings limit", () => {
      expect(PLAN_LIMITS.premium.dailyRatings).toBe(5);
    });

    it("embaixador plan should have unlimited daily ratings", () => {
      expect(PLAN_LIMITS.embaixador.dailyRatings).toBeNull();
    });

    it("free plan should have unlimited groups", () => {
      expect(PLAN_LIMITS.free.maxGroups).toBeNull();
    });

    it("premium plan should have unlimited groups", () => {
      expect(PLAN_LIMITS.premium.maxGroups).toBeNull();
    });

    it("embaixador plan should have unlimited groups", () => {
      expect(PLAN_LIMITS.embaixador.maxGroups).toBeNull();
    });

    it("free plan should not allow specialist groups", () => {
      expect(PLAN_LIMITS.free.canCreateSpecialistGroup).toBe(false);
    });

    it("premium plan should allow specialist groups", () => {
      expect(PLAN_LIMITS.premium.canCreateSpecialistGroup).toBe(true);
    });

    it("free plan should have 1 promo code limit", () => {
      expect(PLAN_LIMITS.free.maxPromoCodes).toBe(1);
    });

    it("premium plan should have 5 promo codes limit", () => {
      expect(PLAN_LIMITS.premium.maxPromoCodes).toBe(5);
    });

    it("embaixador plan should have unlimited promo codes", () => {
      expect(PLAN_LIMITS.embaixador.maxPromoCodes).toBeNull();
    });

    it("premium plan should have Double feature", () => {
      expect(PLAN_LIMITS.premium.hasDouble).toBe(true);
    });

    it("embaixador plan should have partner discounts", () => {
      expect(PLAN_LIMITS.embaixador.hasPartnerDiscounts).toBe(true);
    });

    it("embaixador plan should have exclusive events", () => {
      expect(PLAN_LIMITS.embaixador.hasExclusiveEvents).toBe(true);
    });

    it("premium plan price should be 9.90", () => {
      expect(PLAN_LIMITS.premium.price).toBe(9.9);
    });

    it("embaixador plan price should be 19.90", () => {
      expect(PLAN_LIMITS.embaixador.price).toBe(19.9);
    });
  });

  describe("BUSINESS_PLAN_LIMITS constants", () => {
    it("should define 2 business plan tiers", () => {
      expect(Object.keys(BUSINESS_PLAN_LIMITS)).toEqual(["free", "premium"]);
    });

    it("free business plan should limit to 1 promo code", () => {
      expect(BUSINESS_PLAN_LIMITS.free.maxPromoCodes).toBe(1);
    });

    it("premium business plan should have unlimited promo codes", () => {
      expect(BUSINESS_PLAN_LIMITS.premium.maxPromoCodes).toBeNull();
    });

    it("free business plan should not have analytics", () => {
      expect(BUSINESS_PLAN_LIMITS.free.hasAnalytics).toBe(false);
    });

    it("premium business plan should have analytics", () => {
      expect(BUSINESS_PLAN_LIMITS.premium.hasAnalytics).toBe(true);
    });

    it("premium business plan price should be 29.90", () => {
      expect(BUSINESS_PLAN_LIMITS.premium.price).toBe(29.9);
    });
  });
});
