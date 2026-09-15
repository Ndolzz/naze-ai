import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/database/prisma";
import { checkRateLimit } from "@/lib/security/rateLimit";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Creates an email/password account. This is the one auth-related route
 * that intentionally sits *outside* the Auth.js handlers — the adapter
 * only manages OAuth accounts, so a Credentials-based sign-up has to be
 * our own code. After this returns 200, the client calls
 * signIn("credentials", ...) itself; this route only creates the row.
 */
export async function POST(req: NextRequest) {
  // Rate limited by IP-ish key (best-effort, see rateLimit.ts's own
  // documented limits) so this can't be hammered to enumerate emails or
  // spam-create accounts.
  const rateLimit = checkRateLimit(`register:${req.headers.get("x-forwarded-for") ?? "unknown"}`);
  if (!rateLimit.ok) {
    return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi sebentar lagi." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Isi permintaan bukan JSON yang valid." }, { status: 400 });
  }

  const { email, password, name } = (body ?? {}) as {
    email?: unknown;
    password?: unknown;
    name?: unknown;
  };

  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Email tidak valid." }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Password minimal 8 karakter." }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    // Deliberately vague — doesn't reveal *which* sign-in method the
    // existing account uses.
    return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email: normalizedEmail,
      password: passwordHash,
      name: typeof name === "string" && name.trim() ? name.trim() : null,
    },
  });

  return NextResponse.json({ ok: true });
}
