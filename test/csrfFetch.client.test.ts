import { csrfFetch, clearCsrfCache } from '@/lib/csrfFetch'

declare const global: any;

describe('csrfFetch', () => {
  beforeEach(() => {
    clearCsrfCache();
    jest.restoreAllMocks();
  });

  test('fetches CSRF token then attaches headers', async () => {
    const token = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

    const fetchMock = jest.fn()
      // 1) first call: GET /api/csrf
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token }),
      } as Response)
      // 2) second call: the actual request with headers attached
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      } as Response);

    global.fetch = fetchMock;

    const res = await csrfFetch('/api/somewhere', { method: 'POST', body: JSON.stringify({ x: 1 }) });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // First call is to /api/csrf
    expect(fetchMock.mock.calls[0][0]).toBe('/api/csrf');

    // Second call must include headers and credentials
    const [, secondInit] = fetchMock.mock.calls[1];
    const headers = new Headers(secondInit!.headers as HeadersInit);
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('X-CSRF-Token')).toBe(token);
    expect(secondInit!.credentials).toBe('include');

    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  test('reuses cached token (no second /api/csrf call)', async () => {
    const token = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

    const fetchMock = jest.fn()
      // first run: priming token
      .mockResolvedValueOnce({ ok: true, json: async () => ({ token }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: 1 }) } as Response);

    global.fetch = fetchMock;

    // first call (primes the cache)
    await csrfFetch('/api/a', { method: 'POST' });

    // reset for the second round to verify it doesnt hit /api/csrf again
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: 2 }) } as Response);
    await csrfFetch('/api/b', { method: 'POST' });

    // should have only one /api/csrf call across both requests
    const csrfCalls = fetchMock.mock.calls.filter((c: any[]) => c[0] === '/api/csrf').length;
    expect(csrfCalls).toBe(1);
  });

  test('throws if /api/csrf fails', async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce({ ok: false } as Response);
    global.fetch = fetchMock;

    await expect(csrfFetch('/api/any', { method: 'POST' })).rejects.toThrow('Failed to get CSRF token');
  });
});
