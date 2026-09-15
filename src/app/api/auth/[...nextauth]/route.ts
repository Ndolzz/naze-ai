import { handlers } from "@/lib/auth";

// Everything under /api/auth/* — the credentials sign-in POST,
// sign-out, CSRF token, session fetch — all handled by Auth.js itself.
// Nothing in this app calls these directly; next-auth/react's
// signIn()/signOut() hit them from the client.
export const { GET, POST } = handlers;
export const runtime = "nodejs";
