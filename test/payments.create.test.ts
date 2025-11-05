import handler from '@/pages/api/payments/create';
import { createMockReqRes, MockRes } from './test-utils';

// Silence noisy logs for this suite only
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterAll(() => {
  (console.error as jest.Mock).mockRestore();
  (console.log as jest.Mock).mockRestore();
});

jest.mock('@/lib/db', () => ({
  prisma: {
    customer: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'cust1',
        status: 'ACTIVE',
        fullName: 'Alice Smith',
        username: 'alice',
      }),
    },
    payment: {
      // Return a realistic created payment including customer and createdAt
      create: jest.fn().mockImplementation(async ({ data }: any) => ({
        id: 'p_123',
        transactionId: data.transactionId,
        amount: data.amount,
        currency: data.currency,
        provider: data.provider,
        recipientName: data.recipientName,
        recipientAccount: data.recipientAccount,
        swiftCode: data.swiftCode,
        paymentReference: data.paymentReference ?? null,
        status: data.status ?? 'PENDING',
        createdAt: new Date(),
        customer: {
          fullName: 'Alice Smith',
          username: 'alice',
        },
      })),
    },
    auditLog: { create: jest.fn() },
  },
}));

jest.mock('@/lib/audit', () => ({ appendAuditLog: jest.fn().mockResolvedValue(undefined) }));

jest.mock('@/lib/idempotency', () => {
  const mem = new Map<string, any>();
  return {
    rememberRequest: (k: string, route: string, body: any) => {
      const key = `${route}:${k}:${JSON.stringify(body)}`;
      const hit = mem.get(key) || null;
      return { hit, write: (json: any) => mem.set(key, { responseJson: json }) };
    },
  };
});

// For /payments/create we need a **customer** session; cookie session: 'cust'
jest.mock('@/lib/auth', () => ({
  verifyJwt: (t: string) =>
    t === 'cust'
      ? ({ type: 'customer', sub: 'cust1' })
      : t === 'emp'
      ? ({ type: 'employee', sub: 'u1' })
      : null,
}));

describe('POST /api/payments/create', () => {
  test('rejects non-POST', async () => {
    const { req, res } = createMockReqRes({ method: 'GET' });
    await (handler as any)(req, res);
    expect((res as unknown as MockRes).statusCode).toBe(405);
  });

  test('validates input and returns 400 on bad fields', async () => {
    const { req, res } = createMockReqRes({
      method: 'POST',
      cookies: { session: 'cust' }, // customer session
      body: {
        amount: '0.00', // invalid (>0 required)
        currency: 'xxx', // invalid ISO code
        provider: '???',
        recipientName: '',
        recipientAccount: 'abc',
        swiftCode: '123',
        paymentReference: 'inv@1',
      },
    });
    await (handler as any)(req, res);
    const r = res as unknown as MockRes;
    expect(r.statusCode).toBe(400);
    expect(r.jsonBody).toMatchObject({
      error: 'Missing required fields',
      details: expect.any(String),
    });
  });

  test('idempotency: first create is 201, replay is 200 with same payment id', async () => {
    const body = {
      amount: '10.50',
      currency: 'USD',
      provider: 'Wise',
      recipientName: 'Alice',
      recipientAccount: '12345678',
      swiftCode: 'ABCDEF12',
      paymentReference: 'INV-1001',
    };

    // First request (should create): 201
    const first = createMockReqRes({
      method: 'POST',
      cookies: { session: 'cust' },
      headers: { 'idempotency-key': 'IK-1' }, // header (not body)
      body,
    });
    await (handler as any)(first.req, first.res);
    const r1 = first.res as unknown as MockRes;
    expect(r1.statusCode).toBe(201);
    expect(r1.jsonBody).toMatchObject({
      message: expect.any(String),
      payment: { id: expect.any(String) },
    });
    const firstPaymentId = (r1.jsonBody as any).payment.id;

    // Second request with same idempotency key (should replay): 200
    const second = createMockReqRes({
      method: 'POST',
      cookies: { session: 'cust' },
      headers: { 'idempotency-key': 'IK-1' },
      body,
    });
    await (handler as any)(second.req, second.res);
    const r2 = second.res as unknown as MockRes;
    expect(r2.statusCode).toBe(200); // replay returns 200 in your handler
    expect(r2.jsonBody).toMatchObject({
      message: expect.any(String),
      payment: { id: expect.any(String) },
    });
    const secondPaymentId = (r2.jsonBody as any).payment.id;
    expect(secondPaymentId).toBe(firstPaymentId);
  });

  test('happy path inserts payment and audits', async () => {
    const body = {
      amount: '999.99',
      currency: 'EUR',
      provider: 'Wise',
      recipientName: 'Bob',
      recipientAccount: '12345678',
      swiftCode: 'ABCDEFGH',
      paymentReference: 'PAY-1',
    };
    const { req, res } = createMockReqRes({
      method: 'POST',
      cookies: { session: 'cust' },
      headers: { 'idempotency-key': 'IK-2' },
      body,
    });
    await (handler as any)(req, res);
    const r = res as unknown as MockRes;
    expect(r.statusCode).toBe(201);
    expect(r.jsonBody).toMatchObject({
      message: expect.any(String),
      payment: { id: expect.any(String) },
    });
  });
});