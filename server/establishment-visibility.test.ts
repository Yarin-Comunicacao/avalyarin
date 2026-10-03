import { describe, expect, it } from "vitest";
import { countMissingEstablishmentCriteria, getEstablishmentVisibilityStatus, shouldSyncEstablishmentVisibility } from "./db";

describe("establishment visibility status", () => {
  const complete = { address: "Rua A", hours: "08:00-18:00", hasMenu: true };

  it("preserves an explicit manual status instead of recalculating it", () => {
    expect(shouldSyncEstablishmentVisibility({ status: "pending" })).toBe(false);
    expect(shouldSyncEstablishmentVisibility({ status: "hidden" })).toBe(false);
    expect(shouldSyncEstablishmentVisibility({ status: "active" })).toBe(false);
    expect(shouldSyncEstablishmentVisibility({})).toBe(true);
  });

  it("activates a complete establishment", () => {
    expect(countMissingEstablishmentCriteria(complete)).toBe(0);
    expect(getEstablishmentVisibilityStatus(complete)).toBe("active");
  });

  it("keeps an establishment pending when exactly one criterion is missing", () => {
    expect(getEstablishmentVisibilityStatus({ ...complete, hasMenu: false })).toBe("pending");
    expect(getEstablishmentVisibilityStatus({ ...complete, address: null })).toBe("pending");
    expect(getEstablishmentVisibilityStatus({ ...complete, hours: "" })).toBe("pending");
  });

  it("hides an establishment when two or three criteria are missing", () => {
    expect(getEstablishmentVisibilityStatus({ ...complete, address: null, hasMenu: false })).toBe("hidden");
    expect(getEstablishmentVisibilityStatus({ address: null, hours: null, hasMenu: false })).toBe("hidden");
  });
});
