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
  '/api/employee/login',
  '/api/customer/login',
  '/api/customer/register',
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

// --- helpers ---
const isLoginPath = (p: string) =>
  p === '/api/auth/login' || p === '/api/employee/login' || p === '/api/customer/login';

const isMutatingApiPath = (req: NextRequest, p: string) =>
  MUTATING.has(req.method) && p.startsWith('/api/');

function enforceHttps(req: NextRequest, url: URL, isProd: boolean) {
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  if (isProd && proto !== 'https') {
    url.protocol = 'https:';
    return NextResponse.redirect(url, 301);
  }
  return null;
}

function checkCsrf(req: NextRequest, path: string) {
  if (!MUTATING.has(req.method) || CSRF_EXEMPT.has(path)) return null;

  const csrfCookie = req.cookies.get('csrf')?.value;
  const csrfHeader = req.headers.get('x-csrf-token') || req.headers.get('X-CSRF-Token');

  if (process.env.NODE_ENV === 'development') {
    console.log('CSRF Debug:', {
      method: req.method,
      path,
      cookie: csrfCookie ? `${csrfCookie.slice(0, 8)}...` : 'missing',
      header: csrfHeader ? `${csrfHeader.slice(0, 8)}...` : 'missing',
      match: csrfCookie === csrfHeader,
    });
  }

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return new NextResponse('CSRF validation failed', { status: 403 });
  }
  return null;
}

function applySecurityHeaders(res: NextResponse, isProd: boolean) {
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'no-referrer');
  res.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  if (isProd) {
    res.headers.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains; preload');
  }
}

function setCsp(res: NextResponse, isProd: boolean) {
  if (isProd) {
    res.headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "media-src 'self' data: blob:",
        "connect-src 'self'",
        "font-src 'self' data:",
        "frame-src 'none'",
        "manifest-src 'self'",
      ].join('; ')
    );
    return;
  }

  // Dev
  res.headers.set(
    'Content-Security-Policy',
    [
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
    ].join('; ')
  );
}
// --- end helpers ---

export function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const isProd = process.env.NODE_ENV === 'production';
  const path = url.pathname;

  // Disable EMPLOYEE registration always, allow CUSTOMER registration
  if (path === '/api/employee/register' || path === '/api/auth/register') {
    return new NextResponse('Employee registration disabled', { status: 403 });
  }

  // HTTPS enforcement (prod only)
  const httpsRedirect = enforceHttps(req, url, isProd);
  if (httpsRedirect) return httpsRedirect;

  // Rate limit for login
  const ip = getClientIp(req);
  if (isLoginPath(path) && !rateLimit(`login:${ip}`)) {
    return new NextResponse('Too Many Requests', { status: 429, headers: { 'Retry-After': '60' } });
  }

  // General mutating APIs (excluding login)
  if (isMutatingApiPath(req, path) && !isLoginPath(path)) {
    if (!rateLimit(`mut:${ip}`)) {
      return new NextResponse('Too Many Requests', { status: 429, headers: { 'Retry-After': '60' } });
    }
  }

  // CSRF (skip for exempted)
  const csrfFailure = checkCsrf(req, path);
  if (csrfFailure) return csrfFailure;

  // Security headers + CSP
  const res = NextResponse.next();
  applySecurityHeaders(res, isProd);
  setCsp(res, isProd);

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
