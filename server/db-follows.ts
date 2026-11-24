import { getDb } from "./db";
import { userFollows, userBlocks, directMessages, users } from "../drizzle/schema";
import { eq, and, or, desc, sql, isNotNull, isNull, ne } from "drizzle-orm";

// ============ FOLLOW SYSTEM ============

/**
 * A tabela legada user_follows em produção não possui AUTO_INCREMENT no id
 * nem uma chave única para followerId/followingId. Faça o upsert explicitamente
 * para manter o código compatível com essa estrutura do TiDB.
 */
async function upsertFollow(db: any, followerId: number, followingId: number, status: "accepted" | "pending") {
  const [existing] = await db
    .select({ id: userFollows.id })
    .from(userFollows)
    .where(and(eq(userFollows.followerId, followerId), eq(userFollows.followingId, followingId)))
    .limit(1);

  if (existing) {
    await db.update(userFollows)
      .set({ status, decision: null })
      .where(eq(userFollows.id, existing.id));
    return;
  }

  const [nextIdRow] = await db
    .select({ nextId: sql<number>`COALESCE(MAX(${userFollows.id}), 0) + 1` })
    .from(userFollows);
  const nextId = Number(nextIdRow?.nextId ?? 1);

  await db.insert(userFollows).values({
    id: nextId,
    followerId,
    followingId,
    status,
  });
}

/**
 * Follow a user. If target is 'user' role → pending. If 'critic'/'specialist' → accepted instantly.
 */
export async function followUser(followerId: number, followingId: number): Promise<"accepted" | "pending"> {
  const db = (await getDb())!;
  if (followerId === followingId) throw new Error("Não é possível seguir a si mesmo");
  if (await isBlocked(followerId, followingId)) throw new Error("Não é possível seguir este usuário.");

  // Check target user's role
  const [targetUser] = await db.select({ role: users.role }).from(users).where(eq(users.id, followingId)).limit(1);
  if (!targetUser) throw new Error("Usuário não encontrado");

  // Critics and specialists: instant follow. Regular users: pending approval.
  const status = (targetUser.role === "critic" || targetUser.role === "specialist") ? "accepted" : "pending";

  await upsertFollow(db, followerId, followingId, status);

  return status;
}

/**
 * Accept a pending follow request
 */
export async function acceptFollowRequest(followId: number, userId: number) {
  const db = (await getDb())!;
  await db.update(userFollows)
    .set({ status: "accepted", decision: "accepted" })
    .where(and(eq(userFollows.id, followId), eq(userFollows.followingId, userId), eq(userFollows.status, "pending")));
}

/**
 * Accept a follow request AND follow the requester back (mutual follow)
 */
export async function acceptAndFollowBack(followId: number, userId: number) {
  const db = (await getDb())!;
  const [request] = await db.select({ followerId: userFollows.followerId })
    .from(userFollows)
    .where(and(
      eq(userFollows.id, followId),
      eq(userFollows.followingId, userId),
      eq(userFollows.status, "pending")
    ))
    .limit(1);
  if (!request) throw new Error("Solicitação não encontrada ou já decidida");

  // Accept the incoming request
  await db.update(userFollows)
    .set({ status: "accepted", decision: "accepted_follow_back" })
    .where(and(eq(userFollows.id, followId), eq(userFollows.followingId, userId), eq(userFollows.status, "pending")));

  // Follow back: get the follower's ID and create reverse follow
  if (request.followerId !== userId) {
    await upsertFollow(db, userId, request.followerId, "accepted");
  }
}

/**
 * Reject a pending follow request while keeping its history visible.
 * Legacy accepted rows without a decision are removed when rejected so they
 * cannot remain as active followers after the user denied the request.
 */
export async function rejectFollowRequest(followId: number, userId: number) {
  const db = (await getDb())!;
  const [request] = await db
    .select({ status: userFollows.status, decision: userFollows.decision })
    .from(userFollows)
    .where(and(eq(userFollows.id, followId), eq(userFollows.followingId, userId)))
    .limit(1);

  if (!request) return;

  if (request.status === "pending") {
    await db.update(userFollows).set({
      status: "accepted",
      decision: "rejected",
    }).where(and(eq(userFollows.id, followId), eq(userFollows.followingId, userId), eq(userFollows.status, "pending")));
  } else if (request.status === "accepted" && request.decision == null) {
    await db.delete(userFollows).where(
      and(eq(userFollows.id, followId), eq(userFollows.followingId, userId))
    );
  }
}

/**
 * Get pending and previously decided follow requests for a user.
 * Direct follows that were never requests have a null decision and are excluded.
 */
export async function getPendingFollowRequests(userId: number) {
  const db = (await getDb())!;
  const rows = await db
    .select({
      id: userFollows.id,
      followerId: userFollows.followerId,
      followerName: users.name,
      followerUsername: users.username,
      followerPhoto: users.profilePhotoUrl,
      status: userFollows.status,
      decision: userFollows.decision,
      createdAt: userFollows.createdAt,
    })
    .from(userFollows)
    .innerJoin(users, eq(users.id, userFollows.followerId))
    .where(and(
      eq(userFollows.followingId, userId),
      or(eq(userFollows.status, "pending"), isNotNull(userFollows.decision))
    ))
    .orderBy(desc(userFollows.createdAt));
  return rows;
}

/**
 * Count pending follow requests
 */
export async function getPendingFollowCount(userId: number): Promise<number> {
  const db = (await getDb())!;
  const [result] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(userFollows)
    .where(and(eq(userFollows.followingId, userId), eq(userFollows.status, "pending")));
  return result?.count || 0;
}

/**
 * Get follow status: 'none' | 'pending' | 'accepted'
 */
export async function getFollowDetails(followerId: number, followingId: number) {
  const db = (await getDb())!;
  const [row] = await db.select({ status: userFollows.status, createdAt: userFollows.createdAt })
    .from(userFollows).where(and(
      eq(userFollows.followerId, followerId),
      eq(userFollows.followingId, followingId),
      or(isNull(userFollows.decision), ne(userFollows.decision, "rejected"))
    )).limit(1);
  return row ?? { status: "none" as const, createdAt: null };
}
export async function getFollowStatus(followerId: number, followingId: number): Promise<"none" | "pending" | "accepted"> {
  const db = (await getDb())!;
  const [row] = await db.select({ status: userFollows.status }).from(userFollows).where(
    and(
      eq(userFollows.followerId, followerId),
      eq(userFollows.followingId, followingId),
      or(isNull(userFollows.decision), ne(userFollows.decision, "rejected"))
    )
  ).limit(1);
  if (!row) return "none";
  return row.status;
}

export async function unfollowUser(followerId: number, followingId: number) {
  const db = (await getDb())!;
  await db.delete(userFollows).where(
    and(eq(userFollows.followerId, followerId), eq(userFollows.followingId, followingId))
  );
}

export async function isFollowing(followerId: number, followingId: number): Promise<boolean> {
  const db = (await getDb())!;
  const [row] = await db.select({ id: userFollows.id }).from(userFollows).where(
    and(
      eq(userFollows.followerId, followerId),
      eq(userFollows.followingId, followingId),
      eq(userFollows.status, "accepted"),
      or(isNull(userFollows.decision), ne(userFollows.decision, "rejected"))
    )
  ).limit(1);
  return !!row;
}

export async function isMutualFollow(userA: number, userB: number): Promise<boolean> {
  const aFollowsB = await isFollowing(userA, userB);
  const bFollowsA = await isFollowing(userB, userA);
  return aFollowsB && bFollowsA;
}

export async function getFollowers(userId: number) {
  const db = (await getDb())!;
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      role: users.role,
      followedAt: userFollows.createdAt,
    })
    .from(userFollows)
    .innerJoin(users, eq(users.id, userFollows.followerId))
    .where(and(
      eq(userFollows.followingId, userId),
      eq(userFollows.status, "accepted"),
      or(isNull(userFollows.decision), ne(userFollows.decision, "rejected"))
    ))
    .orderBy(desc(userFollows.createdAt));
  return rows;
}

export async function getFollowing(userId: number) {
  const db = (await getDb())!;
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      role: users.role,
      followedAt: userFollows.createdAt,
    })
    .from(userFollows)
    .innerJoin(users, eq(users.id, userFollows.followingId))
    .where(and(
      eq(userFollows.followerId, userId),
      eq(userFollows.status, "accepted"),
      or(isNull(userFollows.decision), ne(userFollows.decision, "rejected"))
    ))
    .orderBy(desc(userFollows.createdAt));
  return rows;
}

export async function getFollowCounts(userId: number) {
  const db = (await getDb())!;
  const [followersCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(userFollows)
    .where(and(eq(userFollows.followingId, userId), eq(userFollows.status, "accepted")));
  const [followingCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(userFollows)
    .where(and(eq(userFollows.followerId, userId), eq(userFollows.status, "accepted")));
  return {
    followers: followersCount?.count || 0,
    following: followingCount?.count || 0,
  };
}

export async function getMutualFollows(userId: number) {
  const db = (await getDb())!;
  // Users that userId follows AND that follow userId back
  const rows = await db.execute(sql`
    SELECT u.id, u.name, u.username, u.role
    FROM user_follows f1
    INNER JOIN user_follows f2 ON f1.followingId = f2.followerId AND f1.followerId = f2.followingId
    INNER JOIN users u ON u.id = f1.followingId
    WHERE f1.followerId = ${userId} AND f1.status = 'accepted' AND f2.status = 'accepted'
    ORDER BY u.name ASC
  `);
  return (rows as any)[0] as any[];
}

// ============ BLOCKS ============
export async function blockUser(blockerId: number, blockedId: number) {
  const db = (await getDb())!;
  if (blockerId === blockedId) throw new Error("Não é possível bloquear a si mesmo");
  const [existing] = await db.select({ id: userBlocks.id }).from(userBlocks)
    .where(and(eq(userBlocks.blockerId, blockerId), eq(userBlocks.blockedId, blockedId))).limit(1);
  if (!existing) await db.insert(userBlocks).values({ blockerId, blockedId });
  await db.delete(userFollows).where(or(
    and(eq(userFollows.followerId, blockerId), eq(userFollows.followingId, blockedId)),
    and(eq(userFollows.followerId, blockedId), eq(userFollows.followingId, blockerId)),
  ));
  return { success: true };
}
export async function unblockUser(blockerId: number, blockedId: number) {
  const db = (await getDb())!;
  await db.delete(userBlocks).where(and(eq(userBlocks.blockerId, blockerId), eq(userBlocks.blockedId, blockedId)));
  return { success: true };
}
export async function isBlocked(userId: number, otherUserId: number) {
  const db = (await getDb())!;
  const [row] = await db.select({ id: userBlocks.id }).from(userBlocks).where(or(
    and(eq(userBlocks.blockerId, userId), eq(userBlocks.blockedId, otherUserId)),
    and(eq(userBlocks.blockerId, otherUserId), eq(userBlocks.blockedId, userId)),
  )).limit(1);
  return !!row;
}
// ============ DIRECT MESSAGES ============

type DirectMessageMediaInput = {
  type?: "text" | "audio" | "image" | "video";
  mediaUrl?: string;
  mediaStorageKey?: string;
  mediaMimeType?: string;
  mediaDurationSeconds?: number;
  mediaSizeBytes?: number;
  mediaThumbnailUrl?: string;
};

export async function sendDirectMessage(senderId: number, recipientId: number, content: string, media?: DirectMessageMediaInput) {
  const db = (await getDb())!;
  const [result] = await db.insert(directMessages).values({
    senderId,
    recipientId,
    content,
    type: media?.type || "text",
    mediaUrl: media?.mediaUrl || null,
    mediaStorageKey: media?.mediaStorageKey || null,
    mediaMimeType: media?.mediaMimeType || null,
    mediaDurationSeconds: media?.mediaDurationSeconds || null,
    mediaSizeBytes: media?.mediaSizeBytes || null,
    mediaThumbnailUrl: media?.mediaThumbnailUrl || null,
  }).$returningId();
  return result.id;
}

export async function getDirectMessages(userA: number, userB: number, limit = 50, offset = 0) {
  const db = (await getDb())!;
  const rows = await db
    .select({
      id: directMessages.id,
      senderId: directMessages.senderId,
      recipientId: directMessages.recipientId,
      content: directMessages.content,
      type: directMessages.type,
      mediaUrl: directMessages.mediaUrl,
      mediaStorageKey: directMessages.mediaStorageKey,
      mediaMimeType: directMessages.mediaMimeType,
      mediaDurationSeconds: directMessages.mediaDurationSeconds,
      mediaSizeBytes: directMessages.mediaSizeBytes,
      mediaThumbnailUrl: directMessages.mediaThumbnailUrl,
      isRead: directMessages.isRead,
      createdAt: directMessages.createdAt,
    })
    .from(directMessages)
    .where(
      or(
        and(eq(directMessages.senderId, userA), eq(directMessages.recipientId, userB)),
        and(eq(directMessages.senderId, userB), eq(directMessages.recipientId, userA))
      )
    )
    .orderBy(desc(directMessages.createdAt))
    .limit(limit)
    .offset(offset);
  return rows.reverse(); // oldest first
}

export async function markDMsAsRead(recipientId: number, senderId: number) {
  const db = (await getDb())!;
  await db.update(directMessages)
    .set({ isRead: true })
    .where(
      and(eq(directMessages.senderId, senderId), eq(directMessages.recipientId, recipientId), eq(directMessages.isRead, false))
    );
}

export async function getDMConversations(userId: number) {
  const db = (await getDb())!;
  // Get distinct conversation partners with last message
  const rows = await db.execute(sql`
    SELECT 
      partner.id as partnerId,
      partner.name as partnerName,
      partner.username as partnerUsername,
      partner.role as partnerRole,
      dm.content as lastMessage,
      dm.createdAt as lastMessageAt,
      (SELECT COUNT(*) FROM direct_messages WHERE senderId = partner.id AND recipientId = ${userId} AND isRead = 0) as unreadCount
    FROM (
      SELECT DISTINCT 
        CASE WHEN senderId = ${userId} THEN recipientId ELSE senderId END as partnerId
      FROM direct_messages
      WHERE senderId = ${userId} OR recipientId = ${userId}
    ) conversations
    INNER JOIN users partner ON partner.id = conversations.partnerId
    INNER JOIN direct_messages dm ON dm.id = (
      SELECT id FROM direct_messages 
      WHERE (senderId = ${userId} AND recipientId = partner.id) 
         OR (senderId = partner.id AND recipientId = ${userId})
      ORDER BY createdAt DESC LIMIT 1
    )
    ORDER BY dm.createdAt DESC
  `);
  return (rows as any)[0] as any[];
}


/**
 * Search mutual follows by name or username (for group invite restricted to followers)
 */
export async function searchMutualFollows(userId: number, query: string) {
  const db = (await getDb())!;
  const hasQuery = query.trim().length > 0;
  const searchTerm = `%${query}%`;
  const rows = await db.execute(sql`
    SELECT u.id, u.name, u.username, u.profilePhotoUrl
    FROM user_follows f1
    INNER JOIN user_follows f2 ON f1.followingId = f2.followerId AND f1.followerId = f2.followingId
    INNER JOIN users u ON u.id = f1.followingId
    WHERE f1.followerId = ${userId}
      AND f1.status = 'accepted'
      AND f2.status = 'accepted'
      AND (${!hasQuery} OR u.name LIKE ${searchTerm} OR u.username LIKE ${searchTerm})
    ORDER BY u.name ASC
    LIMIT 20
  `);
  return (rows as any)[0] as Array<{ id: number; name: string | null; username: string | null; profilePhotoUrl: string | null }>;
}
