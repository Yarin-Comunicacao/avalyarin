import { getDb } from "./db";
import {
  groupMessages, messageReactions, groups, groupLists, groupListItems,
  polls, pollOptions, pollVotes, users, establishments
} from "../drizzle/schema";
import { eq, and, desc, asc, sql, inArray } from "drizzle-orm";

type GroupMediaType = "audio" | "image" | "video";
type GroupMessageType = "text" | GroupMediaType | "share_rating" | "share_establishment" | "share_profile" | "event" | "reservation";

type MessageMediaInput = {
  mediaUrl?: string;
  mediaStorageKey?: string;
  mediaMimeType?: string;
  mediaDurationSeconds?: number;
  mediaSizeBytes?: number;
  mediaThumbnailUrl?: string;
};

// ==================== REPLY ====================

export async function sendGroupMessageWithReply(
  groupId: number,
  senderId: number,
  content: string,
  replyToId?: number,
  type: GroupMessageType = "text",
  referenceId?: number,
  referenceSlug?: string,
  media?: MessageMediaInput
) {
  const db = (await getDb())!;
  const [result] = await db.insert(groupMessages).values({
    groupId,
    senderId,
    content: content.slice(0, 140),
    type,
    referenceId: referenceId || null,
    referenceSlug: referenceSlug || null,
    replyToId: replyToId || null,
    mediaUrl: media?.mediaUrl || null,
    mediaStorageKey: media?.mediaStorageKey || null,
    mediaMimeType: media?.mediaMimeType || null,
    mediaDurationSeconds: media?.mediaDurationSeconds || null,
    mediaSizeBytes: media?.mediaSizeBytes || null,
    mediaThumbnailUrl: media?.mediaThumbnailUrl || null,
  });
  await db.update(groups).set({ updatedAt: new Date() }).where(eq(groups.id, groupId));
  return result.insertId;
}

// ==================== REACTIONS ====================

export async function addReaction(messageId: number, userId: number, emoji: string) {
  const db = (await getDb())!;
  // Remove existing reaction from same user on same message (toggle behavior)
  const existing = await db
    .select({ id: messageReactions.id })
    .from(messageReactions)
    .where(and(
      eq(messageReactions.messageId, messageId),
      eq(messageReactions.userId, userId),
      eq(messageReactions.emoji, emoji)
    ))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(messageReactions).where(eq(messageReactions.id, existing[0].id));
    return { action: "removed" as const };
  }

  await db.insert(messageReactions).values({ messageId, userId, emoji });
  return { action: "added" as const };
}

export async function getReactionsForMessages(messageIds: number[]) {
  if (messageIds.length === 0) return [];
  const db = (await getDb())!;
  const reactions = await db
    .select({
      id: messageReactions.id,
      messageId: messageReactions.messageId,
      userId: messageReactions.userId,
      emoji: messageReactions.emoji,
      userName: users.name,
    })
    .from(messageReactions)
    .innerJoin(users, eq(messageReactions.userId, users.id))
    .where(inArray(messageReactions.messageId, messageIds));
  return reactions;
}

// ==================== PIN MESSAGE ====================

export async function pinMessage(groupId: number, messageId: number | null) {
  const db = (await getDb())!;
  await db.update(groups).set({ pinnedMessageId: messageId }).where(eq(groups.id, groupId));
}

export async function getPinnedMessage(groupId: number) {
  const db = (await getDb())!;
  const [group] = await db
    .select({ pinnedMessageId: groups.pinnedMessageId })
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1);

  if (!group?.pinnedMessageId) return null;

  const [msg] = await db
    .select({
      id: groupMessages.id,
      content: groupMessages.content,
      senderName: users.name,
      createdAt: groupMessages.createdAt,
    })
    .from(groupMessages)
    .innerJoin(users, eq(groupMessages.senderId, users.id))
    .where(eq(groupMessages.id, group.pinnedMessageId))
    .limit(1);

  return msg || null;
}

// ==================== GROUP LISTS ====================

export async function createGroupList(groupId: number, name: string, createdBy: number) {
  const db = (await getDb())!;
  const [result] = await db.insert(groupLists).values({ groupId, name, createdBy });
  return result.insertId;
}

export async function getGroupLists(groupId: number) {
  const db = (await getDb())!;
  const lists = await db
    .select({
      id: groupLists.id,
      name: groupLists.name,
      createdBy: groupLists.createdBy,
      createdAt: groupLists.createdAt,
      itemCount: sql<number>`(SELECT COUNT(*) FROM group_list_items WHERE listId = ${groupLists.id})`,
    })
    .from(groupLists)
    .where(eq(groupLists.groupId, groupId))
    .orderBy(groupLists.createdAt);
  return lists;
}

export async function deleteGroupList(listId: number) {
  const db = (await getDb())!;
  await db.delete(groupListItems).where(eq(groupListItems.listId, listId));
  await db.delete(groupLists).where(eq(groupLists.id, listId));
}

export async function addEstablishmentToList(listId: number, establishmentId: number, addedBy: number) {
  const db = (await getDb())!;
  // Check if already in list
  const existing = await db
    .select({ id: groupListItems.id })
    .from(groupListItems)
    .where(and(
      eq(groupListItems.listId, listId),
      eq(groupListItems.establishmentId, establishmentId)
    ))
    .limit(1);

  if (existing.length > 0) return existing[0].id;

  const [result] = await db.insert(groupListItems).values({ listId, establishmentId, addedBy });
  return result.insertId;
}

export async function removeEstablishmentFromList(listId: number, establishmentId: number) {
  const db = (await getDb())!;
  await db.delete(groupListItems).where(and(
    eq(groupListItems.listId, listId),
    eq(groupListItems.establishmentId, establishmentId)
  ));
}

export async function getListItems(listId: number) {
  const db = (await getDb())!;
  const items = await db
    .select({
      id: groupListItems.id,
      establishmentId: groupListItems.establishmentId,
      establishmentName: establishments.name,
      establishmentSlug: establishments.slug,
      establishmentNeighborhood: establishments.neighborhood,
      addedBy: groupListItems.addedBy,
      addedByName: users.name,
      createdAt: groupListItems.createdAt,
    })
    .from(groupListItems)
    .innerJoin(establishments, eq(groupListItems.establishmentId, establishments.id))
    .innerJoin(users, eq(groupListItems.addedBy, users.id))
    .where(eq(groupListItems.listId, listId))
    .orderBy(desc(groupListItems.createdAt));
  return items;
}

export async function getGroupListById(listId: number) {
  const db = (await getDb())!;
  const [list] = await db
    .select()
    .from(groupLists)
    .where(eq(groupLists.id, listId))
    .limit(1);
  return list || null;
}

// ==================== POLLS ====================

interface PollOptionInput {
  text: string;
  dateValue?: string; // YYYY-MM-DD for tipo "data"
  establishmentId?: number; // for tipo "estab" and "total"
}

interface CreatePollInput {
  groupId: number;
  createdBy: number;
  question: string;
  description?: string | null;
  pollType: "texto" | "data" | "estab" | "total";
  multipleChoice: boolean;
  options: PollOptionInput[];
  customAddress?: string;
  customNumber?: string;
  customComplement?: string;
}

export async function createPoll(input: CreatePollInput) {
  const db = (await getDb())!;
  const [pollResult] = await db.insert(polls).values({
    groupId: input.groupId,
    createdBy: input.createdBy,
    question: input.question,
    description: input.description || null,
    pollType: input.pollType,
    multipleChoice: input.multipleChoice,
    customAddress: input.customAddress || null,
    customNumber: input.customNumber || null,
    customComplement: input.customComplement || null,
  });
  const pollId = Number(pollResult.insertId);

  // Insert options
  for (let i = 0; i < input.options.length; i++) {
    await db.insert(pollOptions).values({
      pollId,
      text: input.options[i].text,
      dateValue: input.options[i].dateValue || null,
      establishmentId: input.options[i].establishmentId || null,
      sortOrder: i,
    });
  }

  // Create a message in the chat linked to this poll
  const [msgResult] = await db.insert(groupMessages).values({
    groupId: input.groupId,
    senderId: input.createdBy,
    content: `📊 ${input.question}`.slice(0, 140),
    type: "poll",
    referenceId: pollId,
  });

  // Link message back to poll
  await db.update(polls).set({ messageId: Number(msgResult.insertId) }).where(eq(polls.id, pollId));
  await db.update(groups).set({ updatedAt: new Date() }).where(eq(groups.id, input.groupId));

  return pollId;
}

export async function getGroupPolls(groupId: number) {
  const db = (await getDb())!;
  const pollsList = await db
    .select({
      id: polls.id,
      question: polls.question,
      description: polls.description,
      pollType: polls.pollType,
      multipleChoice: polls.multipleChoice,
      closed: polls.closed,
      createdBy: polls.createdBy,
      creatorName: users.name,
      customAddress: polls.customAddress,
      customNumber: polls.customNumber,
      customComplement: polls.customComplement,
      messageId: polls.messageId,
      createdAt: polls.createdAt,
    })
    .from(polls)
    .innerJoin(users, eq(polls.createdBy, users.id))
    .where(eq(polls.groupId, groupId))
    .orderBy(desc(polls.createdAt));
  return pollsList;
}

export async function getPollWithOptions(pollId: number) {
  const db = (await getDb())!;
  const [poll] = await db
    .select({
      id: polls.id,
      groupId: polls.groupId,
      question: polls.question,
      description: polls.description,
      pollType: polls.pollType,
      multipleChoice: polls.multipleChoice,
      closed: polls.closed,
      createdBy: polls.createdBy,
      customAddress: polls.customAddress,
      customNumber: polls.customNumber,
      customComplement: polls.customComplement,
    })
    .from(polls)
    .where(eq(polls.id, pollId))
    .limit(1);

  if (!poll) return null;

  const options = await db
    .select({
      id: pollOptions.id,
      text: pollOptions.text,
      dateValue: pollOptions.dateValue,
      establishmentId: pollOptions.establishmentId,
      sortOrder: pollOptions.sortOrder,
      voteCount: sql<number>`(SELECT COUNT(*) FROM poll_votes WHERE poll_votes.pollOptionId = \`poll_options\`.\`id\`)`,
    })
    .from(pollOptions)
    .where(eq(pollOptions.pollId, pollId))
    .orderBy(pollOptions.sortOrder);

  return { ...poll, options };
}

export async function votePoll(pollOptionId: number, userId: number, pollId: number, multipleChoice: boolean) {
  const db = (await getDb())!;

  if (!multipleChoice) {
    // Single choice: check if user already voted on this exact option (toggle off)
    const existingOnSameOption = await db
      .select({ id: pollVotes.id })
      .from(pollVotes)
      .where(and(
        eq(pollVotes.pollOptionId, pollOptionId),
        eq(pollVotes.userId, userId)
      ))
      .limit(1);

    if (existingOnSameOption.length > 0) {
      // User clicked the same option again — remove vote (toggle off)
      await db.delete(pollVotes).where(eq(pollVotes.id, existingOnSameOption[0].id));
      return { action: "removed" as const };
    }

    // Remove previous vote on any other option of this poll
    const existingOptions = await db
      .select({ id: pollOptions.id })
      .from(pollOptions)
      .where(eq(pollOptions.pollId, pollId));

    const optionIds = existingOptions.map((o: { id: number }) => o.id);
    if (optionIds.length > 0) {
      await db.delete(pollVotes).where(and(
        inArray(pollVotes.pollOptionId, optionIds),
        eq(pollVotes.userId, userId)
      ));
    }
  } else {
    // Multiple choice: toggle this specific option
    const existing = await db
      .select({ id: pollVotes.id })
      .from(pollVotes)
      .where(and(
        eq(pollVotes.pollOptionId, pollOptionId),
        eq(pollVotes.userId, userId)
      ))
      .limit(1);

    if (existing.length > 0) {
      await db.delete(pollVotes).where(eq(pollVotes.id, existing[0].id));
      return { action: "removed" as const };
    }
  }

  // Prevent duplicate insert with a final check (race condition guard)
  const alreadyVoted = await db
    .select({ id: pollVotes.id })
    .from(pollVotes)
    .where(and(
      eq(pollVotes.pollOptionId, pollOptionId),
      eq(pollVotes.userId, userId)
    ))
    .limit(1);

  if (alreadyVoted.length > 0) {
    return { action: "voted" as const }; // Already voted, no-op
  }

  await db.insert(pollVotes).values({ pollOptionId, userId });
  return { action: "voted" as const };
}

export async function getUserPollVotes(pollId: number, userId: number) {
  const db = (await getDb())!;
  const options = await db
    .select({ id: pollOptions.id })
    .from(pollOptions)
    .where(eq(pollOptions.pollId, pollId));

  const optionIds = options.map((o: { id: number }) => o.id);
  if (optionIds.length === 0) return [];

  const votes = await db
    .select({ pollOptionId: pollVotes.pollOptionId })
    .from(pollVotes)
    .where(and(
      inArray(pollVotes.pollOptionId, optionIds),
      eq(pollVotes.userId, userId)
    ));

  return votes.map((v: { pollOptionId: number }) => v.pollOptionId);
}

export async function closePoll(pollId: number) {
  const db = (await getDb())!;
  await db.update(polls).set({ closed: true }).where(eq(polls.id, pollId));
}

// ==================== ENHANCED MESSAGES QUERY ====================

export async function getGroupMessagesEnhanced(groupId: number, limit = 50, offset = 0) {
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
      mediaUrl: groupMessages.mediaUrl,
      mediaStorageKey: groupMessages.mediaStorageKey,
      mediaMimeType: groupMessages.mediaMimeType,
      mediaDurationSeconds: groupMessages.mediaDurationSeconds,
      mediaSizeBytes: groupMessages.mediaSizeBytes,
      mediaThumbnailUrl: groupMessages.mediaThumbnailUrl,
      referenceId: groupMessages.referenceId,
      referenceSlug: groupMessages.referenceSlug,
      replyToId: groupMessages.replyToId,
      createdAt: groupMessages.createdAt,
    })
    .from(groupMessages)
    .innerJoin(users, eq(groupMessages.senderId, users.id))
    .where(eq(groupMessages.groupId, groupId))
    .orderBy(asc(groupMessages.createdAt))
    .limit(limit)
    .offset(offset);

  // Fetch reactions for these messages
  const messageIds = messages.map((m: any) => m.id);
  const reactions = messageIds.length > 0 ? await getReactionsForMessages(messageIds) : [];

  // Fetch reply-to messages content
  const replyToIds = messages.filter((m: any) => m.replyToId).map((m: any) => m.replyToId!);
  let replyMessages: any[] = [];
  if (replyToIds.length > 0) {
    replyMessages = await db
      .select({
        id: groupMessages.id,
        content: groupMessages.content,
        senderName: users.name,
      })
      .from(groupMessages)
      .innerJoin(users, eq(groupMessages.senderId, users.id))
      .where(inArray(groupMessages.id, replyToIds));
  }

  // Merge reactions and reply data into messages
  return messages.map((msg: any) => ({
    ...msg,
    reactions: reactions.filter((r: any) => r.messageId === msg.id),
    replyTo: msg.replyToId
      ? replyMessages.find((r: any) => r.id === msg.replyToId) || null
      : null,
  }));
}
