import { eq, and, or, desc, sql, like, isNull } from "drizzle-orm";
import { getDb, generateCode } from "./db";
import {
  groups, groupMembers, groupInvites, groupSharedRatings, userPlans,
  users, ratings, ratingItems, establishments, userFollows,
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

/** Check if plan is a paid/pro tier (supports both legacy 'premium' and new 'pro' values) */
function isPaidPlan(plan: string): boolean {
  return plan === "pro" || plan === "premium" || plan === "embaixador";
}

/**
 * Group creation limits per role+plan:
 * User Free: 10 | User Pro: 70 | Specialist: 150 | Critic: 150 | Business: 5 | Business Pro: 20
 */
function getGroupCreationLimit(role: string, plan: string): number {
  switch (role) {
    case "specialist": return 150;
    case "critic": return 150;
    case "business": return isPaidPlan(plan) ? 20 : 5;
    default: return isPaidPlan(plan) ? 70 : 10; // user
  }
}

/**
 * Member limits per group (based on creator's role+plan):
 * User Free: 75 | User Pro: 150 | Specialist: 250 | Critic: 250 | Business: 25 | Business Pro: 80
 */
function getMemberLimit(role: string, plan: string): number {
  switch (role) {
    case "specialist": return 250;
    case "critic": return 250;
    case "business": return isPaidPlan(plan) ? 80 : 25;
    default: return isPaidPlan(plan) ? 150 : 75; // user
  }
}

export async function createGroup(data: {
  name: string;
  description?: string;
  type: "private" | "specialist";
  creatorId: number;
  image?: string;
  /** When owner/admin views as another role, pass it here to apply that role's limits */
  effectiveRole?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get creator role and plan
  const [creator] = await db.select({ role: users.role }).from(users).where(eq(users.id, data.creatorId)).limit(1);
  const creatorRole = data.effectiveRole || creator?.role || "user";
  const plan = await getUserPlanOrDefault(data.creatorId);

  // Only specialist/critic can create specialist-type groups
  if (data.type === "specialist" && creatorRole !== "specialist" && creatorRole !== "critic") {
    throw new Error("PLAN_REQUIRED: Apenas especialistas e críticos podem criar grupos de specialist");
  }

  // Check group creation limit based on role + plan
  const limit = getGroupCreationLimit(creatorRole, plan);
  const groupCount = await countUserGroups(data.creatorId, data.effectiveRole);
  if (groupCount >= limit) {
    throw new Error(`PLAN_LIMIT: Limite de ${limit} grupos atingido para seu plano`);
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
    createdAsRole: data.effectiveRole || creatorRole || "user",
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

export async function countUserGroups(userId: number, effectiveRole?: string | null): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const conditions = [eq(groups.creatorId, userId)];
  // When owner views as a role, count only groups created under that role
  if (effectiveRole) {
    conditions.push(eq(groups.createdAsRole, effectiveRole));
  }

  const [result] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(groups)
    .where(and(...conditions));
  return result?.count ?? 0;
}

export async function getMyGroups(userId: number, effectiveRole?: string | null) {
  const db = await getDb();
  if (!db) return [];

  // Get user's actual role
  const [userRow] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  const userRole = userRow?.role || "user";

  // Build conditions: only groups where user is the CREATOR
  const conditions: any[] = [
    eq(groupMembers.userId, userId),
    isNull(groupMembers.leftAt),
    eq(groups.creatorId, userId),
    or(
      eq(groups.type, "private"),
      eq(groups.type, "specialist"),
      eq(groups.type, "broadcast")
    ),
  ];

  // When owner is viewing as a specific role, filter by createdAsRole
  // BUT specialist/critic always keep their "user" groups too (they don't lose them on role change)
  if (effectiveRole) {
    if (effectiveRole === "specialist" || effectiveRole === "critic") {
      // Show groups created as this role OR as user (specialist/critic keeps user groups)
      conditions.push(
        or(
          eq(groups.createdAsRole, effectiveRole),
          eq(groups.createdAsRole, "user")
        )
      );
    } else {
      conditions.push(eq(groups.createdAsRole, effectiveRole));
    }
  }

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
      updatedAt: groups.updatedAt,
      createdAsRole: groups.createdAsRole,
      role: groupMembers.role,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groupMembers.groupId, groups.id))
    .where(and(...conditions))
    .orderBy(desc(groups.updatedAt));
  // Sort all groups by updatedAt descending (most recent activity first)
  rows.sort((a: any, b: any) => {
    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : new Date(a.createdAt).getTime();
    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : new Date(b.createdAt).getTime();
    return bTime - aTime;
  });
  return rows;
}

export async function getFollowedGroups(userId: number) {
  const db = await getDb();
  if (!db) return [];

  // "Seguindo" tab: private/specialist groups where user is a member but NOT the creator
  // This includes groups the user was invited to
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
        isNull(groupMembers.leftAt),
        or(
          eq(groups.type, "private"),
          eq(groups.type, "specialist")
        ),
        sql`${groups.creatorId} != ${userId}`
      )
    )
    .orderBy(desc(groups.updatedAt));

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

export async function inviteToGroup(groupId: number, inviterId: number, inviteeId: number, effectiveRole?: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check member limit per role+plan:
  // User Free: 75 | User Pro: 150 | Specialist: 250 | Critic: 250 | Business: 25 | Business Pro: 80
  const [group] = await db.select({ creatorId: groups.creatorId, memberCount: groups.memberCount, type: groups.type }).from(groups).where(eq(groups.id, groupId)).limit(1);
  if (group && group.type === "private") {
    const [creator] = await db.select({ role: users.role }).from(users).where(eq(users.id, group.creatorId)).limit(1);
    const creatorRole = effectiveRole || creator?.role || "user";
    const creatorPlan = await getUserPlanOrDefault(group.creatorId);
    const memberLimit = getMemberLimit(creatorRole, creatorPlan);
    if ((group.memberCount || 0) >= memberLimit) {
      throw new Error(`MEMBER_LIMIT: Limite de ${memberLimit} membros atingido para este grupo`);
    }
  }

  // ─── Invite restrictions based on roles ───
  const [inviter] = await db.select({ role: users.role }).from(users).where(eq(users.id, inviterId)).limit(1);
  const [invitee] = await db.select({ role: users.role }).from(users).where(eq(users.id, inviteeId)).limit(1);
  const inviterRole = inviter?.role || "user";
  const inviteeRole = invitee?.role || "user";

  // Business can only invite/be invited by other business
  if (inviterRole === "business" && inviteeRole !== "business") {
    throw new Error("INVITE_RESTRICTED: Contas business só podem convidar outras contas business");
  }
  if (inviteeRole === "business" && inviterRole !== "business") {
    throw new Error("INVITE_RESTRICTED: Contas business só podem receber convites de outras contas business");
  }

  // User (free/pro) can only invite someone with mutual follow (both follow each other)
  if (inviterRole === "user") {
    // Check inviter follows invitee
    const [inviterFollowsInvitee] = await db
      .select({ id: userFollows.id })
      .from(userFollows)
      .where(and(eq(userFollows.followerId, inviterId), eq(userFollows.followingId, inviteeId), eq(userFollows.status, "accepted")))
      .limit(1);
    // Check invitee follows inviter
    const [inviteeFollowsInviter] = await db
      .select({ id: userFollows.id })
      .from(userFollows)
      .where(and(eq(userFollows.followerId, inviteeId), eq(userFollows.followingId, inviterId), eq(userFollows.status, "accepted")))
      .limit(1);
    if (!inviterFollowsInvitee || !inviteeFollowsInviter) {
      throw new Error("INVITE_RESTRICTED: Você só pode convidar amigos mútuos (seguir e ser seguido)");
    }
  }
  // Specialist/Critic: no invite restrictions

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

  if (accept) {
    // Check member limit based on creator's role+plan
    const [group] = await db.select({ creatorId: groups.creatorId, memberCount: groups.memberCount, type: groups.type }).from(groups).where(eq(groups.id, invite.groupId)).limit(1);
    if (group && group.type === "private") {
      const [creator] = await db.select({ role: users.role }).from(users).where(eq(users.id, group.creatorId)).limit(1);
      const creatorRole = creator?.role || "user";
      const creatorPlan = await getUserPlanOrDefault(group.creatorId);
      const memberLimit = getMemberLimit(creatorRole, creatorPlan);
      if ((group.memberCount || 0) >= memberLimit) {
        throw new Error(`MEMBER_LIMIT: Limite de ${memberLimit} membros atingido para este grupo`);
      }
    }
  }

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

// ─── Follow/Unfollow (Specialist Groups) ─────────────────────────────────────

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

  // For specialist groups, only the creator can share
  const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
  if (group && group.type === "specialist" && group.creatorId !== sharedById) {
    throw new Error("FORBIDDEN: Apenas o criador pode publicar neste grupo de specialist");
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
      role: users.role,
    })
    .from(users)
    .where(and(...conditions))
    .limit(10);
}

// Search people by name or username, filtered by role (user/critic/specialist)
export async function searchPeople(query: string, roleFilter?: string, excludeUserId?: number) {
  const db = await getDb();
  if (!db) return [];
  const lowerQuery = query.toLowerCase();
  const searchTerm = `%${lowerQuery}%`;
  const conditions: any[] = [
    or(
      sql`LOWER(${users.username}) LIKE ${searchTerm}`,
      sql`LOWER(${users.name}) LIKE ${searchTerm}`
    ),
  ];
  if (excludeUserId) {
    conditions.push(sql`${users.id} != ${excludeUserId}`);
  }
  if (roleFilter && roleFilter !== "all") {
    if (roleFilter === "professional") {
      // "professional" = critic + specialist
      conditions.push(sql`${users.role} IN ('critic', 'specialist')`);
    } else {
      conditions.push(sql`${users.role} = ${roleFilter}`);
    }
  } else {
    // Only show user, critic, specialist (not admin, support, owner, business)
    conditions.push(sql`${users.role} IN ('user', 'critic', 'specialist')`);
  }
  return db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      role: users.role,
    })
    .from(users)
    .where(and(...conditions))
    .limit(15);
}

// ─── Discover Specialist Groups ──────────────────────────────────────────────

export async function discoverSpecialistGroups(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];

  // Get specialist groups that the user is NOT already following
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
        eq(groups.type, "specialist"),
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

// ─── Search Groups (by name or creator username) ────────────────────────────

export async function searchGroups(query: string, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  const lowerQuery = query.toLowerCase();
  const searchTerm = `%${lowerQuery}%`;
  
  // Search groups by name OR by creator username (case-insensitive)
  const rows = await db
    .select({
      id: groups.id,
      name: groups.name,
      description: groups.description,
      type: groups.type,
      memberCount: groups.memberCount,
      creatorName: users.name,
      creatorUsername: users.username,
    })
    .from(groups)
    .innerJoin(users, eq(groups.creatorId, users.id))
    .where(
      or(
        sql`LOWER(${groups.name}) LIKE ${searchTerm}`,
        sql`LOWER(${users.username}) LIKE ${searchTerm}`
      )
    )
    .orderBy(desc(groups.memberCount))
    .limit(limit);

  return rows;
}
