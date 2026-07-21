import { getDb } from "./db";
import { groupMessages, supportMessages, businessBroadcasts, businessFollowers, users, establishments, groups } from "../drizzle/schema";
import { eq, and, or, desc, sql } from "drizzle-orm";

// ==================== GROUP MESSAGES ====================

export async function sendGroupMessage(groupId: number, senderId: number, content: string, type: "text" | "share_rating" | "share_establishment" | "share_profile" = "text", referenceId?: number, referenceSlug?: string) {
  const db = (await getDb())!;
  const [result] = await db.insert(groupMessages).values({
    groupId,
    senderId,
    content: content.slice(0, 140),
    type,
    referenceId: referenceId || null,
    referenceSlug: referenceSlug || null,
  });
  // Update group's updatedAt to sort by last activity
  await db.update(groups).set({ updatedAt: new Date() }).where(eq(groups.id, groupId));
  return result.insertId;
}

export async function getGroupMessages(groupId: number, limit = 50, offset = 0) {
  const db = (await getDb())!;
  const messages = await db
    .select({
      id: groupMessages.id,
      groupId: groupMessages.groupId,
      senderId: groupMessages.senderId,
      senderName: users.name,
      senderUsername: users.username,
      senderRole: users.role,
      content: groupMessages.content,
      type: groupMessages.type,
      referenceId: groupMessages.referenceId,
      referenceSlug: groupMessages.referenceSlug,
      createdAt: groupMessages.createdAt,
    })
    .from(groupMessages)
    .innerJoin(users, eq(groupMessages.senderId, users.id))
    .where(eq(groupMessages.groupId, groupId))
    .orderBy(desc(groupMessages.createdAt))
    .limit(limit)
    .offset(offset);
  return messages;
}

export async function getGroupMessageCount(groupId: number) {
  const db = (await getDb())!;
  const [result] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(groupMessages)
    .where(eq(groupMessages.groupId, groupId));
  return result?.count || 0;
}

// ==================== SUPPORT MESSAGES ====================

export async function sendSupportMessage(senderId: number, recipientId: number, content: string) {
  const db = (await getDb())!;
  const [result] = await db.insert(supportMessages).values({
    senderId,
    recipientId,
    content,
  });
  return result.insertId;
}

export async function getSupportConversation(userId1: number, userId2: number, limit = 50, offset = 0) {
  const db = (await getDb())!;
  const messages = await db
    .select()
    .from(supportMessages)
    .where(
      or(
        and(eq(supportMessages.senderId, userId1), eq(supportMessages.recipientId, userId2)),
        and(eq(supportMessages.senderId, userId2), eq(supportMessages.recipientId, userId1))
      )
    )
    .orderBy(desc(supportMessages.createdAt))
    .limit(limit)
    .offset(offset);
  return messages;
}

export async function getSupportConversationList(supportUserId: number) {
  const db = (await getDb())!;
  const conversations = await db.execute(sql`
    SELECT DISTINCT 
      CASE 
        WHEN senderId = ${supportUserId} THEN recipientId 
        ELSE senderId 
      END as partnerId,
      (SELECT name FROM users WHERE id = CASE WHEN senderId = ${supportUserId} THEN recipientId ELSE senderId END) as partnerName,
      (SELECT username FROM users WHERE id = CASE WHEN senderId = ${supportUserId} THEN recipientId ELSE senderId END) as partnerUsername,
      (SELECT role FROM users WHERE id = CASE WHEN senderId = ${supportUserId} THEN recipientId ELSE senderId END) as partnerRole,
      (SELECT content FROM support_messages sm2 WHERE 
        (sm2.senderId = ${supportUserId} AND sm2.recipientId = CASE WHEN support_messages.senderId = ${supportUserId} THEN support_messages.recipientId ELSE support_messages.senderId END)
        OR (sm2.recipientId = ${supportUserId} AND sm2.senderId = CASE WHEN support_messages.senderId = ${supportUserId} THEN support_messages.recipientId ELSE support_messages.senderId END)
        ORDER BY sm2.createdAt DESC LIMIT 1
      ) as lastMessage,
      (SELECT createdAt FROM support_messages sm3 WHERE 
        (sm3.senderId = ${supportUserId} AND sm3.recipientId = CASE WHEN support_messages.senderId = ${supportUserId} THEN support_messages.recipientId ELSE support_messages.senderId END)
        OR (sm3.recipientId = ${supportUserId} AND sm3.senderId = CASE WHEN support_messages.senderId = ${supportUserId} THEN support_messages.recipientId ELSE support_messages.senderId END)
        ORDER BY sm3.createdAt DESC LIMIT 1
      ) as lastMessageAt,
      (SELECT COUNT(*) FROM support_messages sm4 WHERE 
        sm4.senderId != ${supportUserId} 
        AND sm4.recipientId = ${supportUserId}
        AND sm4.\`read\` = FALSE
        AND sm4.senderId = CASE WHEN support_messages.senderId = ${supportUserId} THEN support_messages.recipientId ELSE support_messages.senderId END
      ) as unreadCount
    FROM support_messages
    WHERE senderId = ${supportUserId} OR recipientId = ${supportUserId}
    ORDER BY lastMessageAt DESC
  `);
  return (conversations as any)[0] || [];
}

export async function markSupportMessagesAsRead(recipientId: number, senderId: number) {
  const db = (await getDb())!;
  await db
    .update(supportMessages)
    .set({ read: true })
    .where(
      and(
        eq(supportMessages.senderId, senderId),
        eq(supportMessages.recipientId, recipientId),
        eq(supportMessages.read, false)
      )
    );
}

export async function getUserSupportMessages(userId: number, limit = 50, offset = 0) {
  const db = (await getDb())!;
  const messages = await db
    .select({
      id: supportMessages.id,
      senderId: supportMessages.senderId,
      recipientId: supportMessages.recipientId,
      content: supportMessages.content,
      read: supportMessages.read,
      createdAt: supportMessages.createdAt,
    })
    .from(supportMessages)
    .where(
      or(
        eq(supportMessages.senderId, userId),
        eq(supportMessages.recipientId, userId)
      )
    )
    .orderBy(desc(supportMessages.createdAt))
    .limit(limit)
    .offset(offset);
  return messages;
}

// ==================== ESTABLISHMENT-SCOPED SUPPORT CHAT ====================

export async function sendEstabSupportMessage(senderId: number, recipientId: number, establishmentId: number, content: string) {
  const db = (await getDb())!;
  const [result] = await db.insert(supportMessages).values({
    senderId,
    recipientId,
    establishmentId,
    content,
  });
  return result.insertId;
}

export async function getEstabSupportMessages(establishmentId: number, limit = 50, offset = 0) {
  const db = (await getDb())!;
  const messages = await db
    .select({
      id: supportMessages.id,
      senderId: supportMessages.senderId,
      recipientId: supportMessages.recipientId,
      establishmentId: supportMessages.establishmentId,
      content: supportMessages.content,
      read: supportMessages.read,
      createdAt: supportMessages.createdAt,
    })
    .from(supportMessages)
    .where(eq(supportMessages.establishmentId, establishmentId))
    .orderBy(desc(supportMessages.createdAt))
    .limit(limit)
    .offset(offset);
  return messages;
}

export async function markEstabMessagesAsRead(recipientId: number, establishmentId: number) {
  const db = (await getDb())!;
  await db
    .update(supportMessages)
    .set({ read: true })
    .where(
      and(
        eq(supportMessages.recipientId, recipientId),
        eq(supportMessages.establishmentId, establishmentId),
        eq(supportMessages.read, false)
      )
    );
}

export async function getSupportEstabConversationList(supportUserId: number) {
  const db = (await getDb())!;
  const conversations = await db.execute(sql`
    SELECT DISTINCT 
      sm.establishmentId,
      (SELECT e.name FROM establishments e WHERE e.id = sm.establishmentId) as estabName,
      (SELECT e.slug FROM establishments e WHERE e.id = sm.establishmentId) as estabSlug,
      CASE 
        WHEN sm.senderId = ${supportUserId} THEN sm.recipientId 
        ELSE sm.senderId 
      END as partnerId,
      (SELECT u.name FROM users u WHERE u.id = CASE WHEN sm.senderId = ${supportUserId} THEN sm.recipientId ELSE sm.senderId END) as partnerName,
      (SELECT u.username FROM users u WHERE u.id = CASE WHEN sm.senderId = ${supportUserId} THEN sm.recipientId ELSE sm.senderId END) as partnerUsername,
      (SELECT u.role FROM users u WHERE u.id = CASE WHEN sm.senderId = ${supportUserId} THEN sm.recipientId ELSE sm.senderId END) as partnerRole,
      (SELECT sm2.content FROM support_messages sm2 WHERE sm2.establishmentId = sm.establishmentId ORDER BY sm2.createdAt DESC LIMIT 1) as lastMessage,
      (SELECT sm3.createdAt FROM support_messages sm3 WHERE sm3.establishmentId = sm.establishmentId ORDER BY sm3.createdAt DESC LIMIT 1) as lastMessageAt,
      (SELECT COUNT(*) FROM support_messages sm4 WHERE 
        sm4.establishmentId = sm.establishmentId
        AND sm4.senderId != ${supportUserId} 
        AND sm4.recipientId = ${supportUserId}
        AND sm4.\`read\` = FALSE
      ) as unreadCount
    FROM support_messages sm
    WHERE sm.establishmentId IS NOT NULL
      AND (sm.senderId = ${supportUserId} OR sm.recipientId = ${supportUserId})
    ORDER BY lastMessageAt DESC
  `);
  return (conversations as any)[0] || [];
}

// ==================== BUSINESS BROADCASTS ====================

export async function sendBusinessBroadcast(businessUserId: number, establishmentId: number, content: string) {
  const db = (await getDb())!;
  const [result] = await db.insert(businessBroadcasts).values({
    businessUserId,
    establishmentId,
    content: content.slice(0, 280),
  });
  return result.insertId;
}

export async function getBusinessBroadcasts(establishmentId: number, limit = 20, offset = 0) {
  const db = (await getDb())!;
  const broadcasts = await db
    .select({
      id: businessBroadcasts.id,
      content: businessBroadcasts.content,
      createdAt: businessBroadcasts.createdAt,
      establishmentName: establishments.name,
    })
    .from(businessBroadcasts)
    .innerJoin(establishments, eq(businessBroadcasts.establishmentId, establishments.id))
    .where(eq(businessBroadcasts.establishmentId, establishmentId))
    .orderBy(desc(businessBroadcasts.createdAt))
    .limit(limit)
    .offset(offset);
  return broadcasts;
}

export async function getUserBroadcastFeed(userId: number, limit = 20, offset = 0) {
  const db = (await getDb())!;
  const feed = await db
    .select({
      id: businessBroadcasts.id,
      content: businessBroadcasts.content,
      createdAt: businessBroadcasts.createdAt,
      establishmentId: businessBroadcasts.establishmentId,
      establishmentName: establishments.name,
      establishmentSlug: establishments.slug,
    })
    .from(businessBroadcasts)
    .innerJoin(businessFollowers, and(
      eq(businessBroadcasts.establishmentId, businessFollowers.establishmentId),
      eq(businessFollowers.userId, userId)
    ))
    .innerJoin(establishments, eq(businessBroadcasts.establishmentId, establishments.id))
    .orderBy(desc(businessBroadcasts.createdAt))
    .limit(limit)
    .offset(offset);
  return feed;
}

// ==================== BUSINESS FOLLOWERS ====================

export async function followBusiness(establishmentId: number, userId: number) {
  const db = (await getDb())!;
  try {
    await db.insert(businessFollowers).values({ establishmentId, userId });
    return true;
  } catch {
    return false;
  }
}

export async function unfollowBusiness(establishmentId: number, userId: number) {
  const db = (await getDb())!;
  await db
    .delete(businessFollowers)
    .where(
      and(
        eq(businessFollowers.establishmentId, establishmentId),
        eq(businessFollowers.userId, userId)
      )
    );
}

export async function isFollowingBusiness(establishmentId: number, userId: number): Promise<boolean> {
  const db = (await getDb())!;
  const [result] = await db
    .select({ id: businessFollowers.id })
    .from(businessFollowers)
    .where(
      and(
        eq(businessFollowers.establishmentId, establishmentId),
        eq(businessFollowers.userId, userId)
      )
    )
    .limit(1);
  return !!result;
}

export async function getBusinessFollowerCount(establishmentId: number): Promise<number> {
  const db = (await getDb())!;
  const [result] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(businessFollowers)
    .where(eq(businessFollowers.establishmentId, establishmentId));
  return result?.count || 0;
}

export async function getUserFollowedEstablishments(userId: number) {
  const db = (await getDb())!;
  const followed = await db
    .select({
      establishmentId: businessFollowers.establishmentId,
      establishmentName: establishments.name,
      establishmentSlug: establishments.slug,
      followedAt: businessFollowers.createdAt,
    })
    .from(businessFollowers)
    .innerJoin(establishments, eq(businessFollowers.establishmentId, establishments.id))
    .where(eq(businessFollowers.userId, userId))
    .orderBy(desc(businessFollowers.createdAt));
  return followed;
}
