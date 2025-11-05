import type { NextApiRequest, NextApiResponse } from 'next';

export type MockRes = {
  statusCode: number;
  headers: Record<string, string>;
  jsonBody?: unknown;

  setHeader: (name: string, value: string | number | readonly string[]) => NextApiResponse;
  status: (code: number) => NextApiResponse;
  json: (payload: any) => NextApiResponse;
};

export function createMockReqRes(opts: {
  method: string;
  body?: any;
  query?: any;
  cookies?: Record<string, string>;
  headers?: Record<string, string>;
}) {
  const { method, body, query, cookies, headers: inHeaders } = opts;

  const headers: Record<string, string> = {};

  const res = {
    statusCode: 200,
    headers,

    setHeader(name: string, value: string | number | readonly string[]) {
      headers[name] = Array.isArray(value) ? value.join(', ') : String(value);
      return this as unknown as NextApiResponse;
    },
    status(code: number) {
      (this as unknown as MockRes).statusCode = code;
      return this as unknown as NextApiResponse;
    },
    json(payload: any) {
      (this as unknown as MockRes).jsonBody = payload;
      return this as unknown as NextApiResponse;
    },
  } as unknown as NextApiResponse & MockRes;

  const req = {
    method,
    body,
    query: query ?? {},
    cookies: cookies ?? {},
    headers: inHeaders ?? {},
    socket: { remoteAddress: '127.0.0.1' } as any,
  } as unknown as NextApiRequest;

  return { req, res };
}
