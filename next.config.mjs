/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Generated images (Phase 6) are always served from Pollinations at a
    // fixed 1024x1024 — this is the only external image host the app
    // actually renders through next/image, so it's the only one allowed.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.pollinations.ai",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Clickjacking: never allow this app to be framed by another site.
          { key: "X-Frame-Options", value: "DENY" },
          // Stop browsers guessing content-types away from what's declared.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Don't leak the full URL (which can contain a conversation id)
          // to third-party sites via the Referer header on outbound links.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Intentionally no Permissions-Policy restricting microphone —
          // Naze Call (Phase 7) needs it, and this app has no iframes that
          // would need it scoped away from.
        ],
      },
    ];
  },
};

export default nextConfig;
