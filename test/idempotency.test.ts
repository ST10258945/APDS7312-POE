import { rememberRequest } from '../lib/idempotency';

describe('rememberRequest', () => {
  test('miss then write then hit with same body', () => {
    const idemA = rememberRequest('k1', '/r', { a: 1 });
    expect(idemA.hit).toBeNull();

    idemA.write({ ok: true });

    const idemB = rememberRequest('k1', '/r', { a: 1 });
    expect(idemB.hit).not.toBeNull();
    expect(idemB.hit?.responseJson).toEqual({ ok: true });
  });

  test('different body -> no hit', () => {
    const idem = rememberRequest('k2', '/r', { a: 1 });
    idem.write({ ok: true });
    const miss = rememberRequest('k2', '/r', { a: 2 });
    expect(miss.hit).toBeNull();
  });
});
