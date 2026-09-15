import { prisma } from "@/lib/database/prisma";

const TITLE_MAX_LENGTH = 48;

/** Turns the first user message into a short conversation title, the way
 *  most chat products do — nothing fancier (no summarization call) until
 *  there's a reason to spend a model call on it. */
export function deriveTitle(firstMessage: string): string {
  const clean = firstMessage.trim().replace(/\s+/g, " ");
  if (clean.length <= TITLE_MAX_LENGTH) return clean || "Percakapan baru";
  return `${clean.slice(0, TITLE_MAX_LENGTH).trimEnd()}…`;
}

export async function createConversation(userId: string, title: string) {
  return prisma.conversation.create({
    data: { userId, title },
  });
}

/** List, newest-active first, pinned pinned to the top. Archived chats
 *  are excluded unless explicitly asked for (spec §14: archive is a
 *  separate view from the main list). */
export async function listConversations(userId: string, { includeArchived = false } = {}) {
  return prisma.conversation.findMany({
    where: { userId, archived: includeArchived ? undefined : false },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      pinned: true,
      archived: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/** Returns null (rather than throwing) when the conversation doesn't
 *  exist OR belongs to a different session — callers turn that into a
 *  404, so a user can never probe for another session's conversation ids. */
export async function getOwnedConversation(userId: string, conversationId: string) {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  return conversation;
}

export async function conversationBelongsToUser(userId: string, conversationId: string) {
  const count = await prisma.conversation.count({ where: { id: conversationId, userId } });
  return count > 0;
}

export async function renameConversation(userId: string, conversationId: string, title: string) {
  const { count } = await prisma.conversation.updateMany({
    where: { id: conversationId, userId },
    data: { title: title.trim().slice(0, TITLE_MAX_LENGTH) || "Percakapan baru" },
  });
  return count > 0;
}

export async function setConversationFlags(
  userId: string,
  conversationId: string,
  flags: { archived?: boolean; pinned?: boolean }
) {
  const { count } = await prisma.conversation.updateMany({
    where: { id: conversationId, userId },
    data: flags,
  });
  return count > 0;
}

export async function deleteConversation(userId: string, conversationId: string) {
  const { count } = await prisma.conversation.deleteMany({
    where: { id: conversationId, userId },
  });
  return count > 0; // cascades to messages via the schema's onDelete: Cascade
}

export async function deleteAllConversations(userId: string) {
  await prisma.conversation.deleteMany({ where: { userId } });
}

/** Bumps updatedAt so the conversation moves back to the top of the list
 *  after a new reply — called after the assistant message is saved. */
export async function touchConversation(conversationId: string) {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
}

/** Matches on conversation title OR any message's content (spec §15).
 *  `mode: "insensitive"` requires Postgres — fine here since that's the
 *  only provider this schema targets. */
export async function searchConversations(userId: string, query: string) {
  const q = query.trim();
  if (!q) return [];

  return prisma.conversation.findMany({
    where: {
      userId,
      archived: false,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { messages: { some: { content: { contains: q, mode: "insensitive" } } } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true },
    take: 20,
  });
}
