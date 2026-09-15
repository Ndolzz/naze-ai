import { NextRequest, NextResponse } from "next/server";
import { resolveSession, applySessionCookie } from "@/lib/security/session";
import { checkRateLimit } from "@/lib/security/rateLimit";
import {
  conversationBelongsToUser,
  createConversation,
  deriveTitle,
  touchConversation,
} from "@/lib/database/conversations";
import { addMessage } from "@/lib/database/messages";
import { createGeneratedImage } from "@/lib/database/images";
import { getImageProvider, ImageProviderError } from "@/lib/ai/image";

export const runtime = "nodejs";

const MAX_PROMPT_LENGTH = 800;

/**
 * Text AI and image AI are separate pipelines end to end (spec §17): this
 * route never touches lib/ai's chat provider, and /api/chat never touches
 * this one. The user's prompt and the generated image both get saved as
 * ordinary messages, so an image result is just another turn in the same
 * conversation/history — not a separate silo.
 */
export async function POST(req: NextRequest) {
  const session = await resolveSession(req);

  const rateLimit = checkRateLimit(`${session.userId}:image`);
  if (!rateLimit.ok) {
    return withSession(
      jsonError("Terlalu banyak permintaan gambar dalam waktu singkat. Coba lagi sebentar lagi.", 429),
      session
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return withSession(jsonError("Isi permintaan bukan JSON yang valid.", 400), session);
  }

  const { conversationId: rawConversationId, prompt } = body as {
    conversationId?: unknown;
    prompt?: unknown;
  };

  if (typeof prompt !== "string" || !prompt.trim()) {
    return withSession(jsonError("Prompt gambar tidak boleh kosong.", 400), session);
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return withSession(
      jsonError(`Prompt terlalu panjang (maksimum ${MAX_PROMPT_LENGTH} karakter).`, 400),
      session
    );
  }
  if (rawConversationId !== undefined && rawConversationId !== null && typeof rawConversationId !== "string") {
    return withSession(jsonError("conversationId tidak valid.", 400), session);
  }

  let conversationId = typeof rawConversationId === "string" ? rawConversationId : null;
  if (conversationId) {
    const owned = await conversationBelongsToUser(session.userId, conversationId);
    if (!owned) {
      return withSession(jsonError("Percakapan tidak ditemukan.", 404), session);
    }
  } else {
    const conversation = await createConversation(session.userId, deriveTitle(prompt));
    conversationId = conversation.id;
  }

  await addMessage(conversationId, "user", prompt);

  try {
    const provider = getImageProvider();
    const { url } = await provider.generate(prompt);

    await createGeneratedImage(conversationId, prompt, url);
    await addMessage(conversationId, "assistant", `![${prompt}](${url})`, provider.name, {
      kind: "image",
      prompt,
      url,
    });
    await touchConversation(conversationId);

    const res = NextResponse.json({ url, conversationId });
    res.headers.set("X-Conversation-Id", conversationId);
    return withSession(res, session);
  } catch (err) {
    const message = err instanceof ImageProviderError ? err.message : "Naze tidak bisa membuat gambar sekarang. Coba lagi.";
    const status = err instanceof ImageProviderError ? err.status : 500;
    const res = jsonError(message, status);
    res.headers.set("X-Conversation-Id", conversationId);
    return withSession(res, session);
  }
}

function withSession(res: NextResponse, session: Awaited<ReturnType<typeof resolveSession>>) {
  return applySessionCookie(res, session);
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}
