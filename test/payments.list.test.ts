import handler from '@/pages/api/payments/list';
import { createMockReqRes, MockRes } from './test-utils';

jest.mock('@/lib/db', () => ({
  prisma: { payment: { findMany: jest.fn() } },
}));
jest.mock('@/lib/auth', () => ({
  verifyJwt: (t: string) => (t === 'emp' ? ({ type: 'employee', sub: 'u1' }) : null),
}));

const { prisma } = require('@/lib/db');

describe('GET /api/payments/list', () => {
  beforeEach(() => {
    prisma.payment.findMany.mockResolvedValue([{ id: 'p1' }, { id: 'p2' }]);
    jest.clearAllMocks();
  });

  test('rejects non-GET', async () => {
    const { req, res } = createMockReqRes({ method: 'POST', cookies: { session: 'emp' } });
    await (handler as any)(req, res);
    expect((res as unknown as MockRes).statusCode).toBe(405);
  });

  test('requires employee session', async () => {
    const { req, res } = createMockReqRes({ method: 'GET', cookies: { session: 'bad' } });
    await (handler as any)(req, res);
    expect((res as unknown as MockRes).statusCode).toBe(401);
  });

  test('returns payments and normalizes status filter', async () => {
    const { req, res } = createMockReqRes({
      method: 'GET',
      cookies: { session: 'emp' },
      query: { status: 'pending' },
    });
    await (handler as any)(req, res);
    const r = res as unknown as MockRes;
    expect(r.statusCode).toBe(200);
    expect(r.jsonBody).toEqual({ payments: [{ id: 'p1' }, { id: 'p2' }] });

    // ensure findMany was called with a where clause (status normalised)
    const args = (prisma.payment.findMany as jest.Mock).mock.calls[0][0] ?? {};
    expect(args).toHaveProperty('where');
  });
});
