/**
 * Fixed-window rate limiter, per IP, in process memory.
 *
 * Honest limitation: this resets whenever the serverless function cold
 * starts and does NOT share state across multiple instances, so on
 * Vercel it's a soft speed bump, not a real abuse guarantee. It's
 * enough to stop a runaway client loop during development. For a real
 * production limit, swap this file's internals for Upstash Redis (or
 * similar) — everything that calls `checkRateLimit` stays the same.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;

const hits = new Map<string, { count: number; windowStart: number }>();

export function checkRateLimit(key: string): { ok: true } | { ok: false; retryAfterMs: number } {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    hits.set(key, { count: 1, windowStart: now });
    return { ok: true };
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return { ok: false, retryAfterMs: WINDOW_MS - (now - entry.windowStart) };
  }

  entry.count += 1;
  return { ok: true };
}
