import { describe, it, expect } from "vitest";
import {
  PROGRESSION_LEVELS,
  calculateLevelFromPoints,
  getLevelInfo,
  getNextLevelInfo,
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

  it("should have level 16 requiring 365 points (1 per day for a year)", () => {
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
    // Even if somehow points exceed next threshold
    const next = getNextLevelInfo(1, 5);
    expect(next!.progressPercent).toBeLessThanOrEqual(100);
  });

  it("should return 0 pointsRemaining when points meet next threshold", () => {
    const next = getNextLevelInfo(1, 3);
    expect(next!.pointsRemaining).toBe(0);
  });
});

describe("Progression System - Level-down scenario", () => {
  it("points dropping below current level threshold means level should decrease", () => {
    // User was level 5 (minPoints: 15) but now has 12 points (expired)
    const newLevel = calculateLevelFromPoints(12);
    expect(newLevel).toBe(4); // Should drop to level 4 (minPoints: 10)
  });

  it("points dropping to 0 means level 0", () => {
    const newLevel = calculateLevelFromPoints(0);
    expect(newLevel).toBe(0);
  });
});
