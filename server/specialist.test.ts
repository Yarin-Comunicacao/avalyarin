import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

// Mock schema
vi.mock("../drizzle/schema", () => ({
  specialistApplications: { id: "id", userId: "userId", status: "status", selectedRatingIds: "selectedRatingIds", totalRatings: "totalRatings", qualifiedRatings: "qualifiedRatings", motivation: "motivation", socialMedia: "socialMedia", adminNotes: "adminNotes", reviewedAt: "reviewedAt", createdAt: "createdAt" },
  partnerships: { id: "id", specialistId: "specialistId", establishmentId: "establishmentId", status: "status", terms: "terms", proposedBy: "proposedBy", estabNotes: "estabNotes", adminNotes: "adminNotes", startsAt: "startsAt", createdAt: "createdAt", expiresAt: "expiresAt", updatedAt: "updatedAt", promoCodeId: "promoCodeId" },
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

describe("Specialist System", () => {
  describe("getRatingsForSpecialistApplication", () => {
    it("should return empty array when db is not available", async () => {
      const { getDb } = await import("./db");
      (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { getRatingsForSpecialistApplication } = await import("./db-specialist");
      const result = await getRatingsForSpecialistApplication(1);
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

      const { getRatingsForSpecialistApplication } = await import("./db-specialist");
      const result = await getRatingsForSpecialistApplication(1);
      expect(result).toEqual([]);
    });
  });

  describe("submitSpecialistApplication", () => {
    it("should throw when db is not available", async () => {
      const { getDb } = await import("./db");
      (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { submitSpecialistApplication } = await import("./db-specialist");
      await expect(
        submitSpecialistApplication({
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

      const { submitSpecialistApplication } = await import("./db-specialist");
      await expect(
        submitSpecialistApplication({
          userId: 1,
          selectedRatingIds: Array.from({ length: 50 }, (_, i) => i + 1),
          totalRatings: 60,
          qualifiedRatings: 50,
        })
      ).rejects.toThrow("Você já tem uma solicitação pendente.");
    });
  });

  describe("getMySpecialistApplication", () => {
    it("should return null when db is not available", async () => {
      const { getDb } = await import("./db");
      (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { getMySpecialistApplication } = await import("./db-specialist");
      const result = await getMySpecialistApplication(1);
      expect(result).toBeNull();
    });
  });

  describe("getSpecialistApplications (admin)", () => {
    it("should return empty array when db is not available", async () => {
      const { getDb } = await import("./db");
      (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { getSpecialistApplications } = await import("./db-specialist");
      const result = await getSpecialistApplications();
      expect(result).toEqual([]);
    });
  });

  describe("proposePartnership", () => {
    it("should throw when db is not available", async () => {
      const { getDb } = await import("./db");
      (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { proposePartnership } = await import("./db-specialist");
      await expect(
        proposePartnership({
          specialistId: 1,
          establishmentId: 1,
          proposedBy: "specialist",
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

      const { proposePartnership } = await import("./db-specialist");
      await expect(
        proposePartnership({
          specialistId: 1,
          establishmentId: 1,
          proposedBy: "specialist",
        })
      ).rejects.toThrow("Já existe uma parceria ativa ou pendente com este estabelecimento.");
    });
  });

  describe("respondToPartnership", () => {
    it("should throw when db is not available", async () => {
      const { getDb } = await import("./db");
      (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { respondToPartnership } = await import("./db-specialist");
      await expect(respondToPartnership(1, true)).rejects.toThrow("Database not available");
    });
  });

  describe("getSpecialistPartnerships", () => {
    it("should return empty array when db is not available", async () => {
      const { getDb } = await import("./db");
      (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { getSpecialistPartnerships } = await import("./db-specialist");
      const result = await getSpecialistPartnerships(1);
      expect(result).toEqual([]);
    });
  });

  describe("getEstablishmentPartnerships", () => {
    it("should return empty array when db is not available", async () => {
      const { getDb } = await import("./db");
      (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { getEstablishmentPartnerships } = await import("./db-specialist");
      const result = await getEstablishmentPartnerships(1);
      expect(result).toEqual([]);
    });
  });

  describe("getSupportPendingPartnerships", () => {
    it("should return empty array when db is not available", async () => {
      const { getDb } = await import("./db");
      (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { getSupportPendingPartnerships } = await import("./db-specialist");
      const result = await getSupportPendingPartnerships();
      expect(result).toEqual([]);
    });
  });
});
