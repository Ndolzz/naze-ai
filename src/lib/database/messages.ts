import { prisma } from "@/lib/database/prisma";
import { ChatMessage } from "@/lib/ai/types";

export async function addMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  model?: string,
  metadata?: Record<string, unknown>
) {
  return prisma.message.create({
    data: { conversationId, role, content, model, metadata },
  });
}

/** Used by "regenerate" (spec §6): removes the most recent message if
 *  it's an assistant turn, so the next call re-answers the same prompt
 *  instead of appending a duplicate reply. No-ops if the last message is
 *  a user turn (nothing to regenerate yet) or the conversation is empty. */
export async function deleteLastAssistantMessage(conversationId: string) {
  const last = await prisma.message.findFirst({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
  });
  if (last && last.role === "assistant") {
    await prisma.message.delete({ where: { id: last.id } });
  }
}

/** Recent turns for a conversation, oldest first, capped — this is what
 *  feeds src/lib/ai/contextBuilder.ts instead of trusting whatever
 *  history the client claims to have (spec §32: never trust the client). */
export async function getRecentMessages(
  conversationId: string,
  limit: number
): Promise<ChatMessage[]> {
  const rows = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { role: true, content: true },
  });
  return rows.reverse().map((r) => ({ role: r.role as "user" | "assistant", content: r.content }));
}
