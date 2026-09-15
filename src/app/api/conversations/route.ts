import { NextRequest, NextResponse } from "next/server";
import { resolveSession, applySessionCookie } from "@/lib/security/session";
import { listConversations, deleteAllConversations } from "@/lib/database/conversations";
import { checkRateLimit } from "@/lib/security/rateLimit";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await resolveSession(req);
  const conversations = await listConversations(session.userId);
  return applySessionCookie(NextResponse.json({ conversations }), session);
}

/** "Hapus seluruh history" (spec §14/§40) — deletes every conversation
 *  (and, via cascade, every message) owned by this session. */
export async function DELETE(req: NextRequest) {
  const session = await resolveSession(req);

  const rateLimit = checkRateLimit(`${session.userId}:bulk-delete`);
  if (!rateLimit.ok) {
    return applySessionCookie(
      NextResponse.json({ error: "Terlalu banyak permintaan. Coba lagi sebentar lagi." }, { status: 429 }),
      session
    );
  }

  await deleteAllConversations(session.userId);
  return applySessionCookie(NextResponse.json({ ok: true }), session);
}
