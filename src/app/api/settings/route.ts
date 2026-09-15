import { NextRequest, NextResponse } from "next/server";
import { resolveSession, applySessionCookie } from "@/lib/security/session";
import { getSettings, updateSettings } from "@/lib/database/settings";
import { checkRateLimit } from "@/lib/security/rateLimit";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await resolveSession(req);
  const settings = await getSettings(session.userId);
  return applySessionCookie(NextResponse.json({ settings }), session);
}

export async function PATCH(req: NextRequest) {
  const session = await resolveSession(req);

  const rateLimit = checkRateLimit(`${session.userId}:settings`);
  if (!rateLimit.ok) {
    return applySessionCookie(
      NextResponse.json({ error: "Terlalu banyak perubahan pengaturan dalam waktu singkat." }, { status: 429 }),
      session
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return applySessionCookie(NextResponse.json({ error: "JSON tidak valid." }, { status: 400 }), session);
  }

  const settings = await updateSettings(session.userId, body);
  return applySessionCookie(NextResponse.json({ settings }), session);
}
