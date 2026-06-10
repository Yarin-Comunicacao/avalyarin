import { eq, and, or, desc, sql, like } from "drizzle-orm";
import { getDb, generateCode } from "./db";
import {
  groups, groupMembers, groupInvites, groupSharedRatings, userPlans,
  users, ratings, ratingItems, establishments,
  type Group, type GroupMember, type GroupInvite, type GroupSharedRating
} from "../drizzle/schema";

// ─── User Plan ───────────────────────────────────────────────────────────────

export async function getUserPlan(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [plan] = await db.select().from(userPlans).where(eq(userPlans.userId, userId)).limit(1);
  return plan ?? null;
}

export async function getUserPlanOrDefault(userId: number) {
  const plan = await getUserPlan(userId);
  return plan?.plan ?? "free";
}

// ─── Groups CRUD ─────────────────────────────────────────────────────────────

export async function createGroup(data: {
  name: string;
  description?: string;
  type: "private" | "influencer";
  creatorId: number;
  image?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check plan limits
  const plan = await getUserPlanOrDefault(data.creatorId);
  
  if (data.type === "influencer" && plan !== "premium" && plan !== "embaixador") {
    throw new Error("PLAN_REQUIRED: Grupos de influencer requerem plano premium");
  }

  if (plan === "free") {
    const userGroupCount = await countUserGroups(data.creatorId);
    if (userGroupCount >= 3) {
      throw new Error("PLAN_LIMIT: Limite de 3 grupos atingido no plano gratuito");
    }
  }

  // Generate code for new group
  const groupCode = await generateCode('groups');

  const [result] = await db.insert(groups).values({
    name: data.name,
    code: groupCode,
    description: data.description ?? null,
    type: data.type,
    creatorId: data.creatorId,
    image: data.image ?? null,
    memberCount: 1,
  });

  const groupId = result.insertId;

  // Add creator as admin/creator member
  await db.insert(groupMembers).values({
    groupId: Number(groupId),
    userId: data.creatorId,
    role: data.type === "private" ? "admin" : "creator",
  });

  return { id: Number(groupId) };
}

export async function countUserGroups(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const [result] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(groups)
    .where(eq(groups.creatorId, userId));
  return result?.count ?? 0;
}

export async function getMyGroups(userId: number) {
  const db = await getDb();
  if (!db) return [];

  // Groups where user is a member (private groups they belong to + influencer groups they created)
  const rows = await db
    .select({
      id: groups.id,
      name: groups.name,
      description: groups.description,
      type: groups.type,
      creatorId: groups.creatorId,
      image: groups.image,
      memberCount: groups.memberCount,
      createdAt: groups.createdAt,
      role: groupMembers.role,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groupMembers.groupId, groups.id))
    .where(
      and(
        eq(groupMembers.userId, userId),
        or(
          eq(groups.type, "private"),
          and(eq(groups.type, "influencer"), eq(groups.creatorId, userId))
        )
      )
    )
    .orderBy(desc(groups.createdAt));

  return rows;
}

export async function getFollowedGroups(userId: number) {
  const db = await getDb();
  if (!db) return [];

  // Influencer groups where user is a follower (not creator)
  const rows = await db
    .select({
      id: groups.id,
      name: groups.name,
      description: groups.description,
      type: groups.type,
      creatorId: groups.creatorId,
      image: groups.image,
      memberCount: groups.memberCount,
      createdAt: groups.createdAt,
      creatorName: users.name,
      creatorUsername: users.username,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groupMembers.groupId, groups.id))
    .innerJoin(users, eq(groups.creatorId, users.id))
    .where(
      and(
        eq(groupMembers.userId, userId),
        eq(groups.type, "influencer"),
        sql`${groups.creatorId} != ${userId}`
      )
    )
    .orderBy(desc(groups.createdAt));

  return rows;
}

export async function getGroupById(groupId: number) {
  const db = await getDb();
  if (!db) return null;
  const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
  return group ?? null;
}

export async function getGroupMembers(groupId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: groupMembers.id,
      userId: groupMembers.userId,
      role: groupMembers.role,
      joinedAt: groupMembers.joinedAt,
      userName: users.name,
      username: users.username,
    })
    .from(groupMembers)
    .innerJoin(users, eq(groupMembers.userId, users.id))
    .where(eq(groupMembers.groupId, groupId))
    .orderBy(groupMembers.joinedAt);
}

export async function updateGroup(groupId: number, data: { name?: string; description?: string; image?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, any> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.image !== undefined) updateData.image = data.image;
  if (Object.keys(updateData).length === 0) return;
  await db.update(groups).set(updateData).where(eq(groups.id, groupId));
}

export async function deleteGroup(groupId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(groupSharedRatings).where(eq(groupSharedRatings.groupId, groupId));
  await db.delete(groupInvites).where(eq(groupInvites.groupId, groupId));
  await db.delete(groupMembers).where(eq(groupMembers.groupId, groupId));
  await db.delete(groups).where(eq(groups.id, groupId));
}

// ─── Invites ─────────────────────────────────────────────────────────────────

export async function inviteToGroup(groupId: number, inviterId: number, inviteeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if already a member
  const [existing] = await db
    .select()
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, inviteeId)))
    .limit(1);
  if (existing) throw new Error("ALREADY_MEMBER: Usuário já é membro deste grupo");

  // Check if already invited (pending)
  const [pendingInvite] = await db
    .select()
    .from(groupInvites)
    .where(
      and(
        eq(groupInvites.groupId, groupId),
        eq(groupInvites.inviteeId, inviteeId),
        eq(groupInvites.status, "pending")
      )
    )
    .limit(1);
  if (pendingInvite) throw new Error("ALREADY_INVITED: Convite já enviado para este usuário");

  const [result] = await db.insert(groupInvites).values({
    groupId,
    inviterId,
    inviteeId,
    status: "pending",
  });

  return { id: Number(result.insertId) };
}

export async function getPendingInvites(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: groupInvites.id,
      groupId: groupInvites.groupId,
      inviterId: groupInvites.inviterId,
      status: groupInvites.status,
      createdAt: groupInvites.createdAt,
      groupName: groups.name,
      groupType: groups.type,
      inviterName: users.name,
      inviterUsername: users.username,
    })
    .from(groupInvites)
    .innerJoin(groups, eq(groupInvites.groupId, groups.id))
    .innerJoin(users, eq(groupInvites.inviterId, users.id))
    .where(
      and(
        eq(groupInvites.inviteeId, userId),
        eq(groupInvites.status, "pending")
      )
    )
    .orderBy(desc(groupInvites.createdAt));
}

export async function respondToInvite(inviteId: number, userId: number, accept: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [invite] = await db
    .select()
    .from(groupInvites)
    .where(and(eq(groupInvites.id, inviteId), eq(groupInvites.inviteeId, userId)))
    .limit(1);

  if (!invite) throw new Error("NOT_FOUND: Convite não encontrado");
  if (invite.status !== "pending") throw new Error("ALREADY_RESPONDED: Convite já respondido");

  await db
    .update(groupInvites)
    .set({ status: accept ? "accepted" : "rejected" })
    .where(eq(groupInvites.id, inviteId));

  if (accept) {
    // Add as member
    await db.insert(groupMembers).values({
      groupId: invite.groupId,
      userId,
      role: "member",
    });
    // Update member count
    await db
      .update(groups)
      .set({ memberCount: sql`${groups.memberCount} + 1` })
      .where(eq(groups.id, invite.groupId));
  }

  return { accepted: accept };
}

// ─── Follow/Unfollow (Influencer Groups) ─────────────────────────────────────

export async function followGroup(groupId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if already following
  const [existing] = await db
    .select()
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
    .limit(1);
  if (existing) throw new Error("ALREADY_FOLLOWING: Você já segue este grupo");

  await db.insert(groupMembers).values({
    groupId,
    userId,
    role: "follower",
  });

  await db
    .update(groups)
    .set({ memberCount: sql`${groups.memberCount} + 1` })
    .where(eq(groups.id, groupId));
}

export async function unfollowGroup(groupId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));

  await db
    .update(groups)
    .set({ memberCount: sql`GREATEST(${groups.memberCount} - 1, 0)` })
    .where(eq(groups.id, groupId));
}

// ─── Shared Ratings ──────────────────────────────────────────────────────────

export async function shareRatingToGroup(groupId: number, ratingId: number, sharedById: number, note?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Validate rating exists and belongs to the user
  const [rating] = await db.select().from(ratings).where(eq(ratings.id, ratingId)).limit(1);
  if (!rating) throw new Error("NOT_FOUND: Avaliação não encontrada");
  if (rating.userId !== sharedById) throw new Error("FORBIDDEN: Você só pode compartilhar suas próprias avaliações");

  // For influencer groups, only the creator can share
  const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
  if (group && group.type === "influencer" && group.creatorId !== sharedById) {
    throw new Error("FORBIDDEN: Apenas o criador pode publicar neste grupo de influencer");
  }

  const [result] = await db.insert(groupSharedRatings).values({
    groupId,
    ratingId,
    sharedById,
    note: note ?? null,
  });

  return { id: Number(result.insertId) };
}

export async function getGroupFeed(groupId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({
      id: groupSharedRatings.id,
      ratingId: groupSharedRatings.ratingId,
      sharedById: groupSharedRatings.sharedById,
      note: groupSharedRatings.note,
      createdAt: groupSharedRatings.createdAt,
      sharerName: users.name,
      sharerUsername: users.username,
      overallScore: ratings.overallScore,
      ratingType: ratings.type,
      establishmentId: ratings.establishmentId,
      establishmentName: establishments.name,
      establishmentSlug: establishments.slug,
      establishmentImage: establishments.image,
    })
    .from(groupSharedRatings)
    .innerJoin(users, eq(groupSharedRatings.sharedById, users.id))
    .innerJoin(ratings, eq(groupSharedRatings.ratingId, ratings.id))
    .innerJoin(establishments, eq(ratings.establishmentId, establishments.id))
    .where(eq(groupSharedRatings.groupId, groupId))
    .orderBy(desc(groupSharedRatings.createdAt))
    .limit(limit)
    .offset(offset);

  return rows;
}

// ─── Search Users by Username ────────────────────────────────────────────────

export async function searchUsersByUsername(query: string, excludeUserId?: number) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [like(users.username, `%${query}%`)];
  if (excludeUserId) {
    conditions.push(sql`${users.id} != ${excludeUserId}`);
  }

  return db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
    })
    .from(users)
    .where(and(...conditions))
    .limit(10);
}

// ─── Discover Influencer Groups ──────────────────────────────────────────────

export async function discoverInfluencerGroups(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];

  // Get influencer groups that the user is NOT already following
  const rows = await db
    .select({
      id: groups.id,
      name: groups.name,
      description: groups.description,
      image: groups.image,
      memberCount: groups.memberCount,
      createdAt: groups.createdAt,
      creatorName: users.name,
      creatorUsername: users.username,
    })
    .from(groups)
    .innerJoin(users, eq(groups.creatorId, users.id))
    .where(
      and(
        eq(groups.type, "influencer"),
        sql`${groups.id} NOT IN (SELECT group_id FROM group_members WHERE user_id = ${userId})`
      )
    )
    .orderBy(desc(groups.memberCount))
    .limit(limit);

  return rows;
}

// ─── Check Membership ────────────────────────────────────────────────────────

export async function isGroupMember(groupId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const [row] = await db
    .select()
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
    .limit(1);
  return !!row;
}

export async function removeMemberFromGroup(groupId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
  await db
    .update(groups)
    .set({ memberCount: sql`GREATEST(${groups.memberCount} - 1, 0)` })
    .where(eq(groups.id, groupId));
}
