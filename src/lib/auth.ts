import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/database/prisma";

/**
 * Auth.js (NextAuth v5) — free, open-source, no user-count ceiling
 * (unlike Clerk/Supabase Auth's free tiers). Email/password only: no
 * OAuth provider, so no adapter and no third-party service (Google
 * Cloud, GitHub) in the loop at all — account creation is entirely our
 * own /api/auth/register route, which is the only place passwords get
 * hashed (bcrypt) or checked.
 *
 * Session strategy is JWT — required by Auth.js for Credentials
 * providers, since there's no server-side session row to check a
 * password against. The cookie is signed/encrypted with AUTH_SECRET.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    // Runs on sign-in and on every subsequent request that reads the JWT.
    // `user` is only defined on the initial sign-in call, so this is the
    // one place the database id gets copied onto the token.
    async jwt({ token, user }) {
      if (user?.id) token.uid = user.id;
      return token;
    },
    // Copies the id back off the token onto the session object that
    // `auth()` / `useSession()` return, so every call site can read
    // `session.user.id` the same way the old anonymous cookie exposed
    // `session.userId`.
    async session({ session, token }) {
      if (session.user && typeof token.uid === "string") {
        session.user.id = token.uid;
      }
      return session;
    },
  },
});
