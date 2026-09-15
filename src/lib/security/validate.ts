const MAX_MESSAGE_LENGTH = 6000;

type ValidationResult =
  | { ok: true; conversationId: string | null; message: string | null; regenerate: boolean; voiceMode: boolean }
  | { ok: false; error: string };

/**
 * The API route trusts nothing from the client. Since Phase 4, the client
 * sends either:
 *   - a new turn:   { conversationId: string | null, message: string }
 *   - a regenerate: { conversationId: string, regenerate: true }
 * optionally with `voiceMode: true` (Phase 7) when the request came from
 * Naze Call, so the persona prompt can ask for a spoken-friendly reply.
 * Prior turns are always loaded from the database server-side
 * (lib/database/messages.ts), never taken from the request body — that's
 * what stops a client from injecting fake "assistant" turns into its own
 * context.
 */
export function validateChatInput(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Permintaan tidak valid." };
  }

  const { conversationId, message, regenerate, voiceMode } = body as {
    conversationId?: unknown;
    message?: unknown;
    regenerate?: unknown;
    voiceMode?: unknown;
  };

  if (conversationId !== undefined && conversationId !== null && typeof conversationId !== "string") {
    return { ok: false, error: "conversationId tidak valid." };
  }

  const voice = voiceMode === true;

  if (regenerate === true) {
    if (typeof conversationId !== "string") {
      return { ok: false, error: "Regenerate butuh conversationId yang sudah ada." };
    }
    return { ok: true, conversationId, message: null, regenerate: true, voiceMode: voice };
  }

  if (typeof message !== "string" || message.trim().length === 0) {
    return { ok: false, error: "Isi pesan tidak boleh kosong." };
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, error: `Pesan terlalu panjang (maksimum ${MAX_MESSAGE_LENGTH} karakter).` };
  }

  return {
    ok: true,
    conversationId: typeof conversationId === "string" ? conversationId : null,
    message,
    regenerate: false,
    voiceMode: voice,
  };
}
