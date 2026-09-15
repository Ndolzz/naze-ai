import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";

const COOKIE_NAME = "naze_uid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export interface SessionResult {
  userId: string;
  isNew: boolean;
}

/**
 * Resolves the anonymous session behind a request, creating both the
 * backing User row and (via applySessionCookie) the cookie on first
 * visit. This is NOT authentication — spec §41 covers real sign-in in
 * Phase 8. It's just enough identity to scope "your conversations" to
 * one browser until then; when real auth lands, a login attaches to this
 * same User row rather than replacing the mechanism.
 */
export async function resolveSession(req: NextRequest): Promise<SessionResult> {
  const existing = req.cookies.get(COOKIE_NAME)?.value;
  if (existing) {
    const user = await prisma.user.findUnique({ where: { id: existing } });
    if (user) return { userId: user.id, isNew: false };
  }
  const user = await prisma.user.create({ data: {} });
  return { userId: user.id, isNew: true };
}

/** Every route that calls resolveSession must pass its response through
 *  this before returning, or a first-time visitor's cookie never gets
 *  set and a new User row is created on every request. */
export function applySessionCookie(res: NextResponse, session: SessionResult): NextResponse {
  if (session.isNew) {
    res.cookies.set(COOKIE_NAME, session.userId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
  }
  return res;
}

/** Used by "hapus data pengguna" (spec §40): after wiping a user's rows,
 *  also drop the cookie that points at them, so the next request starts
 *  a genuinely fresh session instead of reusing an id with nothing
 *  behind it. */
export function clearSessionCookie(res: NextResponse): NextResponse {
  res.cookies.delete(COOKIE_NAME);
  return res;
}
