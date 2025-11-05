import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const cspDirectives = [
  "default-src 'self'",
  // In dev, DO NOT upgrade to https or you’ll break localhost.
  // In prod, we’ll add upgrade-insecure-requests below.
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
];

if (isProd) cspDirectives.push("upgrade-insecure-requests");

const csp = cspDirectives.join("; ");

const nextConfig: NextConfig = {
  // Disable strict mode to suppress hydration warnings from browser password managers
  reactStrictMode: false,
  // Let Next build proceed even if ESLint errors exist (lint still runs separately in CI)
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Only send HSTS in prod (it breaks localhost)
          ...(isProd
            ? [{ key: "Strict-Transport-Security", value: "max-age=15552000; includeSubDomains" }]
            : []),
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
