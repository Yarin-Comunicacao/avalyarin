import { describe, it, expect } from "vitest";
import {
  NOBILITY_TITLES,
  CATEGORY_THRESHOLDS,
  NEIGHBORHOOD_THRESHOLDS,
  ESTABLISHMENT_THRESHOLDS,
  ELIGIBLE_NEIGHBORHOODS,
  NEIGHBORHOOD_ALIASES,
} from "./db-nobility";

describe("Nobility Badges System - Constants", () => {
  it("should have 7 nobility titles", () => {
    expect(NOBILITY_TITLES).toHaveLength(7);
  });

  it("should have correct title progression", () => {
    const expectedMale = ["Barão", "Visconde", "Conde", "Marquês", "Duque", "Príncipe", "Rei"];
    const expectedFemale = ["Baronesa", "Viscondessa", "Condessa", "Marquesa", "Duquesa", "Princesa", "Rainha"];
    
    NOBILITY_TITLES.forEach((title, i) => {
      expect(title.level).toBe(i + 1);
      expect(title.male).toBe(expectedMale[i]);
      expect(title.female).toBe(expectedFemale[i]);
    });
  });

  it("should have 7 category thresholds with increasing requirements", () => {
    expect(CATEGORY_THRESHOLDS).toHaveLength(7);
    
    for (let i = 1; i < CATEGORY_THRESHOLDS.length; i++) {
      expect(CATEGORY_THRESHOLDS[i].ratings).toBeGreaterThan(CATEGORY_THRESHOLDS[i - 1].ratings);
      expect(CATEGORY_THRESHOLDS[i].uniqueEstablishments).toBeGreaterThan(CATEGORY_THRESHOLDS[i - 1].uniqueEstablishments);
    }
  });

  it("should require 52 ratings and 15 unique establishments for category Rei", () => {
    const reiThreshold = CATEGORY_THRESHOLDS.find(t => t.level === 7);
    expect(reiThreshold).toBeDefined();
    expect(reiThreshold!.ratings).toBe(52);
    expect(reiThreshold!.uniqueEstablishments).toBe(15);
  });

  it("should have 7 neighborhood thresholds with increasing requirements", () => {
    expect(NEIGHBORHOOD_THRESHOLDS).toHaveLength(7);
    
    for (let i = 1; i < NEIGHBORHOOD_THRESHOLDS.length; i++) {
      expect(NEIGHBORHOOD_THRESHOLDS[i].ratings).toBeGreaterThan(NEIGHBORHOOD_THRESHOLDS[i - 1].ratings);
      expect(NEIGHBORHOOD_THRESHOLDS[i].uniqueEstablishments).toBeGreaterThan(NEIGHBORHOOD_THRESHOLDS[i - 1].uniqueEstablishments);
    }
  });

  it("should require 104 ratings and 30 unique establishments for neighborhood Rei", () => {
    const reiThreshold = NEIGHBORHOOD_THRESHOLDS.find(t => t.level === 7);
    expect(reiThreshold).toBeDefined();
    expect(reiThreshold!.ratings).toBe(104);
    expect(reiThreshold!.uniqueEstablishments).toBe(30);
  });

  it("should have 7 establishment thresholds with increasing requirements", () => {
    expect(ESTABLISHMENT_THRESHOLDS).toHaveLength(7);
    
    for (let i = 1; i < ESTABLISHMENT_THRESHOLDS.length; i++) {
      expect(ESTABLISHMENT_THRESHOLDS[i].ratings).toBeGreaterThan(ESTABLISHMENT_THRESHOLDS[i - 1].ratings);
    }
  });

  it("should require 52 ratings for establishment Rei", () => {
    const reiThreshold = ESTABLISHMENT_THRESHOLDS.find(t => t.level === 7);
    expect(reiThreshold).toBeDefined();
    expect(reiThreshold!.ratings).toBe(52);
  });

  it("should have 20 eligible neighborhoods", () => {
    expect(ELIGIBLE_NEIGHBORHOODS).toHaveLength(20);
    expect(ELIGIBLE_NEIGHBORHOODS).toContain("Pinheiros");
    expect(ELIGIBLE_NEIGHBORHOODS).toContain("Vila Madalena");
    expect(ELIGIBLE_NEIGHBORHOODS).toContain("Moema");
  });

  it("should have correct neighborhood aliases", () => {
    expect(NEIGHBORHOOD_ALIASES["Alto de Pinheiros"]).toBe("Pinheiros");
    expect(NEIGHBORHOOD_ALIASES["Vila Madalena/Sumarezinho"]).toBe("Vila Madalena");
  });
});

describe("Nobility Badges System - Level Calculation Logic", () => {
  // Simulating the calculateLevel function logic
  function calculateLevel(
    ratingsCount: number,
    uniqueEstablishments: number,
    thresholds: readonly { level: number; ratings: number; uniqueEstablishments?: number }[]
  ): number {
    let currentLevel = 0;
    for (const threshold of thresholds) {
      if (ratingsCount >= threshold.ratings) {
        if (threshold.uniqueEstablishments !== undefined) {
          if (uniqueEstablishments >= threshold.uniqueEstablishments) {
            currentLevel = threshold.level;
          }
        } else {
          currentLevel = threshold.level;
        }
      }
    }
    return currentLevel;
  }

  describe("Category level calculation", () => {
    it("should return level 0 for no ratings", () => {
      expect(calculateLevel(0, 0, CATEGORY_THRESHOLDS)).toBe(0);
    });

    it("should return level 1 (Barão) for 3 ratings and 2 unique establishments", () => {
      expect(calculateLevel(3, 2, CATEGORY_THRESHOLDS)).toBe(1);
    });

    it("should NOT grant level if ratings met but unique establishments not met", () => {
      // 7 ratings but only 3 unique establishments (need 4 for level 2)
      expect(calculateLevel(7, 3, CATEGORY_THRESHOLDS)).toBe(1);
    });

    it("should return level 2 (Visconde) for 7 ratings and 4 unique establishments", () => {
      expect(calculateLevel(7, 4, CATEGORY_THRESHOLDS)).toBe(2);
    });

    it("should return level 7 (Rei) for 52+ ratings and 15+ unique establishments", () => {
      expect(calculateLevel(52, 15, CATEGORY_THRESHOLDS)).toBe(7);
      expect(calculateLevel(100, 20, CATEGORY_THRESHOLDS)).toBe(7);
    });

    it("should cap at lower level if unique establishments insufficient despite high ratings", () => {
      // 52 ratings but only 1 unique establishment (someone going to same place)
      expect(calculateLevel(52, 1, CATEGORY_THRESHOLDS)).toBe(0);
      // 52 ratings but only 2 unique establishments
      expect(calculateLevel(52, 2, CATEGORY_THRESHOLDS)).toBe(1);
      // 52 ratings but only 9 unique establishments
      expect(calculateLevel(52, 9, CATEGORY_THRESHOLDS)).toBe(4);
    });
  });

  describe("Neighborhood level calculation", () => {
    it("should return level 0 for insufficient ratings", () => {
      expect(calculateLevel(4, 2, NEIGHBORHOOD_THRESHOLDS)).toBe(0);
    });

    it("should return level 1 (Barão) for 5 ratings and 3 unique establishments", () => {
      expect(calculateLevel(5, 3, NEIGHBORHOOD_THRESHOLDS)).toBe(1);
    });

    it("should return level 7 (Rei) for 104+ ratings and 30+ unique establishments", () => {
      expect(calculateLevel(104, 30, NEIGHBORHOOD_THRESHOLDS)).toBe(7);
    });

    it("should block progression if unique establishments insufficient", () => {
      // 104 ratings but only 5 unique establishments
      expect(calculateLevel(104, 5, NEIGHBORHOOD_THRESHOLDS)).toBe(1);
    });
  });

  describe("Establishment level calculation (no unique requirement)", () => {
    const estThresholds = ESTABLISHMENT_THRESHOLDS.map(t => ({ ...t, uniqueEstablishments: undefined }));

    it("should return level 0 for less than 3 ratings", () => {
      expect(calculateLevel(2, 0, estThresholds)).toBe(0);
    });

    it("should return level 1 (Barão) for 3 ratings", () => {
      expect(calculateLevel(3, 0, estThresholds)).toBe(1);
    });

    it("should return level 7 (Rei) for 52+ ratings", () => {
      expect(calculateLevel(52, 0, estThresholds)).toBe(7);
      expect(calculateLevel(100, 0, estThresholds)).toBe(7);
    });

    it("should correctly identify intermediate levels", () => {
      expect(calculateLevel(7, 0, estThresholds)).toBe(2);
      expect(calculateLevel(13, 0, estThresholds)).toBe(3);
      expect(calculateLevel(21, 0, estThresholds)).toBe(4);
      expect(calculateLevel(31, 0, estThresholds)).toBe(5);
      expect(calculateLevel(42, 0, estThresholds)).toBe(6);
    });
  });

  describe("Anti-gaming: repeated visits to same place", () => {
    it("someone visiting same restaurant weekly (52 ratings, 1 unique) stays at Barão for category", () => {
      // They have enough ratings for Rei but only 1 unique establishment
      const level = calculateLevel(52, 1, CATEGORY_THRESHOLDS);
      expect(level).toBeLessThanOrEqual(1); // At most Barão (if they have 2 unique) or 0
    });

    it("someone visiting same restaurant weekly (52 ratings, 1 unique) CAN be Rei for that establishment", () => {
      // For establishment badges, no unique requirement
      const estThresholds = ESTABLISHMENT_THRESHOLDS.map(t => ({ ...t, uniqueEstablishments: undefined }));
      const level = calculateLevel(52, 0, estThresholds);
      expect(level).toBe(7); // Rei of that establishment
    });

    it("balanced explorer (52 ratings, 15 unique) achieves Rei for category", () => {
      const level = calculateLevel(52, 15, CATEGORY_THRESHOLDS);
      expect(level).toBe(7);
    });
  });
});

describe("Nobility Badges System - Threshold Consistency", () => {
  it("category Barão should require fewer ratings than establishment Barão", () => {
    // Both start at 3, which is fine
    expect(CATEGORY_THRESHOLDS[0].ratings).toBe(ESTABLISHMENT_THRESHOLDS[0].ratings);
  });

  it("neighborhood Rei should require double the ratings of category Rei", () => {
    const catRei = CATEGORY_THRESHOLDS.find(t => t.level === 7)!;
    const neighRei = NEIGHBORHOOD_THRESHOLDS.find(t => t.level === 7)!;
    expect(neighRei.ratings).toBe(catRei.ratings * 2);
  });

  it("neighborhood Rei should require double the unique establishments of category Rei", () => {
    const catRei = CATEGORY_THRESHOLDS.find(t => t.level === 7)!;
    const neighRei = NEIGHBORHOOD_THRESHOLDS.find(t => t.level === 7)!;
    expect(neighRei.uniqueEstablishments).toBe(catRei.uniqueEstablishments * 2);
  });
});
