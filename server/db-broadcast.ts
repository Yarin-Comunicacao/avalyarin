/**
 * Broadcast Groups — "Grupos de Transmissão"
 * Auto-created for establishments, specialists, and critics.
 * Only the linked entity owner can send messages.
 * Users auto-join when they save an estab or follow a specialist/critic.
 */
import { eq, and, isNull } from "drizzle-orm";
import { getDb } from "./db";
import { groups, groupMembers, users } from "../drizzle/schema";

// Generate a unique group code
function generateGroupCode(): string {
  const num = Math.floor(Math.random() * 999999) + 1;
  return `gr${String(num).padStart(6, "0")}`;
}

/**
 * Get or create a broadcast group for an entity.
 */
export async function getOrCreateBroadcastGroup(params: {
  entityId: number;
  entityType: "establishment" | "specialist" | "critic";
  name: string;
  creatorId: number;
}): Promise<{ id: number; isNew: boolean }> {
  const db = await getDb();
  const existing = await db
    .select({ id: groups.id })
    .from(groups)
    .where(
      and(
        eq(groups.type, "broadcast"),
        eq(groups.linkedEntityId, params.entityId),
        eq(groups.linkedEntityType, params.entityType)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return { id: existing[0].id, isNew: false };
  }

  const code = generateGroupCode();
  const [result] = await db.insert(groups).values({
    code,
    name: params.name,
    description: `Grupo de Transmissão de ${params.name}`,
    type: "broadcast",
    creatorId: params.creatorId,
    linkedEntityId: params.entityId,
    linkedEntityType: params.entityType,
    isFixed: true,
    memberCount: 1,
  });

  const groupId = result.insertId;

  await db.insert(groupMembers).values({
    groupId,
    userId: params.creatorId,
    role: "creator",
  });

  return { id: groupId, isNew: true };
}

/**
 * Auto-join a user to a broadcast group.
 */
export async function autoJoinBroadcastGroup(groupId: number, userId: number): Promise<void> {
  const db = await getDb();
  const existing = await db
    .select({ id: groupMembers.id, leftAt: groupMembers.leftAt })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
    .limit(1);

  if (existing.length > 0) {
    if (existing[0].leftAt) {
      await db
        .update(groupMembers)
        .set({ leftAt: null, hidden: false })
        .where(eq(groupMembers.id, existing[0].id));
      const count = await getActiveMemberCount(groupId);
      await db.update(groups).set({ memberCount: count }).where(eq(groups.id, groupId));
    }
    return;
  }

  await db.insert(groupMembers).values({
    groupId,
    userId,
    role: "follower",
  });

  const count = await getActiveMemberCount(groupId);
  await db.update(groups).set({ memberCount: count }).where(eq(groups.id, groupId));
}

/**
 * Leave a broadcast group (sets leftAt timestamp).
 */
export async function leaveBroadcastGroup(groupId: number, userId: number): Promise<void> {
  const db = await getDb();
  await db
    .update(groupMembers)
    .set({ leftAt: new Date() })
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));

  const count = await getActiveMemberCount(groupId);
  await db.update(groups).set({ memberCount: count }).where(eq(groups.id, groupId));
}

/**
 * Hide/unhide a broadcast group (silences notifications).
 */
export async function toggleHideBroadcastGroup(groupId: number, userId: number, hide: boolean): Promise<void> {
  const db = await getDb();
  await db
    .update(groupMembers)
    .set({ hidden: hide })
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
}

/**
 * Get broadcast group for an entity.
 */
export async function getBroadcastGroupForEntity(
  entityId: number,
  entityType: "establishment" | "specialist" | "critic"
): Promise<{ id: number; name: string } | null> {
  const db = await getDb();
  const result = await db
    .select({ id: groups.id, name: groups.name })
    .from(groups)
    .where(
      and(
        eq(groups.type, "broadcast"),
        eq(groups.linkedEntityId, entityId),
        eq(groups.linkedEntityType, entityType)
      )
    )
    .limit(1);

  return result[0] || null;
}

/**
 * Get all broadcast groups a user is a member of (active, not hidden).
 */
export async function getUserBroadcastGroups(userId: number, includeHidden: boolean = false) {
  const db = await getDb();
  const baseWhere = includeHidden
    ? and(
        eq(groupMembers.userId, userId),
        eq(groups.type, "broadcast"),
        isNull(groupMembers.leftAt)
      )
    : and(
        eq(groupMembers.userId, userId),
        eq(groups.type, "broadcast"),
        isNull(groupMembers.leftAt),
        eq(groupMembers.hidden, false)
      );

  return await db
    .select({
      id: groups.id,
      name: groups.name,
      description: groups.description,
      memberCount: groups.memberCount,
      linkedEntityId: groups.linkedEntityId,
      linkedEntityType: groups.linkedEntityType,
      image: groups.image,
      hidden: groupMembers.hidden,
      joinedAt: groupMembers.joinedAt,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groupMembers.groupId, groups.id))
    .where(baseWhere);
}

/**
 * Get hidden broadcast groups for a user.
 */
export async function getUserHiddenGroups(userId: number) {
  const db = await getDb();
  return await db
    .select({
      id: groups.id,
      name: groups.name,
      description: groups.description,
      memberCount: groups.memberCount,
      linkedEntityId: groups.linkedEntityId,
      linkedEntityType: groups.linkedEntityType,
      image: groups.image,
      hidden: groupMembers.hidden,
      joinedAt: groupMembers.joinedAt,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groupMembers.groupId, groups.id))
    .where(
      and(
        eq(groupMembers.userId, userId),
        eq(groupMembers.hidden, true),
        isNull(groupMembers.leftAt)
      )
    );
}

/**
 * Count active members in a group (not left).
 */
async function getActiveMemberCount(groupId: number): Promise<number> {
  const db = await getDb();
  const result = await db
    .select({ id: groupMembers.id })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), isNull(groupMembers.leftAt)));
  return result.length;
}

/**
 * Check if a user can send messages in a broadcast group.
 */
export async function canSendBroadcastMessage(groupId: number, userId: number): Promise<{ allowed: boolean; reason?: string }> {
  const db = await getDb();
  const group = await db
    .select({
      id: groups.id,
      creatorId: groups.creatorId,
      linkedEntityType: groups.linkedEntityType,
    })
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1);

    if (!group[0]) return { allowed: false, reason: "Grupo não encontrado" };

  if (group[0].creatorId !== userId) {
    return { allowed: false, reason: "Apenas o dono deste grupo pode enviar mensagens" };
  }

  if (group[0].linkedEntityType === "establishment") {
    const user = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user[0]?.role === "business") {
      // TODO: Check Business Pro plan when plans are fully implemented
      return { allowed: true };
    }
  }

  return { allowed: true };
}

/**
 * Check if a broadcast group can be deleted.
 */
export async function canDeleteBroadcastGroup(groupId: number, userRole: string): Promise<boolean> {
  const db = await getDb();
  const group = await db
    .select({ isFixed: groups.isFixed })
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1);

  if (!group[0]) return false;

  if (group[0].isFixed) {
    return ["support", "admin", "owner"].includes(userRole);
  }

  return true;
}
