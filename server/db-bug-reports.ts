import { getDb } from "./db";
import { bugReports, users } from "../drizzle/schema";
import { desc, eq } from "drizzle-orm";

export type BugReportCategory = "bug" | "broken_route" | "performance" | "content" | "account" | "other";
export type BugReportSeverity = "low" | "medium" | "high" | "critical";
export type BugReportStatus = "open" | "triaged" | "in_progress" | "resolved" | "closed";

export interface CreateBugReportInput {
  createdById: number;
  title: string;
  description: string;
  category: BugReportCategory;
  severity: BugReportSeverity;
  routePath?: string;
  platform?: string;
  userAgent?: string;
  viewport?: string;
  online?: boolean;
  appVersion?: string;
  errorMessage?: string;
  contextJson?: string;
}

export async function createBugReport(data: CreateBugReportInput) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [lastReport] = await db
    .select({ id: bugReports.id })
    .from(bugReports)
    .orderBy(desc(bugReports.id))
    .limit(1);

  const nextNum = (lastReport?.id ?? 0) + 1;
  const code = `bug${String(nextNum).padStart(6, "0")}`;

  const [result] = await db.insert(bugReports).values({
    code,
    createdById: data.createdById,
    title: data.title,
    description: data.description,
    category: data.category,
    severity: data.severity,
    routePath: data.routePath ?? null,
    platform: data.platform ?? null,
    userAgent: data.userAgent ?? null,
    viewport: data.viewport ?? null,
    online: data.online ?? null,
    appVersion: data.appVersion ?? null,
    errorMessage: data.errorMessage ?? null,
    contextJson: data.contextJson ?? null,
  });

  return { id: result.insertId, code };
}

export async function getUserBugReports(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: bugReports.id,
      code: bugReports.code,
      title: bugReports.title,
      description: bugReports.description,
      category: bugReports.category,
      severity: bugReports.severity,
      status: bugReports.status,
      routePath: bugReports.routePath,
      resolution: bugReports.resolution,
      createdAt: bugReports.createdAt,
      updatedAt: bugReports.updatedAt,
      resolvedAt: bugReports.resolvedAt,
    })
    .from(bugReports)
    .where(eq(bugReports.createdById, userId))
    .orderBy(desc(bugReports.createdAt));
}

export async function getAllBugReports() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: bugReports.id,
      code: bugReports.code,
      title: bugReports.title,
      description: bugReports.description,
      category: bugReports.category,
      severity: bugReports.severity,
      status: bugReports.status,
      routePath: bugReports.routePath,
      platform: bugReports.platform,
      userAgent: bugReports.userAgent,
      viewport: bugReports.viewport,
      online: bugReports.online,
      appVersion: bugReports.appVersion,
      errorMessage: bugReports.errorMessage,
      contextJson: bugReports.contextJson,
      assignedToId: bugReports.assignedToId,
      resolution: bugReports.resolution,
      resolvedAt: bugReports.resolvedAt,
      createdAt: bugReports.createdAt,
      updatedAt: bugReports.updatedAt,
      reporterName: users.name,
      reporterUsername: users.username,
      reporterEmail: users.email,
    })
    .from(bugReports)
    .leftJoin(users, eq(bugReports.createdById, users.id))
    .orderBy(desc(bugReports.createdAt));
}

export async function updateBugReport(data: {
  id: number;
  status?: BugReportStatus;
  severity?: BugReportSeverity;
  assignedToId?: number | null;
  resolution?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const resolved = data.status === "resolved" || data.status === "closed";
  await db
    .update(bugReports)
    .set({
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.severity !== undefined ? { severity: data.severity } : {}),
      ...(data.assignedToId !== undefined ? { assignedToId: data.assignedToId } : {}),
      ...(data.resolution !== undefined ? { resolution: data.resolution } : {}),
      ...(resolved ? { resolvedAt: new Date() } : data.status ? { resolvedAt: null } : {}),
    })
    .where(eq(bugReports.id, data.id));

  return { success: true };
}
