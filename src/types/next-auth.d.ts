import { DefaultSession } from "next-auth";

// Auth.js's default Session["user"] type has no `id` field. Every route
// in this app (chat, conversations, memories, settings, data export)
// keys everything off the database user id, so this augmentation is what
// makes `session.user.id` type-check instead of silently being `any`.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
