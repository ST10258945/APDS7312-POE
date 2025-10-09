// middleware.ts
import { NextResponse, NextRequest } from 'next/server'
import { rateLimit } from './lib/rateLimit'

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/** Best-effort IP extractor for middleware (works locally and behind proxies/CDNs) */
function getClientIp(req: NextRequest): string {
  const h = req.headers
  const xff = h.get('x-forwarded-for')      // may contain a comma-separated list
  const cf = h.get('cf-connecting-ip')      // Cloudflare
  const xr = h.get('x-real-ip')             // Nginx/Ingress
  const xv = h.get('x-vercel-ip')           // Vercel
  const cand = xff?.split(',')[0]?.trim() || cf || xr || xv
  return cand || 'unknown'
}

export function middleware(req: NextRequest) {
  const url = new URL(req.url)

  if (process.env.NODE_ENV === 'production') {
    const proto = req.headers.get('x-forwarded-proto')
    if (proto && proto !== 'https') {
      return NextResponse.redirect(`https://${url.host}${url.pathname}${url.search}`, 301)
    }
  }

  // 2) Basic rate limit (per IP)
  const ip = getClientIp(req)
  if (!rateLimit(ip)) {
    return new NextResponse('Too Many Requests', { status: 429, headers: { 'Retry-After': '60' } })
  }

  // 3) CSRF gate
  if (MUTATING.has(req.method)) {
    const csrfCookie = req.cookies.get('csrf')?.value
    const csrfHeader = req.headers.get('x-csrf-token')
    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      return new NextResponse('CSRF validation failed', { status: 403 })
    }
  }

  // 4) Security headers
  const res = NextResponse.next()
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'no-referrer')
  res.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  
  // CSP (tighten/relax if you use CDNs or inline scripts)
res.headers.set(
  'Content-Security-Policy',
  [
    "default-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "script-src 'self'",            // if you have inline scripts, switch to nonce-based CSP
    "style-src 'self' 'unsafe-inline'", // keep if you rely on inline styles / Tailwind style tags
    "img-src 'self' data:",
    "connect-src 'self'",
    "font-src 'self' data:",
    "frame-src 'none'",
    "manifest-src 'self'"
  ].join('; ')
)

// HSTS (only in prod, and only when you’re actually serving HTTPS)
if (process.env.NODE_ENV === 'production') {
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
}
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
