export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/**
 * Anything the chat pipeline talks to must implement this. The API route
 * and the rest of src/lib/ai only ever depend on this interface — never on
 * MistralProvider directly — so a future ImageProvider/VoiceProvider or a
 * swapped text provider doesn't require touching route.ts (spec §3).
 */
export interface ChatProvider {
  /** Identifies which model actually answered, for persistence /
   *  debugging (spec §31, Message.model). Not shown in the UI. */
  readonly modelId: string;
  /** Returns a stream of raw text chunks (already extracted from
   *  whatever SSE/JSON shape the underlying API uses). Used for
   *  user-facing chat replies. */
  streamChat(messages: ChatMessage[]): Promise<ReadableStream<Uint8Array>>;
  /** Non-streaming single-shot completion, returned as plain text. Used
   *  for internal pipeline stages (Memory Analyzer) that need one clean
   *  string to parse, not a stream to render. */
  complete(messages: ChatMessage[]): Promise<string>;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly status: number = 502
  ) {
    super(message);
    this.name = "ProviderError";
  }
}
