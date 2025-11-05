import handler from '@/pages/api/csrf';
import type { NextApiRequest, NextApiResponse } from 'next';

function mockRes() {
  const headers: Record<string, string> = {};
  return {
    setHeader: (k: string, v: string) => { headers[k] = v; },
    status(code: number) { (this as any).statusCode = code; return this; },
    json(body: any) { (this as any).body = body; return this; },
    get headers() { return headers; },
  } as unknown as NextApiResponse & { headers: Record<string, string>; body: any; statusCode: number };
}

describe('csrf handler', () => {
  test('returns token and sets csrf cookie', () => {
    const req = {} as NextApiRequest;
    const res = mockRes();
    handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body?.token).toMatch(/^[a-f0-9]{64}$/);
    expect(res.headers['Set-Cookie']).toMatch(/csrf=/);
  });
});
