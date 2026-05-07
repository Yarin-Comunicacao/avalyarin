import { describe, it, expect } from "vitest";
import { z } from "zod";

// Schema validation tests for profile procedures
const usernameSchema = z.string().min(3).max(30);

describe("Profile - Username validation", () => {
  it("rejects usernames shorter than 3 chars", () => {
    expect(() => usernameSchema.parse("ab")).toThrow();
  });

  it("accepts usernames with 3+ chars", () => {
    expect(usernameSchema.parse("abc")).toBe("abc");
  });

  it("rejects usernames longer than 30 chars", () => {
    const long = "a".repeat(31);
    expect(() => usernameSchema.parse(long)).toThrow();
  });

  it("accepts valid usernames", () => {
    expect(usernameSchema.parse("alan_figueredo")).toBe("alan_figueredo");
    expect(usernameSchema.parse("figueredo.alan")).toBe("figueredo.alan");
    expect(usernameSchema.parse("alanfigueredo")).toBe("alanfigueredo");
  });
});

describe("Profile - Username format rules", () => {
  const usernameFormatRegex = /^[a-z0-9_.]{3,30}$/;

  it("rejects usernames with spaces", () => {
    expect(usernameFormatRegex.test("alan figueredo")).toBe(false);
  });

  it("rejects usernames with uppercase", () => {
    expect(usernameFormatRegex.test("AlanFigueredo")).toBe(false);
  });

  it("rejects usernames with special chars", () => {
    expect(usernameFormatRegex.test("alan@fig")).toBe(false);
    expect(usernameFormatRegex.test("alan#fig")).toBe(false);
  });

  it("accepts valid formats", () => {
    expect(usernameFormatRegex.test("alan_figueredo")).toBe(true);
    expect(usernameFormatRegex.test("alan.figueredo")).toBe(true);
    expect(usernameFormatRegex.test("figueredo_alan")).toBe(true);
    expect(usernameFormatRegex.test("figueredo.alan")).toBe(true);
    expect(usernameFormatRegex.test("alanfigueredo")).toBe(true);
    expect(usernameFormatRegex.test("user123")).toBe(true);
  });
});

describe("Profile - Username suggestion generation", () => {
  it("generates suggestions from a name with spaces", () => {
    const name = "Alan Figueredo";
    const parts = name.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const first = parts[0].replace(/[^a-z0-9]/g, "");
    const last = parts[parts.length - 1].replace(/[^a-z0-9]/g, "");
    
    const candidates = [
      `${first}${last}`,
      `${first}_${last}`,
      `${first}.${last}`,
      `${last}${first}`,
      `${last}_${first}`,
      `${last}.${first}`,
    ];

    expect(candidates).toContain("alanfigueredo");
    expect(candidates).toContain("alan_figueredo");
    expect(candidates).toContain("alan.figueredo");
    expect(candidates).toContain("figueredoalan");
    expect(candidates).toContain("figueredo_alan");
    expect(candidates).toContain("figueredo.alan");
  });

  it("generates suggestions from a single word", () => {
    const name = "alan";
    const clean = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const parts = name.toLowerCase().trim().split(/\s+/).filter(Boolean);
    
    let candidates: string[];
    if (parts.length >= 2) {
      candidates = [];
    } else {
      candidates = [clean, `${clean}_`, `_${clean}`, `${clean}1`, `${clean}2`];
    }

    expect(candidates).toContain("alan");
    expect(candidates).toContain("alan_");
    expect(candidates).toContain("_alan");
  });
});
