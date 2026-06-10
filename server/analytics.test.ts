import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db-analytics module
vi.mock("./db-analytics", () => ({
  getAdminDashboardData: vi.fn(),
  getBusinessInsights: vi.fn(),
  getUserStats: vi.fn(),
}));

import { getAdminDashboardData, getBusinessInsights, getUserStats } from "./db-analytics";

describe("Analytics Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAdminDashboardData", () => {
    it("should return null when db is unavailable", async () => {
      (getAdminDashboardData as any).mockResolvedValue(null);
      const result = await getAdminDashboardData();
      expect(result).toBeNull();
    });

    it("should return dashboard data with correct structure", async () => {
      const mockData = {
        overview: {
          totalUsers: 150,
          totalEstablishments: 45,
          totalRatings: 890,
          totalCategories: 8,
          activePromos: 12,
          pendingClaims: 3,
        },
        growth: {
          usersLast7Days: 10,
          ratingsLast7Days: 42,
          newEstablishmentsLast7Days: 2,
        },
        topEstablishments: [
          { id: 1, name: "Bar do Zé", avgScore: 8.5, ratingCount: 25 },
        ],
        topCategories: [
          { id: 1, name: "Bares", ratingCount: 200 },
        ],
        ratingsByDay: [
          { date: "2026-06-01", count: 15 },
        ],
        planDistribution: [
          { plan: "free", count: 120 },
          { plan: "premium", count: 25 },
          { plan: "embaixador", count: 5 },
        ],
      };
      (getAdminDashboardData as any).mockResolvedValue(mockData);
      const result = await getAdminDashboardData();
      expect(result).not.toBeNull();
      expect(result!.overview.totalUsers).toBe(150);
      expect(result!.overview.totalRatings).toBe(890);
      expect(result!.growth.usersLast7Days).toBe(10);
      expect(result!.topEstablishments).toHaveLength(1);
      expect(result!.topCategories).toHaveLength(1);
      expect(result!.ratingsByDay).toHaveLength(1);
      expect(result!.planDistribution).toHaveLength(3);
    });
  });

  describe("getBusinessInsights", () => {
    it("should return null when db is unavailable", async () => {
      (getBusinessInsights as any).mockResolvedValue(null);
      const result = await getBusinessInsights(1);
      expect(result).toBeNull();
    });

    it("should return business insights with correct structure", async () => {
      const mockData = {
        overview: {
          totalRatings: 50,
          avgScore: 7.8,
          totalPromos: 3,
          promoUses: 15,
        },
        scoreOverTime: [
          { date: "2026-06-01", avgScore: 7.5, count: 3 },
          { date: "2026-06-02", avgScore: 8.0, count: 5 },
        ],
        topItems: [
          { itemName: "Chopp Artesanal", avgScore: 8.9, ratingCount: 12 },
        ],
        worstItems: [
          { itemName: "Batata Frita", avgScore: 5.2, ratingCount: 8 },
        ],
        ratingDistribution: [
          { range: "8-10", count: 20 },
          { range: "6-8", count: 18 },
        ],
        recentTrend: {
          last7DaysAvg: 8.1,
          last30DaysAvg: 7.8,
        },
      };
      (getBusinessInsights as any).mockResolvedValue(mockData);
      const result = await getBusinessInsights(1);
      expect(result).not.toBeNull();
      expect(result!.overview.totalRatings).toBe(50);
      expect(result!.overview.avgScore).toBe(7.8);
      expect(result!.scoreOverTime).toHaveLength(2);
      expect(result!.topItems[0].itemName).toBe("Chopp Artesanal");
      expect(result!.worstItems[0].itemName).toBe("Batata Frita");
      expect(result!.recentTrend.last7DaysAvg).toBe(8.1);
    });

    it("should be called with correct establishmentId", async () => {
      (getBusinessInsights as any).mockResolvedValue(null);
      await getBusinessInsights(42);
      expect(getBusinessInsights).toHaveBeenCalledWith(42);
    });
  });

  describe("getUserStats", () => {
    it("should return null when db is unavailable", async () => {
      (getUserStats as any).mockResolvedValue(null);
      const result = await getUserStats(1);
      expect(result).toBeNull();
    });

    it("should return user stats with correct structure", async () => {
      const mockData = {
        totalRatings: 25,
        avgScore: 7.3,
        categoriesEvaluated: 4,
        establishmentsVisited: 12,
        ratingsLast30Days: 8,
        favoriteCategory: { name: "Bares", count: 15 },
        favoriteNeighborhood: { name: "Pinheiros", count: 10 },
        ratingsByMonth: [
          { month: "2026-01", count: 5 },
          { month: "2026-02", count: 3 },
        ],
        topRatedEstablishments: [
          { name: "Bar do Zé", score: 9.2 },
          { name: "Café Central", score: 8.8 },
        ],
        avgCostPerVisit: 85.50,
      };
      (getUserStats as any).mockResolvedValue(mockData);
      const result = await getUserStats(1);
      expect(result).not.toBeNull();
      expect(result!.totalRatings).toBe(25);
      expect(result!.avgScore).toBe(7.3);
      expect(result!.categoriesEvaluated).toBe(4);
      expect(result!.establishmentsVisited).toBe(12);
      expect(result!.ratingsLast30Days).toBe(8);
      expect(result!.favoriteCategory!.name).toBe("Bares");
      expect(result!.favoriteNeighborhood!.name).toBe("Pinheiros");
      expect(result!.ratingsByMonth).toHaveLength(2);
      expect(result!.topRatedEstablishments).toHaveLength(2);
      expect(result!.avgCostPerVisit).toBe(85.50);
    });

    it("should handle user with no ratings", async () => {
      const mockData = {
        totalRatings: 0,
        avgScore: 0,
        categoriesEvaluated: 0,
        establishmentsVisited: 0,
        ratingsLast30Days: 0,
        favoriteCategory: null,
        favoriteNeighborhood: null,
        ratingsByMonth: [],
        topRatedEstablishments: [],
        avgCostPerVisit: null,
      };
      (getUserStats as any).mockResolvedValue(mockData);
      const result = await getUserStats(999);
      expect(result).not.toBeNull();
      expect(result!.totalRatings).toBe(0);
      expect(result!.favoriteCategory).toBeNull();
      expect(result!.favoriteNeighborhood).toBeNull();
      expect(result!.ratingsByMonth).toHaveLength(0);
      expect(result!.topRatedEstablishments).toHaveLength(0);
      expect(result!.avgCostPerVisit).toBeNull();
    });

    it("should be called with correct userId", async () => {
      (getUserStats as any).mockResolvedValue(null);
      await getUserStats(77);
      expect(getUserStats).toHaveBeenCalledWith(77);
    });
  });
});
