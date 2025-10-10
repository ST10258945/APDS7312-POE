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
  const isProd = process.env.NODE_ENV === 'production'

  if (process.env.NODE_ENV === 'production') {
    const proto = req.headers.get('x-forwarded-proto')
    if (proto && proto !== 'https') {
      return NextResponse.redirect(`https://${url.host}${url.pathname}${url.search}`, 301)
    }
  }

  // 2) Basic rate limit (per IP)
  const ip = getClientIp(req)
  const path = url.pathname
if (path === '/api/employee/login' || path === '/api/customer/login') {
  if (!rateLimit(`login:${ip}`)) {
    return new NextResponse('Too Many Requests', { status: 429, headers: { 'Retry-After': '60' } })
  }
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
if (isProd) {
    // Strict CSP for production (what you already had)
    res.headers.set('Content-Security-Policy', [
      "default-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "connect-src 'self'",
      "font-src 'self' data:",
      "frame-src 'none'",
      "manifest-src 'self'",
    ].join('; '))
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  } else {
    // Relax CSP for development so Next.js dev client can run
    res.headers.set('Content-Security-Policy', [
      "default-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "connect-src 'self' ws: http://localhost:3000 http://127.0.0.1:3000",
      "font-src 'self' data:",
      "frame-src 'none'",
      "manifest-src 'self'",
    ].join('; '))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
