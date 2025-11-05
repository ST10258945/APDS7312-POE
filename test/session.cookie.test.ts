import type { NextApiResponse } from 'next';
import { issueSessionCookie } from '../lib/session';

jest.mock('../lib/auth', () => ({
  signJwt: () => 'mock.jwt.token'
}));

function makeRes() {
  const headers: Record<string, string | string[]> = {};
  const res = {
    setHeader: (k: string, v: string | string[]) => { headers[k] = v; }
  } as unknown as NextApiResponse;
  return { res, headers };
}

describe('issueSessionCookie', () => {
  test('parses expiresIn like "30m" to Max-Age=1800', () => {
    const { res, headers } = makeRes();
    issueSessionCookie(res, { sub: '123' }, { expiresIn: '30m' });
    const cookie = String(headers['Set-Cookie']);
    expect(cookie).toContain('session=');
    expect(cookie).toContain('Max-Age=1800');
  });

  test('numeric expiresIn uses value directly', () => {
    const { res, headers } = makeRes();
    issueSessionCookie(res, { sub: 'abc' }, { expiresIn: 45 });
    const cookie = String(headers['Set-Cookie']);
    expect(cookie).toContain('Max-Age=45');
  });
});
