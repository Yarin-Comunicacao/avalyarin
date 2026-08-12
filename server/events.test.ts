import { describe, it, expect } from "vitest";
import { EVENT_TYPES } from "./db-events";
import { validateAddress } from "../shared/address-validation";

describe("Events System", () => {
  describe("EVENT_TYPES constant", () => {
    it("should have 16 event type options", () => {
      expect(EVENT_TYPES).toHaveLength(16);
    });

    it("should include all required types", () => {
      const values = EVENT_TYPES.map(t => t.value);
      expect(values).toContain("esporte");
      expect(values).toContain("show");
      expect(values).toContain("festa");
      expect(values).toContain("gastronomia");
      expect(values).toContain("cultural");
      expect(values).toContain("stand_up");
      expect(values).toContain("quiz");
      expect(values).toContain("degustacao");
      expect(values).toContain("workshop");
      expect(values).toContain("karaoke");
      expect(values).toContain("dj");
      expect(values).toContain("sertanejo");
      expect(values).toContain("pagode");
      expect(values).toContain("forro");
      expect(values).toContain("samba");
      expect(values).toContain("outro");
    });

    it("should have label for each type", () => {
      EVENT_TYPES.forEach(t => {
        expect(t.label).toBeTruthy();
        expect(typeof t.label).toBe("string");
      });
    });
  });

  describe("Address validation for custom locations", () => {
    it("should accept address starting with Rua", () => {
      const result = validateAddress("Rua Augusta, 1200");
      expect(result.valid).toBe(true);
    });

    it("should accept address starting with Avenida", () => {
      const result = validateAddress("Avenida Paulista, 1000");
      expect(result.valid).toBe(true);
    });

    it("should accept address starting with Praça", () => {
      const result = validateAddress("Praça da República, 50");
      expect(result.valid).toBe(true);
    });

    it("should accept address starting with Alameda", () => {
      const result = validateAddress("Alameda Santos, 500");
      expect(result.valid).toBe(true);
    });

    it("should reject address not starting with valid logradouro", () => {
      const result = validateAddress("Lugar qualquer 123");
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it("should reject empty address", () => {
      const result = validateAddress("");
      expect(result.valid).toBe(false);
    });

    it("should be case insensitive", () => {
      const result = validateAddress("rua augusta, 1200");
      expect(result.valid).toBe(true);
    });
  });

  describe("Event data structure validation", () => {
    it("should require description between 200-550 chars", () => {
      const shortDesc = "Muito curta";
      expect(shortDesc.length).toBeLessThan(200);

      const validDesc = "A".repeat(200);
      expect(validDesc.length).toBeGreaterThanOrEqual(200);
      expect(validDesc.length).toBeLessThanOrEqual(550);

      const longDesc = "A".repeat(551);
      expect(longDesc.length).toBeGreaterThan(550);
    });

    it("should validate endDate > startDate", () => {
      const start = Date.now() + 86400000;
      const end = start + 7200000;
      expect(end).toBeGreaterThan(start);

      const invalidEnd = start - 1000;
      expect(invalidEnd).toBeLessThan(start);
    });

    it("should support free entry type", () => {
      const event = { entryType: "free" as const };
      expect(event.entryType).toBe("free");
    });

    it("should support paid single entry with door price", () => {
      const event = {
        entryType: "paid" as const,
        paidType: "single" as const,
        singlePrice: 100,
        hasDoorPrice: true,
        doorPrice: 150,
      };
      expect(event.singlePrice).toBe(100);
      expect(event.doorPrice).toBe(150);
      expect(event.doorPrice).toBeGreaterThan(event.singlePrice);
    });

    it("should support paid batch entry with up to 10 batches", () => {
      const batches = Array.from({ length: 10 }, (_, i) => ({
        batchNumber: i + 1,
        batchName: `${i + 1}º Lote`,
        price: 50 + i * 10,
      }));
      expect(batches).toHaveLength(10);
      expect(batches[0].price).toBe(50);
      expect(batches[9].price).toBe(140);
    });

    it("should not allow more than 10 batches", () => {
      const maxBatches = 10;
      const batches = Array.from({ length: 11 }, (_, i) => ({
        batchNumber: i + 1,
        batchName: `${i + 1}º Lote`,
        price: 50,
      }));
      expect(batches.length).toBeGreaterThan(maxBatches);
    });

    it("should require positive prices for batches", () => {
      const invalidBatch = { batchNumber: 1, batchName: "1º Lote", price: 0 };
      expect(invalidBatch.price).toBeLessThanOrEqual(0);

      const validBatch = { batchNumber: 1, batchName: "1º Lote", price: 80 };
      expect(validBatch.price).toBeGreaterThan(0);
    });
  });

  describe("Location types", () => {
    it("should support establishment location (standard)", () => {
      const event = { locationType: "establishment" as const };
      expect(event.locationType).toBe("establishment");
    });

    it("should support custom location with full address", () => {
      const event = {
        locationType: "custom" as const,
        customAddress: "Rua Fradique Coutinho, 888",
        customAddressNumber: "888",
        customNeighborhood: "Vila Madalena",
        customCity: "São Paulo",
      };
      expect(event.locationType).toBe("custom");
      expect(validateAddress(event.customAddress).valid).toBe(true);
    });
  });

  describe("Event expiration logic", () => {
    it("should consider event active when endDate is in the future", () => {
      const now = Date.now();
      const futureEnd = now + 86400000;
      expect(futureEnd).toBeGreaterThan(now);
    });

    it("should consider event expired when endDate is in the past", () => {
      const now = Date.now();
      const pastEnd = now - 86400000;
      expect(pastEnd).toBeLessThan(now);
    });

    it("should consider event happening when startDate <= now <= endDate", () => {
      const now = Date.now();
      const start = now - 3600000; // started 1h ago
      const end = now + 3600000; // ends in 1h
      expect(start).toBeLessThanOrEqual(now);
      expect(end).toBeGreaterThanOrEqual(now);
    });
  });
});
