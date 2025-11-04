// middleware.ts
import { NextResponse, NextRequest } from 'next/server'
import { rateLimit } from './lib/rateLimit'

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
// Exempt CSRF for endpoints that must be callable without a prior CSRF fetch.
// If you prefer full CSRF, remove '/api/employee/admin/create' from this set
// and include x-csrf-token in Postman.
const CSRF_EXEMPT = new Set([
  '/api/csrf',
  '/api/employee/admin/create',
])

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

  // Globally disable any registration endpoints (to satisfy point 1)
  if (
    url.pathname.startsWith('/api/') &&
    url.pathname.includes('register') &&
    process.env.ALLOW_REGISTRATION !== 'true'
  ) {
    return new NextResponse('Registration disabled', { status: 403 })
  }

  // 1) Enforce HTTPS in all envs (so local demo also shows SSL)
  const proto = req.headers.get('x-forwarded-proto') || 'http'
  if (proto !== 'https') {
    url.protocol = 'https:'
    return NextResponse.redirect(url, 301)
  }

  // 2) Basic rate limit (per IP) for login endpoints
  const ip = getClientIp(req)
  const path = url.pathname
  
  if (path === '/api/auth/login' || path === '/api/employee/login' || path === '/api/customer/login') {
    if (!rateLimit(`login:${ip}`)) {
      return new NextResponse('Too Many Requests', { status: 429, headers: { 'Retry-After': '60' } })
    }
  }

  // General limiter for ALL mutating API calls (POST/PUT/PATCH/DELETE)
  // Exclude login paths to avoid double limiting
  if (
    MUTATING.has(req.method) &&
    path.startsWith('/api/') &&
    path !== '/api/auth/login' &&
    path !== '/api/employee/login' &&
    path !== '/api/customer/login'
  ) {
    if (!rateLimit(`mut:${ip}`)) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': '60' }
      })
    }
  }

  // 3) CSRF gate (skip for safe methods and exempted paths)
  if (MUTATING.has(req.method) && !CSRF_EXEMPT.has(path)) {
    const csrfCookie = req.cookies.get('csrf')?.value
    const csrfHeader = req.headers.get('x-csrf-token') || req.headers.get('X-CSRF-Token')

    if (process.env.NODE_ENV === 'development') {
      console.log('CSRF Debug:', {
        method: req.method,
        path,
        cookie: csrfCookie ? `${csrfCookie.slice(0, 8)}...` : 'missing',
        header: csrfHeader ? `${csrfHeader.slice(0, 8)}...` : 'missing',
        match: csrfCookie === csrfHeader
      })
    }

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

  // HSTS whenever we are on HTTPS (good for rubric & demo)
  res.headers.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains; preload')

  // CSP
  if (isProd) {
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
  } else {
    // Allow Next dev client + your HTTPS proxy on 3443
    res.headers.set('Content-Security-Policy', [
      "default-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "connect-src 'self' ws: http://localhost:3000 http://127.0.0.1:3000 https://localhost:3443",
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
