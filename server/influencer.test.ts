import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

// Mock schema
vi.mock("../drizzle/schema", () => ({
  influencerApplications: { id: "id", userId: "userId", status: "status", selectedRatingIds: "selectedRatingIds", totalRatings: "totalRatings", qualifiedRatings: "qualifiedRatings", motivation: "motivation", socialMedia: "socialMedia", adminNotes: "adminNotes", reviewedAt: "reviewedAt", createdAt: "createdAt" },
  partnerships: { id: "id", influencerId: "influencerId", establishmentId: "establishmentId", status: "status", terms: "terms", proposedBy: "proposedBy", estabNotes: "estabNotes", adminNotes: "adminNotes", startsAt: "startsAt", createdAt: "createdAt", expiresAt: "expiresAt", updatedAt: "updatedAt", promoCodeId: "promoCodeId" },
  users: { id: "id", name: "name", email: "email", role: "role" },
  ratings: { id: "id", userId: "userId", establishmentId: "establishmentId", visitDate: "visitDate", overallScore: "overallScore", type: "type", createdAt: "createdAt" },
  ratingItems: { ratingId: "ratingId", comment: "comment" },
  establishments: { id: "id", name: "name" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
  desc: vi.fn((...args: unknown[]) => ({ type: "desc", args })),
  gte: vi.fn((...args: unknown[]) => ({ type: "gte", args })),
  inArray: vi.fn((...args: unknown[]) => ({ type: "inArray", args })),
}));

describe("Influencer System", () => {
  describe("getRatingsForInfluencerApplication", () => {
    it("should return empty array when db is not available", async () => {
      const { getDb } = await import("./db");
      (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { getRatingsForInfluencerApplication } = await import("./db-influencer");
      const result = await getRatingsForInfluencerApplication(1);
      expect(result).toEqual([]);
    });

    it("should return empty array when user has no ratings", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
      };
      const { getDb } = await import("./db");
      (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(mockDb);

      const { getRatingsForInfluencerApplication } = await import("./db-influencer");
      const result = await getRatingsForInfluencerApplication(1);
      expect(result).toEqual([]);
    });
  });

  describe("submitInfluencerApplication", () => {
    it("should throw when db is not available", async () => {
      const { getDb } = await import("./db");
      (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { submitInfluencerApplication } = await import("./db-influencer");
      await expect(
        submitInfluencerApplication({
          userId: 1,
          selectedRatingIds: Array.from({ length: 50 }, (_, i) => i + 1),
          totalRatings: 60,
          qualifiedRatings: 50,
        })
      ).rejects.toThrow("Database not available");
    });

    it("should throw when user already has pending application", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: 1, status: "pending" }]),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
      };
      const { getDb } = await import("./db");
      (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(mockDb);

      const { submitInfluencerApplication } = await import("./db-influencer");
      await expect(
        submitInfluencerApplication({
          userId: 1,
          selectedRatingIds: Array.from({ length: 50 }, (_, i) => i + 1),
          totalRatings: 60,
          qualifiedRatings: 50,
        })
      ).rejects.toThrow("Você já tem uma solicitação pendente.");
    });
  });

  describe("getMyInfluencerApplication", () => {
    it("should return null when db is not available", async () => {
      const { getDb } = await import("./db");
      (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { getMyInfluencerApplication } = await import("./db-influencer");
      const result = await getMyInfluencerApplication(1);
      expect(result).toBeNull();
    });
  });

  describe("getInfluencerApplications (admin)", () => {
    it("should return empty array when db is not available", async () => {
      const { getDb } = await import("./db");
      (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { getInfluencerApplications } = await import("./db-influencer");
      const result = await getInfluencerApplications();
      expect(result).toEqual([]);
    });
  });

  describe("proposePartnership", () => {
    it("should throw when db is not available", async () => {
      const { getDb } = await import("./db");
      (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { proposePartnership } = await import("./db-influencer");
      await expect(
        proposePartnership({
          influencerId: 1,
          establishmentId: 1,
          proposedBy: "influencer",
        })
      ).rejects.toThrow("Database not available");
    });

    it("should throw when partnership already exists", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: 1 }]),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
      };
      const { getDb } = await import("./db");
      (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(mockDb);

      const { proposePartnership } = await import("./db-influencer");
      await expect(
        proposePartnership({
          influencerId: 1,
          establishmentId: 1,
          proposedBy: "influencer",
        })
      ).rejects.toThrow("Já existe uma parceria ativa ou pendente com este estabelecimento.");
    });
  });

  describe("respondToPartnership", () => {
    it("should throw when db is not available", async () => {
      const { getDb } = await import("./db");
      (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { respondToPartnership } = await import("./db-influencer");
      await expect(respondToPartnership(1, true)).rejects.toThrow("Database not available");
    });
  });

  describe("getInfluencerPartnerships", () => {
    it("should return empty array when db is not available", async () => {
      const { getDb } = await import("./db");
      (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { getInfluencerPartnerships } = await import("./db-influencer");
      const result = await getInfluencerPartnerships(1);
      expect(result).toEqual([]);
    });
  });

  describe("getEstablishmentPartnerships", () => {
    it("should return empty array when db is not available", async () => {
      const { getDb } = await import("./db");
      (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { getEstablishmentPartnerships } = await import("./db-influencer");
      const result = await getEstablishmentPartnerships(1);
      expect(result).toEqual([]);
    });
  });

  describe("getAdminPendingPartnerships", () => {
    it("should return empty array when db is not available", async () => {
      const { getDb } = await import("./db");
      (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { getAdminPendingPartnerships } = await import("./db-influencer");
      const result = await getAdminPendingPartnerships();
      expect(result).toEqual([]);
    });
  });
});
