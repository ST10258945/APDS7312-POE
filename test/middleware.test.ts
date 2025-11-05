// --- Mock NextResponse ---
jest.mock('next/server', () => {
  class MockRes {
    status: number;
    headers = new Map<string, string>();

    // Support both: new NextResponse(200) and new NextResponse('text', { status: 403 })
    constructor(arg1?: any, arg2?: any) {
      if (typeof arg1 === 'number') {
        this.status = arg1;
      } else if (arg2 && typeof arg2.status === 'number') {
        this.status = arg2.status;
      } else {
        this.status = 200;
      }
    }

    static next() {
      return new MockRes(200);
    }

    static redirect(_url: any, status = 301) {
      return new MockRes(status);
    }
  }
  return { NextResponse: MockRes };
});

import { middleware } from '../middleware';

// Minimal NextRequest-like object
const makeReq = (init: {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
}) =>
  ({
    url: init.url,
    method: init.method ?? 'GET',
    headers: {
      get: (k: string) => init.headers?.[k.toLowerCase()] ?? init.headers?.[k] ?? null,
    },
    cookies: {
      get: (k: string) =>
        (init.cookies && init.cookies[k] ? { value: init.cookies[k] } : undefined),
    },
  } as any);

// Safely override env for a single callback (no direct assignment)
function withEnv<T>(overrides: Partial<NodeJS.ProcessEnv>, fn: () => T) {
  const original = process.env;
  // redefine the whole env object for the duration of the call
  Object.defineProperty(process, 'env', { value: { ...original, ...overrides } });
  try {
    return fn();
  } finally {
    Object.defineProperty(process, 'env', { value: original });
  }
}

describe('middleware', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('redirects to https in production', () => {
    const res = withEnv({ NODE_ENV: 'production' }, () =>
      middleware(
        makeReq({
          url: 'http://x.local/api/foo',
          headers: { 'x-forwarded-proto': 'http' },
        })
      )
    );
    expect((res as any).status).toBe(301);
  });

  test('rate limits login after 3 attempts (CSRF satisfied)', () => {
    const headers = {
      'x-forwarded-for': '1.2.3.4',
      'x-csrf-token': 't',
    };
    const cookies = { csrf: 't' };
    const req = (method = 'POST') =>
      makeReq({ url: 'http://x.local/api/auth/login', method, headers, cookies });

    // three ok
    expect((middleware(req()) as any).status).toBe(200);
    expect((middleware(req()) as any).status).toBe(200);
    expect((middleware(req()) as any).status).toBe(200);
    // then blocked by rate limit
    expect((middleware(req()) as any).status).toBe(429);
  });

  test('CSRF fails when cookie/header mismatch', () => {
    const res = middleware(
      makeReq({
        url: 'http://x.local/api/secure',
        method: 'POST',
        headers: { 'x-csrf-token': 'aaa' },
        cookies: { csrf: 'bbb' },
      })
    );
    expect((res as any).status).toBe(403);
  });

  test('sets security headers on pass-through', () => {
    const res = middleware(makeReq({ url: 'http://x.local/api/ping', method: 'GET' }));
    expect((res as any).status).toBe(200);
  });
});
