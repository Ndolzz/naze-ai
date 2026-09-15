import { NextRequest, NextResponse } from "next/server";
import { resolveSession, applySessionCookie } from "@/lib/security/session";
import {
  getOwnedConversation,
  renameConversation,
  setConversationFlags,
  deleteConversation,
} from "@/lib/database/conversations";

export const runtime = "nodejs";

interface Params {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: Params) {
  const session = await resolveSession(req);
  const conversation = await getOwnedConversation(session.userId, params.id);
  if (!conversation) {
    return applySessionCookie(NextResponse.json({ error: "Percakapan tidak ditemukan." }, { status: 404 }), session);
  }
  return applySessionCookie(NextResponse.json({ conversation }), session);
}

/** Body may include any combination of: { title?, archived?, pinned? } */
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await resolveSession(req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return applySessionCookie(NextResponse.json({ error: "JSON tidak valid." }, { status: 400 }), session);
  }

  const { title, archived, pinned } = body as { title?: unknown; archived?: unknown; pinned?: unknown };

  if (typeof title === "string") {
    const ok = await renameConversation(session.userId, params.id, title);
    if (!ok) {
      return applySessionCookie(NextResponse.json({ error: "Percakapan tidak ditemukan." }, { status: 404 }), session);
    }
  }

  if (typeof archived === "boolean" || typeof pinned === "boolean") {
    const flags: { archived?: boolean; pinned?: boolean } = {};
    if (typeof archived === "boolean") flags.archived = archived;
    if (typeof pinned === "boolean") flags.pinned = pinned;
    const ok = await setConversationFlags(session.userId, params.id, flags);
    if (!ok) {
      return applySessionCookie(NextResponse.json({ error: "Percakapan tidak ditemukan." }, { status: 404 }), session);
    }
  }

  return applySessionCookie(NextResponse.json({ ok: true }), session);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await resolveSession(req);
  const ok = await deleteConversation(session.userId, params.id);
  if (!ok) {
    return applySessionCookie(NextResponse.json({ error: "Percakapan tidak ditemukan." }, { status: 404 }), session);
  }
  return applySessionCookie(NextResponse.json({ ok: true }), session);
}
