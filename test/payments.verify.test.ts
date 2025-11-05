import handler from '@/pages/api/payments/verify';
import { createMockReqRes, MockRes } from './test-utils';

// Silence logs just for this suite
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterAll(() => {
  (console.error as jest.Mock).mockRestore();
  (console.log as jest.Mock).mockRestore();
});

// prisma mock with auditLog + payment methods used by the handler
jest.mock('@/lib/db', () => ({
  prisma: {
    auditLog: { findFirst: jest.fn(), create: jest.fn() },
    payment: { findUnique: jest.fn(), update: jest.fn() },
  },
}));
const { prisma } = require('@/lib/db');

// Auth: cookie session uses employee token; action token is verified via verifyJwt with { aud:'action-token' }
jest.mock('@/lib/auth', () => ({
  verifyJwt: (token: string, opts?: any) => {
    if (token === 'emp' && !opts) {
      return { type: 'employee', sub: 'u1', employeeId: 'e1' };
    }
    // Action token verification with audience/issuer
    if (token && opts?.aud === 'action-token') {
      return {
        aud: 'action-token',
        iss: 'bank-portal',
        sub: 'u1',
        action: 'VERIFY_PAYMENT',
        jti: 'jti-1',
      };
    }
    return null;
  },
}));

jest.mock('@/lib/audit', () => ({ appendAuditLog: jest.fn().mockResolvedValue(undefined) }));

describe('POST /api/payments/verify', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('rejects non-POST', async () => {
    const { req, res } = createMockReqRes({ method: 'GET' });
    await (handler as any)(req, res);
    expect((res as unknown as MockRes).statusCode).toBe(405);
  });

  test('requires employee session', async () => {
    const { req, res } = createMockReqRes({ method: 'POST', cookies: { session: 'bad' } });
    await (handler as any)(req, res);
    expect((res as unknown as MockRes).statusCode).toBe(401);
  });

  test('requires actionToken and paymentId', async () => {
    const { req, res } = createMockReqRes({ method: 'POST', cookies: { session: 'emp' } });
    await (handler as any)(req, res);
    const r = res as unknown as MockRes;
    expect(r.statusCode).toBe(400);
    expect(r.jsonBody).toEqual({ error: 'Missing required fields' });
  });

  test('verifies when payment exists', async () => {
    // ACTION_TOKEN_ISSUED exists, ACTION_TOKEN_CONSUMED does not
    prisma.auditLog.findFirst
      .mockResolvedValueOnce({ id: 1 })
      .mockResolvedValueOnce(null);

    prisma.payment.findUnique.mockResolvedValueOnce({ id: 'p1', status: 'PENDING' });
    prisma.payment.update.mockResolvedValueOnce({ id: 'p1', status: 'VERIFIED' });

    const { req, res } = createMockReqRes({
      method: 'POST',
      cookies: { session: 'emp' }, // employee session
      body: { actionToken: 'valid-action-token', paymentId: 'p1' },
    });
    await (handler as any)(req, res);
    const r = res as unknown as MockRes;
    expect(r.statusCode).toBe(200);
    expect(r.jsonBody).toEqual({ ok: true, message: 'Payment verified' });
  });

  test('returns 404 if payment not found', async () => {
    prisma.auditLog.findFirst
      .mockResolvedValueOnce({ id: 1 })
      .mockResolvedValueOnce(null);
    prisma.payment.findUnique.mockResolvedValueOnce(null);

    const { req, res } = createMockReqRes({
      method: 'POST',
      cookies: { session: 'emp' },
      body: { actionToken: 'valid-action-token', paymentId: 'nope' },
    });
    await (handler as any)(req, res);
    expect((res as unknown as MockRes).statusCode).toBe(404);
  });
});
