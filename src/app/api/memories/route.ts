import { NextRequest, NextResponse } from "next/server";
import { resolveSession, applySessionCookie } from "@/lib/security/session";
import { listMemories, searchMemories, deleteAllMemories } from "@/lib/database/memories";
import { checkRateLimit } from "@/lib/security/rateLimit";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await resolveSession(req);
  const q = req.nextUrl.searchParams.get("q");
  const memories = q ? await searchMemories(session.userId, q) : await listMemories(session.userId);
  return applySessionCookie(NextResponse.json({ memories }), session);
}

/** "Hapus seluruh memori" (spec §13/§40). */
export async function DELETE(req: NextRequest) {
  const session = await resolveSession(req);

  const rateLimit = checkRateLimit(`${session.userId}:bulk-delete`);
  if (!rateLimit.ok) {
    return applySessionCookie(
      NextResponse.json({ error: "Terlalu banyak permintaan. Coba lagi sebentar lagi." }, { status: 429 }),
      session
    );
  }

  await deleteAllMemories(session.userId);
  return applySessionCookie(NextResponse.json({ ok: true }), session);
}
