import { NextRequest, NextResponse } from "next/server";
import { getChatProvider } from "@/lib/ai";
import { ProviderError } from "@/lib/ai/types";
import { buildContext } from "@/lib/ai/contextBuilder";
import { validateChatInput } from "@/lib/security/validate";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { resolveSession, applySessionCookie } from "@/lib/security/session";
import {
  createConversation,
  conversationBelongsToUser,
  deriveTitle,
  touchConversation,
} from "@/lib/database/conversations";
import { addMessage, deleteLastAssistantMessage, getRecentMessages } from "@/lib/database/messages";
import { runMemoryAnalyzer } from "@/lib/memory/analyzer";
import { getSettings } from "@/lib/database/settings";

export const runtime = "nodejs";

const HISTORY_LIMIT = 20;

/**
 * Pipeline (spec §8/§10), with real persistence and long-term memory:
 *
 *   resolve session → rate limit → validate → load/create conversation
 *   → save the user's message → Context Builder (persona + relevant
 *   memory + recent turns, all read FROM the database) → Mistral →
 *   stream to client while accumulating → save the assistant's message
 *   → Memory Analyzer decides create/update/delete/ignore
 *
 * The client only ever sends the one new message + which conversation
 * it's replying in. History (and now memory) come from the database
 * because trusting a client-supplied transcript would let it inject fake
 * "assistant" turns into its own context (spec §32).
 */
export async function POST(req: NextRequest) {
  const session = await resolveSession(req);

  const rateLimit = checkRateLimit(session.userId);
  if (!rateLimit.ok) {
    return withSession(jsonError("Terlalu banyak pesan dalam waktu singkat. Coba lagi sebentar lagi.", 429), session);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return withSession(jsonError("Isi permintaan bukan JSON yang valid.", 400), session);
  }

  const validation = validateChatInput(body);
  if (!validation.ok) {
    return withSession(jsonError(validation.error, 400), session);
  }

  let conversationId = validation.conversationId;
  if (conversationId) {
    const owned = await conversationBelongsToUser(session.userId, conversationId);
    if (!owned) {
      return withSession(jsonError("Percakapan tidak ditemukan.", 404), session);
    }
  } else if (!validation.regenerate) {
    const conversation = await createConversation(session.userId, deriveTitle(validation.message!));
    conversationId = conversation.id;
  }

  if (!conversationId) {
    // Unreachable given the branches above, but keeps TypeScript (and a
    // future refactor) honest that nothing below tolerates a null id.
    return withSession(jsonError("Percakapan tidak ditemukan.", 400), session);
  }

  if (validation.regenerate) {
    await deleteLastAssistantMessage(conversationId);
  } else {
    await addMessage(conversationId, "user", validation.message!);
  }

  try {
    const provider = getChatProvider();
    const settings = await getSettings(session.userId);
    const history = await getRecentMessages(conversationId, HISTORY_LIMIT);
    // For a fresh message this is just validation.message. For a
    // regenerate, there's no new message — the retriever instead keys
    // off the last user turn already sitting in history.
    const queryText = validation.message ?? lastUserContent(history) ?? "";
    const context = await buildContext(session.userId, history, queryText, {
      voiceMode: validation.voiceMode,
      memoryEnabled: settings.memoryEnabled,
    });
    const rawStream = await provider.streamChat(context);
    const stream = createPersistingStream({
      rawStream,
      conversationId,
      modelId: provider.modelId,
      userId: session.userId,
      userMessageText: queryText,
      memoryEnabled: settings.memoryEnabled,
    });

    const res = new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Conversation-Id": conversationId,
      },
    });
    return withSession(res, session);
  } catch (err) {
    const message = err instanceof ProviderError ? err.message : "Naze tidak bisa menjawab sekarang. Coba lagi.";
    const status = err instanceof ProviderError ? err.status : 500;
    const res = jsonError(message, status);
    res.headers.set("X-Conversation-Id", conversationId);
    return withSession(res, session);
  }
}

function lastUserContent(history: { role: string; content: string }[]): string | null {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === "user") return history[i].content;
  }
  return null;
}

interface PersistingStreamParams {
  rawStream: ReadableStream<Uint8Array>;
  conversationId: string;
  modelId: string;
  userId: string;
  userMessageText: string;
  memoryEnabled: boolean;
}

/**
 * Forwards provider chunks to the client while accumulating the full
 * text, then (whether the stream ends normally or the client disconnects
 * early via `cancel`) persists the assistant message and runs the Memory
 * Analyzer — both before closing the stream, not fired-and-forgotten in
 * the background. Serverless functions can be frozen the instant a
 * response finishes, so anything that must reliably happen (saving the
 * reply, deciding whether to remember something) happens before
 * `controller.close()`, at the cost of a little extra latency the client
 * only sees as the stream taking slightly longer to fully end.
 */
function createPersistingStream({
  rawStream,
  conversationId,
  modelId,
  userId,
  userMessageText,
  memoryEnabled,
}: PersistingStreamParams): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  let full = "";
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

  async function persist() {
    if (!full.trim()) return;
    try {
      await addMessage(conversationId, "assistant", full, modelId);
      await touchConversation(conversationId);
    } catch {
      // Best-effort — a persistence hiccup shouldn't crash a response
      // that already reached the client.
      return;
    }
    // Settings §27/§40 (Memory toggle): if the person turned memory off,
    // skip the analyzer call entirely rather than running it and
    // discarding the result — no point spending a Mistral call on a
    // decision nothing will act on.
    if (!memoryEnabled) return;
    try {
      await runMemoryAnalyzer(userId, conversationId, userMessageText, full);
    } catch {
      // Analyzer is best-effort too — never lets a memory-side failure
      // surface as a chat error.
    }
  }

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      reader = rawStream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          full += decoder.decode(value, { stream: true });
          controller.enqueue(value);
        }
        await persist();
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
    async cancel() {
      await reader?.cancel();
      await persist();
    },
  });
}

function withSession(res: NextResponse, session: Awaited<ReturnType<typeof resolveSession>>) {
  return applySessionCookie(res, session);
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}
