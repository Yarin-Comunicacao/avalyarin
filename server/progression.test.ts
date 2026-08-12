import { describe, it, expect } from "vitest";
import {
  PROGRESSION_LEVELS,
  POINT_WEIGHTS,
  calculateLevelFromPoints,
  getLevelInfo,
  getNextLevelInfo,
  getPointWeight,
} from "./db-progression";

describe("Progression System - Constants", () => {
  it("should have exactly 16 levels", () => {
    expect(PROGRESSION_LEVELS).toHaveLength(16);
  });

  it("should start at level 1 with name Iniciante", () => {
    expect(PROGRESSION_LEVELS[0].level).toBe(1);
    expect(PROGRESSION_LEVELS[0].name).toBe("Iniciante");
  });

  it("should end at level 16 with name Ícone", () => {
    expect(PROGRESSION_LEVELS[15].level).toBe(16);
    expect(PROGRESSION_LEVELS[15].name).toBe("Ícone");
  });

  it("should have strictly increasing minPoints", () => {
    for (let i = 1; i < PROGRESSION_LEVELS.length; i++) {
      expect(PROGRESSION_LEVELS[i].minPoints).toBeGreaterThan(
        PROGRESSION_LEVELS[i - 1].minPoints
      );
    }
  });

  it("should have level 16 requiring 365 points", () => {
    expect(PROGRESSION_LEVELS[15].minPoints).toBe(365);
  });

  it("should have level 1 requiring only 1 point", () => {
    expect(PROGRESSION_LEVELS[0].minPoints).toBe(1);
  });

  it("each level should have a non-empty icon", () => {
    for (const level of PROGRESSION_LEVELS) {
      expect(level.icon.length).toBeGreaterThan(0);
    }
  });

  it("each level should have a non-empty name", () => {
    for (const level of PROGRESSION_LEVELS) {
      expect(level.name.length).toBeGreaterThan(0);
    }
  });
});

describe("Progression System - POINT_WEIGHTS", () => {
  it("should have 4 weight tiers", () => {
    expect(POINT_WEIGHTS).toHaveLength(4);
  });

  it("should have 1.0 weight for 0-12 months", () => {
    expect(POINT_WEIGHTS[0].maxMonths).toBe(12);
    expect(POINT_WEIGHTS[0].weight).toBe(1.0);
  });

  it("should have 0.2 weight for 12-24 months", () => {
    expect(POINT_WEIGHTS[1].maxMonths).toBe(24);
    expect(POINT_WEIGHTS[1].weight).toBe(0.2);
  });

  it("should have 0.1 weight for 24-36 months", () => {
    expect(POINT_WEIGHTS[2].maxMonths).toBe(36);
    expect(POINT_WEIGHTS[2].weight).toBe(0.1);
  });

  it("should have 0.025 weight for 36+ months", () => {
    expect(POINT_WEIGHTS[3].maxMonths).toBe(Infinity);
    expect(POINT_WEIGHTS[3].weight).toBe(0.025);
  });

  it("weights should be strictly decreasing", () => {
    for (let i = 1; i < POINT_WEIGHTS.length; i++) {
      expect(POINT_WEIGHTS[i].weight).toBeLessThan(POINT_WEIGHTS[i - 1].weight);
    }
  });
});

describe("Progression System - getPointWeight", () => {
  it("should return 1.0 for 0 months (today)", () => {
    expect(getPointWeight(0)).toBe(1.0);
  });

  it("should return 1.0 for 6 months", () => {
    expect(getPointWeight(6)).toBe(1.0);
  });

  it("should return 1.0 for 11 months", () => {
    expect(getPointWeight(11)).toBe(1.0);
  });

  it("should return 0.2 for 12 months (exactly 1 year)", () => {
    expect(getPointWeight(12)).toBe(0.2);
  });

  it("should return 0.2 for 18 months", () => {
    expect(getPointWeight(18)).toBe(0.2);
  });

  it("should return 0.2 for 23 months", () => {
    expect(getPointWeight(23)).toBe(0.2);
  });

  it("should return 0.1 for 24 months (exactly 2 years)", () => {
    expect(getPointWeight(24)).toBe(0.1);
  });

  it("should return 0.1 for 30 months", () => {
    expect(getPointWeight(30)).toBe(0.1);
  });

  it("should return 0.025 for 36 months (exactly 3 years)", () => {
    expect(getPointWeight(36)).toBe(0.025);
  });

  it("should return 0.025 for 60 months (5 years)", () => {
    expect(getPointWeight(60)).toBe(0.025);
  });

  it("should return 0.025 for 120 months (10 years)", () => {
    expect(getPointWeight(120)).toBe(0.025);
  });
});

describe("Progression System - calculateLevelFromPoints", () => {
  it("should return 0 for 0 points", () => {
    expect(calculateLevelFromPoints(0)).toBe(0);
  });

  it("should return level 1 for 1 point", () => {
    expect(calculateLevelFromPoints(1)).toBe(1);
  });

  it("should return level 1 for 2 points (below level 2 threshold)", () => {
    expect(calculateLevelFromPoints(2)).toBe(1);
  });

  it("should return level 2 for 3 points", () => {
    expect(calculateLevelFromPoints(3)).toBe(2);
  });

  it("should return level 3 for 6 points", () => {
    expect(calculateLevelFromPoints(6)).toBe(3);
  });

  it("should return level 4 for 10 points", () => {
    expect(calculateLevelFromPoints(10)).toBe(4);
  });

  it("should return level 8 for 40 points", () => {
    expect(calculateLevelFromPoints(40)).toBe(8);
  });

  it("should return level 11 for 100 points", () => {
    expect(calculateLevelFromPoints(100)).toBe(11);
  });

  it("should return level 16 for 365 points", () => {
    expect(calculateLevelFromPoints(365)).toBe(16);
  });

  it("should return level 16 for 1000 points (above max)", () => {
    expect(calculateLevelFromPoints(1000)).toBe(16);
  });

  it("should handle fractional points correctly (e.g. 0.5 < 1 = level 0)", () => {
    expect(calculateLevelFromPoints(0.5)).toBe(0);
  });

  it("should handle fractional points at threshold (e.g. 2.9 < 3 = level 1)", () => {
    expect(calculateLevelFromPoints(2.9)).toBe(1);
  });

  it("should return correct level at exact thresholds", () => {
    for (const level of PROGRESSION_LEVELS) {
      expect(calculateLevelFromPoints(level.minPoints)).toBe(level.level);
    }
  });

  it("should return previous level for 1 point below threshold", () => {
    for (let i = 1; i < PROGRESSION_LEVELS.length; i++) {
      const pointsBelow = PROGRESSION_LEVELS[i].minPoints - 1;
      expect(calculateLevelFromPoints(pointsBelow)).toBe(PROGRESSION_LEVELS[i - 1].level);
    }
  });
});

describe("Progression System - getLevelInfo", () => {
  it("should return correct info for level 1", () => {
    const info = getLevelInfo(1);
    expect(info.name).toBe("Iniciante");
    expect(info.level).toBe(1);
  });

  it("should return correct info for level 16", () => {
    const info = getLevelInfo(16);
    expect(info.name).toBe("Ícone");
    expect(info.level).toBe(16);
  });

  it("should return level 1 info for invalid level 0", () => {
    const info = getLevelInfo(0);
    expect(info.level).toBe(1); // fallback to first
  });
});

describe("Progression System - getNextLevelInfo", () => {
  it("should return null for level 16 (max level)", () => {
    const next = getNextLevelInfo(16, 400);
    expect(next).toBeNull();
  });

  it("should return level 2 info when at level 1 with 1 point", () => {
    const next = getNextLevelInfo(1, 1);
    expect(next).not.toBeNull();
    expect(next!.level).toBe(2);
    expect(next!.name).toBe("Explorador");
    expect(next!.pointsNeeded).toBe(3);
    expect(next!.pointsRemaining).toBe(2);
  });

  it("should return level 2 info when at level 1 with 2 points", () => {
    const next = getNextLevelInfo(1, 2);
    expect(next).not.toBeNull();
    expect(next!.pointsRemaining).toBe(1);
  });

  it("should calculate correct progress percent", () => {
    // Level 1 min = 1, Level 2 min = 3, range = 2
    // At 2 points: progress = 2 - 1 = 1, percent = (1/2)*100 = 50
    const next = getNextLevelInfo(1, 2);
    expect(next!.progressPercent).toBe(50);
  });

  it("should show 0% progress at exact current level threshold", () => {
    // Level 2 min = 3, Level 3 min = 6, range = 3
    // At 3 points: progress = 3 - 3 = 0, percent = 0
    const next = getNextLevelInfo(2, 3);
    expect(next!.progressPercent).toBe(0);
  });

  it("should cap progress at 100%", () => {
    const next = getNextLevelInfo(1, 5);
    expect(next!.progressPercent).toBeLessThanOrEqual(100);
  });

  it("should handle fractional pointsRemaining", () => {
    // At 2.5 points, need 3, remaining = 0.5
    const next = getNextLevelInfo(1, 2.5);
    expect(next!.pointsRemaining).toBe(0.5);
  });
});

describe("Progression System - Weighted point scenarios", () => {
  it("user with 50 recent + 50 old ratings should have ~60 weighted points", () => {
    // 50 ratings within 12 months = 50 * 1.0 = 50
    // 50 ratings 12-24 months ago = 50 * 0.2 = 10
    // Total = 60
    const weighted = 50 * 1.0 + 50 * 0.2;
    expect(weighted).toBe(60);
    expect(calculateLevelFromPoints(weighted)).toBe(9); // Sommelier (55)
  });

  it("user with 100 ratings all older than 3 years should have 2.5 points", () => {
    const weighted = 100 * 0.025;
    expect(weighted).toBe(2.5);
    expect(calculateLevelFromPoints(weighted)).toBe(1); // Iniciante (1)
  });

  it("user with 365 recent ratings should reach level 16", () => {
    const weighted = 365 * 1.0;
    expect(weighted).toBe(365);
    expect(calculateLevelFromPoints(weighted)).toBe(16); // Ícone
  });

  it("user with mixed history: 30 recent, 100 1-2yr, 200 2-3yr, 500 3yr+", () => {
    // 30 * 1.0 = 30
    // 100 * 0.2 = 20
    // 200 * 0.1 = 20
    // 500 * 0.025 = 12.5
    const weighted = 30 + 20 + 20 + 12.5;
    expect(weighted).toBe(82.5);
    expect(calculateLevelFromPoints(weighted)).toBe(10); // Gastronomo (75)
  });

  it("level-down scenario: user stops rating, old points decay", () => {
    // Was at 100 points (level 11 Mestre) with all recent ratings
    // 1 year later, those 100 ratings are now 12-24 months old
    const decayed = 100 * 0.2; // = 20
    expect(calculateLevelFromPoints(decayed)).toBe(5); // Avaliador (15)
  });
});
