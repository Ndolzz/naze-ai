import { getMemoryPool } from "@/lib/database/memories";

const MAX_RELEVANT = 5;
const MIN_SCORE = 1;

/**
 * Deliberately NOT semantic search. This is a keyword-overlap scorer:
 * tokenize the query and each memory, count shared words, and add a
 * small importance boost. It's honest about being simple — good enough
 * while a user's memory pool is small (tens to low hundreds of rows),
 * and there's a clearly-marked place to swap in embeddings + pgvector
 * later (see README) without touching anything that calls this function.
 *
 * The point either way is spec §12: never dump the whole memory table
 * into the prompt — only what's actually relevant to what's being asked
 * right now.
 */
export async function getRelevantMemories(userId: string, queryText: string) {
  const pool = await getMemoryPool(userId);
  if (pool.length === 0) return [];

  const queryWords = tokenize(queryText);
  if (queryWords.size === 0) return [];

  const scored = pool
    .map((memory) => ({
      memory,
      score: overlapScore(queryWords, tokenize(memory.content)) + memory.importance * 0.1,
    }))
    .filter((s) => s.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RELEVANT);

  return scored.map((s) => s.memory);
}

function tokenize(text: string): Set<string> {
  const words = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return new Set(words.filter((w) => w.length > 2));
}

function overlapScore(query: Set<string>, target: Set<string>): number {
  let count = 0;
  for (const word of query) {
    if (target.has(word)) count += 1;
  }
  return count;
}
