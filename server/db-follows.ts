import { getDb } from "./db";
import { userFollows, directMessages, users } from "../drizzle/schema";
import { eq, and, or, desc, sql } from "drizzle-orm";

// ============ FOLLOW SYSTEM ============

export async function followUser(followerId: number, followingId: number) {
  const db = (await getDb())!;
  // Prevent self-follow
  if (followerId === followingId) throw new Error("Não é possível seguir a si mesmo");
  // Upsert (ignore duplicate)
  await db.insert(userFollows).values({ followerId, followingId }).onDuplicateKeyUpdate({ set: { followerId: sql`followerId` } });
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
    and(eq(userFollows.followerId, followerId), eq(userFollows.followingId, followingId))
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
    .where(eq(userFollows.followingId, userId))
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
    .where(eq(userFollows.followerId, userId))
    .orderBy(desc(userFollows.createdAt));
  return rows;
}

export async function getFollowCounts(userId: number) {
  const db = (await getDb())!;
  const [followersCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(userFollows)
    .where(eq(userFollows.followingId, userId));
  const [followingCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(userFollows)
    .where(eq(userFollows.followerId, userId));
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
    WHERE f1.followerId = ${userId}
    ORDER BY u.name ASC
  `);
  return (rows as any)[0] as any[];
}

// ============ DIRECT MESSAGES ============

export async function sendDirectMessage(senderId: number, recipientId: number, content: string) {
  const db = (await getDb())!;
  const [result] = await db.insert(directMessages).values({ senderId, recipientId, content }).$returningId();
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
