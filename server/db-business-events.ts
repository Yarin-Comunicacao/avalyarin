import { eq, and, desc, sql, lte } from "drizzle-orm";
import { getDb } from "./db";
import { groupEvents, eventRsvps, eventAttendance, users, groups } from "../drizzle/schema";

// ============================================================
// 1. Confirm/Reject Reservation
// ============================================================
export async function confirmOrRejectEvent(
  eventId: number,
  action: "confirm" | "reject",
  rejectionReason?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(groupEvents).set({
    businessStatus: action === "confirm" ? "confirmed" : "rejected",
    businessRejectionReason: action === "reject" ? (rejectionReason || null) : null,
  }).where(eq(groupEvents.id, eventId));

  return { success: true };
}

// ============================================================
// 2. Update Max Guests
// ============================================================
export async function updateEventMaxGuests(eventId: number, maxGuests: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(groupEvents).set({ maxGuests }).where(eq(groupEvents.id, eventId));
  return { success: true };
}

// ============================================================
// 3. Add Business Note
// ============================================================
export async function addBusinessNote(eventId: number, note: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(groupEvents).set({ businessNote: note }).where(eq(groupEvents.id, eventId));
  return { success: true };
}

// ============================================================
// 4. Mark Event as Completed
// ============================================================
export async function markEventCompleted(eventId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(groupEvents).set({ status: "completed" }).where(eq(groupEvents.id, eventId));
  return { success: true };
}

// ============================================================
// 7. Add Promotion
// ============================================================
export async function addEventPromotion(
  eventId: number,
  promoCode?: string,
  promoDescription?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(groupEvents).set({
    promoCode: promoCode || null,
    promoDescription: promoDescription || null,
  }).where(eq(groupEvents.id, eventId));

  return { success: true };
}

// ============================================================
// 8. Suggest Special Menu
// ============================================================
export async function suggestEventMenu(eventId: number, suggestedMenu: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(groupEvents).set({ suggestedMenu }).where(eq(groupEvents.id, eventId));
  return { success: true };
}

// ============================================================
// 9. Reschedule Event
// ============================================================
export async function rescheduleEvent(eventId: number, newDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get current date to save as originalDate
  const [current] = await db.select({ eventDate: groupEvents.eventDate })
    .from(groupEvents).where(eq(groupEvents.id, eventId));

  await db.update(groupEvents).set({
    originalDate: current?.eventDate || null,
    eventDate: newDate,
    rescheduledBy: "business",
  }).where(eq(groupEvents.id, eventId));

  return { success: true };
}

// ============================================================
// 10. Cancel Event (by business)
// ============================================================
export async function cancelEventByBusiness(eventId: number, reason: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(groupEvents).set({
    status: "cancelled",
    cancelReason: reason,
    cancelledBy: "business",
  }).where(eq(groupEvents.id, eventId));

  return { success: true };
}

// ============================================================
// 11. Export Confirmed List
// ============================================================
export async function getConfirmedAttendees(eventId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const attendees = await db.select({
    userId: eventRsvps.userId,
    status: eventRsvps.status,
    name: users.name,
    username: users.username,
    profilePhotoUrl: users.profilePhotoUrl,
    respondedAt: eventRsvps.respondedAt,
  })
    .from(eventRsvps)
    .innerJoin(users, eq(users.id, eventRsvps.userId))
    .where(eq(eventRsvps.eventId, eventId))
    .orderBy(eventRsvps.respondedAt);

  return attendees;
}

// ============================================================
// 12. Mark Attendance
// ============================================================
export async function markEventAttendance(
  eventId: number,
  attendees: { userId: number; attended: boolean }[],
  markedBy: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete existing attendance records for this event
  await db.delete(eventAttendance).where(eq(eventAttendance.eventId, eventId));

  // Insert new attendance records
  if (attendees.length > 0) {
    await db.insert(eventAttendance).values(
      attendees.map(a => ({
        eventId,
        userId: a.userId,
        attended: a.attended,
        markedBy,
      }))
    );
  }

  // Mark event as attendance tracked
  await db.update(groupEvents).set({ attendanceMarked: true }).where(eq(groupEvents.id, eventId));

  return { success: true };
}

// ============================================================
// 13. Get Event History for establishment
// ============================================================
export async function getEventHistory(establishmentId: number, limit = 20) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const events = await db.select({
    id: groupEvents.id,
    code: groupEvents.code,
    groupId: groupEvents.groupId,
    title: groupEvents.title,
    eventDate: groupEvents.eventDate,
    eventType: groupEvents.eventType,
    status: groupEvents.status,
    businessStatus: groupEvents.businessStatus,
    attendanceMarked: groupEvents.attendanceMarked,
    creatorName: users.name,
    groupName: groups.name,
  })
    .from(groupEvents)
    .innerJoin(users, eq(users.id, groupEvents.creatorId))
    .innerJoin(groups, eq(groups.id, groupEvents.groupId))
    .where(and(
      eq(groupEvents.establishmentId, establishmentId),
      lte(groupEvents.eventDate, new Date()),
    ))
    .orderBy(desc(groupEvents.eventDate))
    .limit(limit);

  // Get attendance stats for completed events
  const eventsWithStats = await Promise.all(events.map(async (event: any) => {
    const rsvpCounts = await db.select({
      status: eventRsvps.status,
      count: sql<number>`COUNT(*)`,
    })
      .from(eventRsvps)
      .where(eq(eventRsvps.eventId, event.id))
      .groupBy(eventRsvps.status);

    const confirmed = Number(rsvpCounts.find((r: any) => r.status === 'confirmed')?.count || 0);
    const maybe = Number(rsvpCounts.find((r: any) => r.status === 'maybe')?.count || 0);

    let attendedCount = 0;
    if (event.attendanceMarked) {
      const [att] = await db.select({ count: sql<number>`COUNT(*)` })
        .from(eventAttendance)
        .where(and(eq(eventAttendance.eventId, event.id), eq(eventAttendance.attended, true)));
      attendedCount = Number(att?.count || 0);
    }

    return {
      ...event,
      rsvpConfirmed: confirmed,
      rsvpMaybe: maybe,
      attendedCount,
      attendanceRate: event.attendanceMarked && confirmed > 0
        ? Math.round((attendedCount / confirmed) * 100)
        : null,
    };
  }));

  return eventsWithStats;
}

// ============================================================
// Helper: Get event with ownership verification
// ============================================================
export async function getGroupEventById(eventId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [event] = await db.select({
    id: groupEvents.id,
    groupId: groupEvents.groupId,
    establishmentId: groupEvents.establishmentId,
    title: groupEvents.title,
    eventType: groupEvents.eventType,
    status: groupEvents.status,
    businessStatus: groupEvents.businessStatus,
  })
    .from(groupEvents)
    .where(eq(groupEvents.id, eventId));

  return event || null;
}
