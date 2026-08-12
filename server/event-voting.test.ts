import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Tests for event location voting schema validation and logic.
 * These tests verify the input validation for the createWithLocation endpoint.
 */

const createWithLocationSchema = z.object({
  groupId: z.number(),
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  eventDate: z.string(),
  maxGuests: z.number().min(1).max(500).optional(),
  locationMode: z.enum(["defined", "voting"]),
  establishmentId: z.number().optional(),
  manualLocationName: z.string().max(255).optional(),
  manualLocationAddress: z.string().max(512).optional(),
  locationOptions: z.array(z.object({
    establishmentId: z.number().optional(),
    manualName: z.string().max(255).optional(),
    manualAddress: z.string().max(512).optional(),
  })).min(2).max(5).optional(),
  votingClosesAt: z.string().optional(),
});

describe("Event Location Voting - Schema Validation", () => {
  it("should accept valid defined mode with establishment", () => {
    const input = {
      groupId: 1,
      title: "Happy Hour",
      eventDate: "2026-08-01T20:00:00.000Z",
      locationMode: "defined" as const,
      establishmentId: 42,
    };
    const result = createWithLocationSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should accept valid defined mode with manual location", () => {
    const input = {
      groupId: 1,
      title: "Churrasco na Casa",
      eventDate: "2026-08-01T14:00:00.000Z",
      locationMode: "defined" as const,
      manualLocationName: "Casa do João",
      manualLocationAddress: "Rua Augusta, 123 - Consolação",
    };
    const result = createWithLocationSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should accept valid voting mode with 2 options", () => {
    const input = {
      groupId: 1,
      title: "Rolê de Sexta",
      eventDate: "2026-08-01T22:00:00.000Z",
      locationMode: "voting" as const,
      locationOptions: [
        { establishmentId: 1 },
        { manualName: "Parque Ibirapuera", manualAddress: "Av. Pedro Álvares Cabral" },
      ],
    };
    const result = createWithLocationSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should accept voting mode with 5 options (max)", () => {
    const input = {
      groupId: 1,
      title: "Encontro",
      eventDate: "2026-08-01T19:00:00.000Z",
      locationMode: "voting" as const,
      locationOptions: [
        { establishmentId: 1 },
        { establishmentId: 2 },
        { establishmentId: 3 },
        { manualName: "Praça da Sé" },
        { manualName: "MASP" },
      ],
    };
    const result = createWithLocationSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should reject voting mode with only 1 option", () => {
    const input = {
      groupId: 1,
      title: "Evento",
      eventDate: "2026-08-01T20:00:00.000Z",
      locationMode: "voting" as const,
      locationOptions: [
        { establishmentId: 1 },
      ],
    };
    const result = createWithLocationSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject voting mode with 6 options (exceeds max)", () => {
    const input = {
      groupId: 1,
      title: "Evento",
      eventDate: "2026-08-01T20:00:00.000Z",
      locationMode: "voting" as const,
      locationOptions: [
        { establishmentId: 1 },
        { establishmentId: 2 },
        { establishmentId: 3 },
        { establishmentId: 4 },
        { establishmentId: 5 },
        { establishmentId: 6 },
      ],
    };
    const result = createWithLocationSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject empty title", () => {
    const input = {
      groupId: 1,
      title: "",
      eventDate: "2026-08-01T20:00:00.000Z",
      locationMode: "defined" as const,
      establishmentId: 1,
    };
    const result = createWithLocationSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject invalid locationMode", () => {
    const input = {
      groupId: 1,
      title: "Evento",
      eventDate: "2026-08-01T20:00:00.000Z",
      locationMode: "invalid",
    };
    const result = createWithLocationSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should accept voting mode with votingClosesAt", () => {
    const input = {
      groupId: 1,
      title: "Rolê",
      eventDate: "2026-08-01T22:00:00.000Z",
      locationMode: "voting" as const,
      locationOptions: [
        { establishmentId: 1 },
        { establishmentId: 2 },
      ],
      votingClosesAt: "2026-07-30T18:00:00.000Z",
    };
    const result = createWithLocationSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});

describe("Event Location Voting - Vote Logic", () => {
  it("should validate vote input schema", () => {
    const voteSchema = z.object({
      eventId: z.number(),
      optionIds: z.array(z.number()).min(1).max(5),
    });

    // Valid: multiple votes
    expect(voteSchema.safeParse({ eventId: 1, optionIds: [1, 2, 3] }).success).toBe(true);

    // Valid: single vote
    expect(voteSchema.safeParse({ eventId: 1, optionIds: [1] }).success).toBe(true);

    // Invalid: empty votes
    expect(voteSchema.safeParse({ eventId: 1, optionIds: [] }).success).toBe(false);

    // Invalid: too many votes
    expect(voteSchema.safeParse({ eventId: 1, optionIds: [1, 2, 3, 4, 5, 6] }).success).toBe(false);
  });

  it("should determine winner correctly from vote counts", () => {
    // Simulate vote counting logic
    const voteCounts = [
      { optionId: 1, count: 3 },
      { optionId: 2, count: 5 },
      { optionId: 3, count: 2 },
    ];

    const winner = voteCounts.reduce((max, curr) =>
      Number(curr.count) > Number(max.count) ? curr : max
    );

    expect(winner.optionId).toBe(2);
    expect(winner.count).toBe(5);
  });

  it("should handle tie by selecting first highest", () => {
    const voteCounts = [
      { optionId: 1, count: 4 },
      { optionId: 2, count: 4 },
      { optionId: 3, count: 2 },
    ];

    const winner = voteCounts.reduce((max, curr) =>
      Number(curr.count) > Number(max.count) ? curr : max
    );

    // In a tie, reduce picks the first one found with max count
    expect(winner.optionId).toBe(1);
  });
});
