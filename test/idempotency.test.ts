import { rememberRequest } from '@/lib/idempotency';

describe('idempotency rememberRequest', () => {
  test('hit on same route+key+body', () => {
    const r1 = rememberRequest('k', '/api/pay', { a: 1 });
    expect(r1.hit).toBeNull();
    r1.write({ ok: true });

    const r2 = rememberRequest('k', '/api/pay', { a: 1 });
    expect(r2.hit?.responseJson).toEqual({ ok: true });

    const r3 = rememberRequest('k', '/api/pay', { a: 2 });
    expect(r3.hit).toBeNull();
  });
});
