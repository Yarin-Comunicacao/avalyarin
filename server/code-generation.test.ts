import { describe, expect, it } from "vitest";
import { buildNextCode } from "./db";

describe("buildNextCode", () => {
  it("increments a valid establishment code", () => {
    expect(buildNextCode("es120008", "es", 6)).toBe("es120009");
  });

  it("never generates NaN when a legacy code has an invalid prefix", () => {
    expect(buildNextCode("est265252", "es", 6)).toBe("es000001");
  });

  it("starts at the first valid code when no valid code exists", () => {
    expect(buildNextCode(null, "es", 6)).toBe("es000001");
  });

  it("keeps numeric user codes sequential", () => {
    expect(buildNextCode("30000200", "", 0)).toBe("30000201");
  });
});
