import { NextRequest, NextResponse } from "next/server";
import { resolveSession, applySessionCookie } from "@/lib/security/session";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { prisma } from "@/lib/database/prisma";

export const runtime = "nodejs";

/** Everything the app has stored for this session, in one file — not a
 *  summary or a sample. Spec §40: an export button should actually
 *  export, the same way a delete button should actually delete. */
export async function GET(req: NextRequest) {
  const session = await resolveSession(req);

  const rateLimit = checkRateLimit(`${session.userId}:export`);
  if (!rateLimit.ok) {
    return applySessionCookie(
      NextResponse.json({ error: "Terlalu banyak permintaan ekspor. Coba lagi sebentar lagi." }, { status: 429 }),
      session
    );
  }

  const [conversations, memories, settingRow] = await Promise.all([
    prisma.conversation.findMany({
      where: { userId: session.userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.memory.findMany({ where: { userId: session.userId }, orderBy: { createdAt: "asc" } }),
    prisma.setting.findUnique({ where: { userId: session.userId } }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    conversations,
    memories,
    settings: settingRow?.data ?? null,
  };

  const res = new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="naze-data-export.json"`,
    },
  });
  return applySessionCookie(res, session);
}
