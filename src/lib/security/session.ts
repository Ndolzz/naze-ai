import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export interface SessionResult {
  userId: string;
}

/**
 * Resolves the signed-in user behind a request. Real auth now
 * (email/password via Auth.js, Phase 11) — `middleware.ts` already blocks
 * every unauthenticated request to `/api/*` (except `/api/auth/*`)
 * before it reaches a route handler, so by the time this runs `auth()`
 * is guaranteed to return a session. The throw below is a defensive
 * backstop for that invariant, not the primary gate — if it ever fires,
 * the bug is in `middleware.ts`'s matcher, not here.
 *
 * Kept as an async function taking an optional (now-unused) `req`
 * parameter so none of the ~10 route handlers that call
 * `resolveSession(req)` needed to change.
 */
export async function resolveSession(_req?: NextRequest): Promise<SessionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error(
      "resolveSession() called with no authenticated session — an unauthenticated request reached a route handler. Check middleware.ts's matcher."
    );
  }
  return { userId: session.user.id };
}

/**
 * No-ops now. Session state lives entirely in the Auth.js JWT cookie,
 * which NextAuth's own /api/auth/* handlers set — nothing else needs to
 * touch it. Kept (rather than deleted) purely so the existing
 * `applySessionCookie(res, session)` / `clearSessionCookie(res)` calls
 * sprinkled across the API routes keep compiling unchanged.
 */
export function applySessionCookie(res: NextResponse, _session?: SessionResult): NextResponse {
  return res;
}

export function clearSessionCookie(res: NextResponse): NextResponse {
  return res;
}
