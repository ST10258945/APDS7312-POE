import type { NextApiResponse } from 'next';
import { issueSessionCookie } from '@/lib/session';

const OLD_ENV = process.env;

function makeRes() {
  const headers: Record<string, string> = {};
  return {
    headers,
    setHeader: (k: string, v: string) => { headers[k] = v; },
  } as unknown as NextApiResponse;
}

describe('issueSessionCookie', () => {
  beforeEach(() => {
    process.env = { ...OLD_ENV, JWT_SECRET: 'test-secret', NODE_ENV: 'test', SESSION_TTL: '45m' };
  });
  afterAll(() => { process.env = OLD_ENV; });

  test('sets HttpOnly session cookie with parsed maxAge from SESSION_TTL', () => {
    const res = makeRes();
    issueSessionCookie(res, { sub: 'abc' });
    const cookie = (res as any).headers['Set-Cookie'] as string;
    expect(cookie).toMatch(/session=/);
    // 45m = 2700 seconds
    expect(cookie).toMatch(/Max-Age=2700/);
    expect(cookie).toMatch(/HttpOnly/);
  });

  test('respects explicit maxAgeSeconds override', () => {
    const res = makeRes();
    issueSessionCookie(res, { sub: 'abc' }, { expiresIn: '30m', maxAgeSeconds: 120 });
    const cookie = (res as any).headers['Set-Cookie'] as string;
    expect(cookie).toMatch(/Max-Age=120/);
  });
});
