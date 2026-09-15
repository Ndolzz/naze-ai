import { NextRequest, NextResponse } from "next/server";
import { resolveSession, applySessionCookie } from "@/lib/security/session";
import { updateMemory, deleteMemory, clampImportance } from "@/lib/database/memories";

export const runtime = "nodejs";

interface Params {
  params: { id: string };
}

/** Body may include any combination of: { content?, category?, importance? } */
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await resolveSession(req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return applySessionCookie(NextResponse.json({ error: "JSON tidak valid." }, { status: 400 }), session);
  }

  const { content, category, importance } = body as {
    content?: unknown;
    category?: unknown;
    importance?: unknown;
  };

  const fields: { content?: string; category?: string | null; importance?: number } = {};
  if (typeof content === "string") {
    if (!content.trim()) {
      return applySessionCookie(NextResponse.json({ error: "Isi memori tidak boleh kosong." }, { status: 400 }), session);
    }
    fields.content = content.trim();
  }
  if (typeof category === "string" || category === null) fields.category = category;
  if (typeof importance === "number") fields.importance = clampImportance(importance);

  const ok = await updateMemory(session.userId, params.id, fields);
  if (!ok) {
    return applySessionCookie(NextResponse.json({ error: "Memori tidak ditemukan." }, { status: 404 }), session);
  }
  return applySessionCookie(NextResponse.json({ ok: true }), session);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await resolveSession(req);
  const ok = await deleteMemory(session.userId, params.id);
  if (!ok) {
    return applySessionCookie(NextResponse.json({ error: "Memori tidak ditemukan." }, { status: 404 }), session);
  }
  return applySessionCookie(NextResponse.json({ ok: true }), session);
}
