import { rateLimit } from '../lib/rateLimit';

describe('rateLimit', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-01T00:00:00Z'));
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  test('caps at capacity then refills after window', () => {
    const key = 'ip:1.2.3.4';
    expect(rateLimit(key)).toBe(true);
    expect(rateLimit(key)).toBe(true);
    expect(rateLimit(key)).toBe(true);
    expect(rateLimit(key)).toBe(false); // exhausted

    // advance one full window (60s) - enough to refill back to capacity
    jest.advanceTimersByTime(60_000);
    expect(rateLimit(key)).toBe(true);
  });
});
