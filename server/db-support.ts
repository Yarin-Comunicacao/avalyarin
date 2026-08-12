import { getDb } from "./db";
import { supportAssignments, supportTickets, establishments, users } from "../drizzle/schema";
import { eq, and, desc, count, sql, inArray } from "drizzle-orm";

/**
 * Get all establishments assigned to a support user
 */
export async function getSupportAssignments(supportUserId: number) {
  const db = await getDb();
  if (!db) return [];
  const assignments = await db
    .select({
      id: supportAssignments.id,
      establishmentId: supportAssignments.establishmentId,
      assignedAt: supportAssignments.assignedAt,
      estabName: establishments.name,
      estabAddress: establishments.address,
      estabNeighborhood: establishments.neighborhood,
      estabStatus: establishments.status,
    })
    .from(supportAssignments)
    .innerJoin(establishments, eq(supportAssignments.establishmentId, establishments.id))
    .where(eq(supportAssignments.supportUserId, supportUserId))
    .orderBy(establishments.name);
  return assignments;
}

/**
 * Check if a support user has access to a specific establishment
 */
export async function supportHasAccessToEstab(supportUserId: number, establishmentId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const [result] = await db
    .select({ id: supportAssignments.id })
    .from(supportAssignments)
    .where(
      and(
        eq(supportAssignments.supportUserId, supportUserId),
        eq(supportAssignments.establishmentId, establishmentId)
      )
    )
    .limit(1);
  return !!result;
}

/**
 * Assign establishments to a support user (admin action)
 */
export async function assignEstabsToSupport(
  supportUserId: number,
  establishmentIds: number[],
  assignedBy: number
) {
  const db = await getDb();
  if (!db) return;
  if (establishmentIds.length === 0) return;
  const values = establishmentIds.map((estabId) => ({
    supportUserId,
    establishmentId: estabId,
    assignedBy,
  }));
  await db.insert(supportAssignments).values(values);
}

/**
 * Remove an establishment from a support user's portfolio (admin action)
 */
export async function revokeEstabFromSupport(supportUserId: number, establishmentId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(supportAssignments)
    .where(
      and(
        eq(supportAssignments.supportUserId, supportUserId),
        eq(supportAssignments.establishmentId, establishmentId)
      )
    );
}

/**
 * Create a support ticket
 */
export async function createSupportTicket(data: {
  establishmentId: number;
  supportUserId?: number;
  createdById: number;
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high" | "urgent";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Generate code
  const [lastTicket] = await db
    .select({ id: supportTickets.id })
    .from(supportTickets)
    .orderBy(desc(supportTickets.id))
    .limit(1);
  const nextNum = (lastTicket?.id ?? 0) + 1;
  const code = `st${String(nextNum).padStart(6, "0")}`;

  const [result] = await db.insert(supportTickets).values({
    code,
    establishmentId: data.establishmentId,
    supportUserId: data.supportUserId ?? null,
    createdById: data.createdById,
    title: data.title,
    description: data.description ?? null,
    priority: data.priority ?? "medium",
  });
  return { id: result.insertId, code };
}

/**
 * Get tickets for a support user (only from their assigned estabs)
 */
export async function getSupportTickets(supportUserId: number) {
  const db = await getDb();
  if (!db) return [];
  const assignedEstabIds = await db
    .select({ establishmentId: supportAssignments.establishmentId })
    .from(supportAssignments)
    .where(eq(supportAssignments.supportUserId, supportUserId));

  const estabIds = assignedEstabIds.map((a: { establishmentId: number }) => a.establishmentId);
  if (estabIds.length === 0) return [];

  const tickets = await db
    .select({
      id: supportTickets.id,
      code: supportTickets.code,
      establishmentId: supportTickets.establishmentId,
      estabName: establishments.name,
      title: supportTickets.title,
      description: supportTickets.description,
      priority: supportTickets.priority,
      status: supportTickets.status,
      createdAt: supportTickets.createdAt,
      updatedAt: supportTickets.updatedAt,
    })
    .from(supportTickets)
    .innerJoin(establishments, eq(supportTickets.establishmentId, establishments.id))
    .where(inArray(supportTickets.establishmentId, estabIds))
    .orderBy(desc(supportTickets.createdAt));

  return tickets;
}

/**
 * Resolve a ticket
 */
export async function resolveSupportTicket(ticketId: number, resolution: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(supportTickets)
    .set({
      status: "resolved",
      resolution,
      resolvedAt: new Date(),
    })
    .where(eq(supportTickets.id, ticketId));
}

/**
 * Get support stats for a user
 */
export async function getSupportStats(supportUserId: number) {
  const db = await getDb();
  if (!db) return { totalEstabs: 0, openTickets: 0, resolvedToday: 0 };
  const assignedEstabIds = await db
    .select({ establishmentId: supportAssignments.establishmentId })
    .from(supportAssignments)
    .where(eq(supportAssignments.supportUserId, supportUserId));

  const estabIds = assignedEstabIds.map((a: { establishmentId: number }) => a.establishmentId);
  if (estabIds.length === 0) return { totalEstabs: 0, openTickets: 0, resolvedToday: 0 };

  const [openCount] = await db
    .select({ count: count() })
    .from(supportTickets)
    .where(
      and(
        inArray(supportTickets.establishmentId, estabIds),
        sql`${supportTickets.status} IN ('open', 'in_progress')`
      )
    );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [resolvedToday] = await db
    .select({ count: count() })
    .from(supportTickets)
    .where(
      and(
        inArray(supportTickets.establishmentId, estabIds),
        eq(supportTickets.status, "resolved"),
        sql`${supportTickets.resolvedAt} >= ${today}`
      )
    );

  return {
    totalEstabs: estabIds.length,
    openTickets: openCount?.count ?? 0,
    resolvedToday: resolvedToday?.count ?? 0,
  };
}

/**
 * Get all support users (admin view)
 */
export async function getAllSupportUsers() {
  const db = await getDb();
  if (!db) return [];
  const supportUsers = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      email: users.email,
    })
    .from(users)
    .where(eq(users.role, "support"))
    .orderBy(users.name);
  return supportUsers;
}

/**
 * Get assignment count per support user (admin view)
 */
export async function getSupportAssignmentCounts() {
  const db = await getDb();
  if (!db) return [];
  const counts = await db
    .select({
      supportUserId: supportAssignments.supportUserId,
      count: count(),
    })
    .from(supportAssignments)
    .groupBy(supportAssignments.supportUserId);
  return counts;
}
