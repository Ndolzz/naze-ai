import { ChatMessage, ChatProvider, ProviderError } from "@/lib/ai/types";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
// gemini-3.6-flash: Google's workhorse Flash model, available on the
// Gemini API free tier (create a key at aistudio.google.com/apikey, no
// billing required). Swap this single constant if a different model is
// ever needed.
const MODEL = "gemini-3.6-flash";

interface GeminiPart {
  text?: string;
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

/**
 * Maps the app's neutral ChatMessage[] shape into Gemini's payload:
 * system messages become systemInstruction, assistant turns become
 * "model" turns. This is the ONLY file in the app that knows Gemini's
 * request/response shape, so swapping providers later means writing one
 * new file here, not touching the route or any UI component.
 *
 * Two Gemini 3.x Flash quirks are handled here:
 * 1. Generation params like temperature are not supported and get
 *    ignored, so none are sent.
 * 2. A request whose last turn has role "model" is rejected, so any
 *    trailing model turns are dropped defensively.
 */
function toGeminiPayload(messages: ChatMessage[]) {
  const systemText = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const contents: GeminiContent[] = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: m.content }],
    }));
  while (contents.length > 0 && contents[contents.length - 1].role === "model") {
    contents.pop();
  }
  return {
    ...(systemText ? { systemInstruction: { parts: [{ text: systemText }] } } : {}),
    contents,
  };
}

/**
 * Talks to Gemini's streamGenerateContent endpoint (SSE via alt=sse) and
 * re-emits it as a plain text-chunk stream.
 */
export class GeminiProvider implements ChatProvider {
  readonly modelId = MODEL;

  constructor(private readonly apiKey: string) {}

  async streamChat(messages: ChatMessage[]): Promise<ReadableStream<Uint8Array>> {
    const upstream = await fetch(
      GEMINI_BASE + "/" + MODEL + ":streamGenerateContent?alt=sse",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify(toGeminiPayload(messages)),
      }
    );

    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text().catch(() => "");
      throw new ProviderError(
        "Gemini merespons dengan status " + upstream.status + ". " + detail.slice(0, 200),
        upstream.status === 429 ? 429 : 502
      );
    }

    return toTextStream(upstream.body);
  }

  /**
   * Non-streaming call, used by internal stages like the Memory Analyzer
   * that just need one JSON-ish string back, not a render stream. Kept in
   * this file because it is still Gemini-specific request/response shape.
   */
  async complete(messages: ChatMessage[]): Promise<string> {
    const upstream = await fetch(GEMINI_BASE + "/" + MODEL + ":generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.apiKey,
      },
      body: JSON.stringify(toGeminiPayload(messages)),
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      throw new ProviderError(
        "Gemini merespons dengan status " + upstream.status + ". " + detail.slice(0, 200),
        upstream.status === 429 ? 429 : 502
      );
    }

    const data = await upstream.json();
    const parts: GeminiPart[] | undefined = data.candidates?.[0]?.content?.parts;
    return (parts ?? []).map((p) => p.text ?? "").join("");
  }
}

/**
 * Converts Gemini's SSE byte stream ("data: {...}" lines) into a stream
 * of plain text deltas. Malformed lines are skipped rather than aborting
 * the whole response: one bad chunk shouldn't kill an otherwise-good
 * answer.
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
            if (!payload) continue;
            try {
              const json = JSON.parse(payload);
              const parts: GeminiPart[] | undefined = json.candidates?.[0]?.content?.parts;
              const delta = (parts ?? []).map((p) => p.text ?? "").join("");
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
