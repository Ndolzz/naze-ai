import { ChatMessage } from "@/lib/ai/types";
import { buildSystemPrompt } from "@/lib/ai/persona";
import { getRelevantMemories } from "@/lib/memory/retrieval";

/** Hard cap so one runaway client can't blow up the prompt or the bill. */
const MAX_HISTORY_MESSAGES = 20;

interface BuildContextOptions {
  voiceMode?: boolean;
  /** Settings §27/§40 memory toggle. Default true so every existing
   *  call site keeps working without having to know about settings. */
  memoryEnabled?: boolean;
}

/**
 * Assembles what actually gets sent to the provider: persona + relevant
 * long-term memory + capped recent turns (spec §12: never dump the whole
 * memory table into every prompt — only what the retriever judged
 * relevant to `queryText`, this turn's actual message).
 *
 * A rolling conversation summary for very long threads (spec §16) still
 * has a natural home here, between the memory block and recent turns,
 * once a conversation is long enough to need one — nothing calling this
 * function needs to change when that lands.
 *
 * `voiceMode` (spec §22) swaps in a short addendum telling the model
 * its reply will be read aloud, not displayed — no markdown, no lists,
 * shorter sentences. Set by /api/chat when the request came from
 * Naze Call (features/voice/useCall.ts).
 *
 * `memoryEnabled: false` (Phase 8 Settings) skips retrieval entirely —
 * not just hides the result, actually never queries the memory table for
 * this request, so turning memory off is a real privacy control.
 */
export async function buildContext(
  userId: string,
  history: ChatMessage[],
  queryText: string,
  options: BuildContextOptions = {}
): Promise<ChatMessage[]> {
  const { voiceMode = false, memoryEnabled = true } = options;
  const relevantMemories = memoryEnabled ? await getRelevantMemories(userId, queryText) : [];

  const systemMessages: ChatMessage[] = [{ role: "system", content: buildSystemPrompt(voiceMode) }];

  if (relevantMemories.length > 0) {
    const memoryBlock = relevantMemories.map((m) => `- ${m.content}`).join("\n");
    systemMessages.push({
      role: "system",
      content: `Hal-hal yang kamu ingat tentang pengguna ini (pakai kalau relevan, jangan sebutkan bahwa ini "memori tersimpan" secara eksplisit kecuali ditanya):\n${memoryBlock}`,
    });
  }

  const recent = history.slice(-MAX_HISTORY_MESSAGES);
  return [...systemMessages, ...recent];
}
