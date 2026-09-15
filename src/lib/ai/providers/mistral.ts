import { ChatMessage, ChatProvider, ProviderError } from "@/lib/ai/types";

const MISTRAL_ENDPOINT = "https://api.mistral.ai/v1/chat/completions";
// mistral-large-latest returned 403 tier_not_allowed on a fresh account
// (Mistral's free tier doesn't reliably include Large without extra
// account verification). mistral-small-latest is available far more
// broadly and is plenty capable for a chat assistant — swap this one
// constant if/when the account has Large access and it's worth the cost.
const MODEL = "mistral-small-latest";

/**
 * Talks to Mistral's OpenAI-compatible chat/completions endpoint and
 * re-emits it as a plain text-chunk stream. This is the ONLY file in the
 * app that knows Mistral's SSE format ("data: {...}\n\n", "data: [DONE]")
 * — swapping providers later means writing one new file here, not
 * touching the route or any UI component (spec §3).
 */
export class MistralProvider implements ChatProvider {
  readonly modelId = MODEL;

  constructor(private readonly apiKey: string) {}

  async streamChat(messages: ChatMessage[]): Promise<ReadableStream<Uint8Array>> {
    const upstream = await fetch(MISTRAL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        stream: true,
        messages,
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text().catch(() => "");
      throw new ProviderError(
        `Mistral merespons dengan status ${upstream.status}. ${detail.slice(0, 200)}`,
        upstream.status === 429 ? 429 : 502
      );
    }

    return toTextStream(upstream.body);
  }

  /** Non-streaming call, used by internal stages like the Memory
   *  Analyzer that just need one JSON-ish string back, not a render
   *  stream. Kept in this file because it's still Mistral-specific
   *  request/response shape. */
  async complete(messages: ChatMessage[]): Promise<string> {
    const upstream = await fetch(MISTRAL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        temperature: 0.1,
        messages,
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      throw new ProviderError(
        `Mistral merespons dengan status ${upstream.status}. ${detail.slice(0, 200)}`,
        upstream.status === 429 ? 429 : 502
      );
    }

    const data = await upstream.json();
    return data.choices?.[0]?.message?.content ?? "";
  }
}

/**
 * Converts Mistral's SSE byte stream into a stream of plain text deltas.
 * Malformed lines are skipped rather than aborting the whole response —
 * one bad chunk shouldn't kill an otherwise-good answer.
 */
function toTextStream(sseBody: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = sseBody.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (payload === "[DONE]") {
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(payload);
              const delta: string | undefined = json.choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(encoder.encode(delta));
            } catch {
              // Skip malformed/partial JSON chunk.
            }
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}
