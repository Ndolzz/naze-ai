"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Thin client-component wrapper so the server-component RootLayout can
 * still render `<AuthProvider>{children}</AuthProvider>` directly —
 * SessionProvider itself uses React context, which only works in a
 * Client Component. Everything under this (Sidebar's user footer, the
 * login/register pages) reads the session via `useSession()`.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
