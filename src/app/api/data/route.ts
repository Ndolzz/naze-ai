import { NextRequest, NextResponse } from "next/server";
import { resolveSession, clearSessionCookie } from "@/lib/security/session";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { prisma } from "@/lib/database/prisma";

export const runtime = "nodejs";

/**
 * "Hapus data pengguna" (spec §40) — the most destructive control in the
 * app, so it goes further than delete-all-conversations /
 * delete-all-memories: it also removes the Setting row and the User row
 * itself, then drops the session cookie. Cascade deletes on the schema
 * (Conversation/Message → User, onDelete: Cascade) handle the rest.
 * There is deliberately no soft-delete or grace period — the button
 * means what it says.
 */
export async function DELETE(req: NextRequest) {
  const session = await resolveSession(req);

  const rateLimit = checkRateLimit(`${session.userId}:data-delete`);
  if (!rateLimit.ok) {
    return NextResponse.json({ error: "Terlalu banyak permintaan. Coba lagi sebentar lagi." }, { status: 429 });
  }

  await prisma.user.delete({ where: { id: session.userId } }).catch(() => {
    // Already gone (e.g. double-click) — deleting is idempotent either way.
  });
  return clearSessionCookie(NextResponse.json({ ok: true }));
}
