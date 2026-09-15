import { NextRequest, NextResponse } from "next/server";
import { resolveSession, applySessionCookie } from "@/lib/security/session";
import { searchConversations } from "@/lib/database/conversations";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await resolveSession(req);
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const results = await searchConversations(session.userId, q);
  return applySessionCookie(NextResponse.json({ results }), session);
}
