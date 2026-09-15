import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PUBLIC_PAGES = new Set(["/login", "/register"]);

/**
 * The single gate for auth (Phase 11). Runs before every route handler
 * and page in the matcher below, so individual routes don't each need
 * their own "are you logged in" check — `resolveSession()` in
 * lib/security/session.ts leans on this already having run.
 *
 * - `/api/auth/*` (Auth.js's own routes) and the two public pages are
 *   always allowed through, logged in or not.
 * - Any other `/api/*` request without a session gets a 401 JSON body —
 *   not a redirect, since a fetch() call has nowhere useful to
 *   navigate to.
 * - Any other page request without a session gets redirected to
 *   /login?callbackUrl=<where they were headed>, so a bookmarked /
 *   shared chat link still lands them where they meant to go after
 *   signing in.
 * - A logged-in user hitting /login or /register gets bounced to /
 *   instead of seeing a sign-in form they don't need.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user?.id;
  const isAuthApi = pathname.startsWith("/api/auth");
  const isPublicPage = PUBLIC_PAGES.has(pathname);
  const isApi = pathname.startsWith("/api/");

  if (isAuthApi) return NextResponse.next();

  if (!isLoggedIn) {
    if (isApi) {
      return NextResponse.json({ error: "Silakan login dahulu." }, { status: 401 });
    }
    if (!isPublicPage) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (isPublicPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  // Everything except static assets and the PWA files (manifest, service
  // worker, icons) — those must stay reachable unauthenticated or the
  // app shell itself fails to install/cache.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icon-192.png|icon-512.png).*)"],
};
