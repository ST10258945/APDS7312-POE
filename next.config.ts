// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  eslint: {
    ignoreDuringBuilds: true,   // ← skip ESLint in CI/Prod
  },
  // Vercel already forces HTTPS for *.vercel.app and your custom domain.
  // We add strong security headers so you can show proof in DevTools.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Enforce HTTPS on repeat visits
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          // Prevent MIME sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Clickjacking protection
          { key: "X-Frame-Options", value: "DENY" },
          // Trim referrers
          { key: "Referrer-Policy", value: "no-referrer" },
          // Lock down powerful APIs (adjust if you actually need one)
          { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
          // Avoid mixed content; auto-upgrade any http resources
          { key: "Content-Security-Policy", value: "upgrade-insecure-requests" },
        ],
      },
    ];
  },
};

export default nextConfig;

