import { getDb } from "./db";
import { establishmentEvents, eventBatches } from "../drizzle/schema";
import { eq, and, gte, desc, asc } from "drizzle-orm";

// ============================================================
// Event Types & Labels
// ============================================================
export const EVENT_TYPES = [
  { value: "esporte", label: "Esporte" },
  { value: "show", label: "Show" },
  { value: "festa", label: "Festa" },
  { value: "gastronomia", label: "Gastronomia" },
  { value: "cultural", label: "Cultural" },
  { value: "stand_up", label: "Stand-Up" },
  { value: "quiz", label: "Quiz / Trivia" },
  { value: "degustacao", label: "Degustação" },
  { value: "workshop", label: "Workshop" },
  { value: "karaoke", label: "Karaokê" },
  { value: "dj", label: "DJ Set" },
  { value: "sertanejo", label: "Sertanejo" },
  { value: "pagode", label: "Pagode" },
  { value: "forro", label: "Forró" },
  { value: "samba", label: "Samba" },
  { value: "outro", label: "Outro" },
] as const;

export type EventTypeValue = (typeof EVENT_TYPES)[number]["value"];

// ============================================================
// Create Event
// ============================================================
export async function createEstablishmentEvent(data: {
  establishmentId: number;
  createdById: number;
  title: string;
  description: string;
  coverImageUrl: string;
  coverImageKey?: string;
  startDate: number;
  endDate: number;
  locationType: "establishment" | "custom";
  customAddress?: string;
  customAddressNumber?: string;
  customNeighborhood?: string;
  customCity?: string;
  entryType: "free" | "paid";
  paidType?: "single" | "batches";
  singlePrice?: number;
  hasDoorPrice?: boolean;
  doorPrice?: number;
  eventType: string;
  batches?: { batchNumber: number; batchName: string; price: number }[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { batches, ...eventData } = data;

  const [result] = await db.insert(establishmentEvents).values({
    ...eventData,
    eventType: eventData.eventType as any,
    paidType: eventData.paidType as any || "single",
    hasDoorPrice: eventData.hasDoorPrice || false,
  });

  const eventId = result.insertId;

  // Insert batches if paid by batches
  if (data.entryType === "paid" && data.paidType === "batches" && batches && batches.length > 0) {
    await db.insert(eventBatches).values(
      batches.map((b) => ({
        eventId,
        batchNumber: b.batchNumber,
        batchName: b.batchName,
        price: b.price,
      }))
    );
  }

  return eventId;
}

// ============================================================
// List Active Events for an Establishment (public)
// ============================================================
export async function listActiveEvents(establishmentId: number) {
  const db = await getDb();
  if (!db) return [];

  const now = Date.now();
  const rows = await db
    .select()
    .from(establishmentEvents)
    .where(
      and(
        eq(establishmentEvents.establishmentId, establishmentId),
        eq(establishmentEvents.status, "active"),
        gte(establishmentEvents.endDate, now) // evento ainda não terminou
      )
    )
    .orderBy(asc(establishmentEvents.startDate));

  // Fetch batches for paid events
  const eventsWithBatches = await Promise.all(
    rows.map(async (event: typeof rows[number]) => {
      if (event.entryType === "paid" && event.paidType === "batches") {
        const batchRows = await db
          .select()
          .from(eventBatches)
          .where(eq(eventBatches.eventId, event.id))
          .orderBy(asc(eventBatches.batchNumber));
        return { ...event, batches: batchRows };
      }
      return { ...event, batches: [] as any[] };
    })
  );

  return eventsWithBatches;
}

// ============================================================
// List All Events for Business (including past/cancelled)
// ============================================================
export async function listBusinessEvents(establishmentId: number) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select()
    .from(establishmentEvents)
    .where(eq(establishmentEvents.establishmentId, establishmentId))
    .orderBy(desc(establishmentEvents.startDate));

  const eventsWithBatches = await Promise.all(
    rows.map(async (event: typeof rows[number]) => {
      if (event.entryType === "paid" && event.paidType === "batches") {
        const batchRows = await db
          .select()
          .from(eventBatches)
          .where(eq(eventBatches.eventId, event.id))
          .orderBy(asc(eventBatches.batchNumber));
        return { ...event, batches: batchRows };
      }
      return { ...event, batches: [] as any[] };
    })
  );

  return eventsWithBatches;
}

// ============================================================
// Cancel Event
// ============================================================
export async function cancelEstablishmentEvent(eventId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(establishmentEvents)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(establishmentEvents.id, eventId),
        eq(establishmentEvents.createdById, userId)
      )
    );
}

// ============================================================
// Get Single Event
// ============================================================
export async function getEstablishmentEvent(eventId: number) {
  const db = await getDb();
  if (!db) return null;

  const [event] = await db
    .select()
    .from(establishmentEvents)
    .where(eq(establishmentEvents.id, eventId));

  if (!event) return null;

  if (event.entryType === "paid" && event.paidType === "batches") {
    const batchRows = await db
      .select()
      .from(eventBatches)
      .where(eq(eventBatches.eventId, event.id))
      .orderBy(asc(eventBatches.batchNumber));
    return { ...event, batches: batchRows };
  }

  return { ...event, batches: [] as any[] };
}
