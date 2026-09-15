import { prisma } from "@/lib/database/prisma";

const IMPORTANCE_MIN = 1;
const IMPORTANCE_MAX = 5;

export function clampImportance(value: number | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 2;
  return Math.min(IMPORTANCE_MAX, Math.max(IMPORTANCE_MIN, Math.round(value)));
}

export async function createMemory(
  userId: string,
  content: string,
  category: string | null,
  importance: number,
  sourceConversationId: string | null
) {
  return prisma.memory.create({
    data: { userId, content, category, importance, sourceConversationId },
  });
}

export async function updateMemory(
  userId: string,
  memoryId: string,
  fields: { content?: string; category?: string | null; importance?: number }
) {
  const { count } = await prisma.memory.updateMany({
    where: { id: memoryId, userId },
    data: fields,
  });
  return count > 0;
}

export async function deleteMemory(userId: string, memoryId: string) {
  const { count } = await prisma.memory.deleteMany({ where: { id: memoryId, userId } });
  return count > 0;
}

export async function deleteAllMemories(userId: string) {
  await prisma.memory.deleteMany({ where: { userId } });
}

export async function listMemories(userId: string) {
  return prisma.memory.findMany({
    where: { userId },
    orderBy: [{ importance: "desc" }, { updatedAt: "desc" }],
  });
}

export async function searchMemories(userId: string, query: string) {
  const q = query.trim();
  if (!q) return listMemories(userId);
  return prisma.memory.findMany({
    where: {
      userId,
      OR: [
        { content: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: [{ importance: "desc" }, { updatedAt: "desc" }],
  });
}

/** The candidate pool the retriever scores against, and what the analyzer
 *  is shown so it can choose "update"/"delete" instead of only "create".
 *  Capped so a user with hundreds of memories doesn't blow up either
 *  call — good enough while retrieval is a lightweight in-process scorer
 *  rather than a real vector search (see lib/memory/retrieval.ts). */
export async function getMemoryPool(userId: string, limit = 200) {
  return prisma.memory.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: { id: true, content: true, category: true, importance: true },
  });
}
