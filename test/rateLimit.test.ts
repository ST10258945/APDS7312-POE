import { rateLimit } from '@/lib/rateLimit';

describe('rateLimit', () => {
  const key = 'user:1';

  test('allows up to capacity and then blocks', () => {
    expect(rateLimit(key)).toBe(true);
    expect(rateLimit(key)).toBe(true);
    expect(rateLimit(key)).toBe(true);
    expect(rateLimit(key)).toBe(false);
  });

  test('refills over time', () => {
    const now = Date.now();
    const spy = jest.spyOn(Date, 'now');
    spy.mockReturnValue(now);
    // consume one
    expect(rateLimit('refill')).toBe(true);
    // advance a minute
    spy.mockReturnValue(now + 60_000);
    expect(rateLimit('refill')).toBe(true); // should be refilled
    spy.mockRestore();
  });
});
