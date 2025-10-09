let cachedToken: string | null = null

async function getCsrfToken(): Promise<string> {
  if (cachedToken) return cachedToken
  const res = await fetch('/api/csrf', { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to get CSRF token')
  const { token } = await res.json()
  cachedToken = token
  return token
}

/**
 * A fetch wrapper that automatically fetches + attaches the CSRF token
 * and always sends cookies (HttpOnly session).
 */
export async function csrfFetch(input: RequestInfo, init: RequestInit = {}) {
  const token = await getCsrfToken()
  const headers = new Headers(init.headers || {})
  headers.set('Content-Type', 'application/json')
  headers.set('X-CSRF-Token', token)

  return fetch(input, {
    ...init,
    headers,
    credentials: 'include', // IMPORTANT: send cookies
  })
}

/* clear cached token on logout */
export function clearCsrfCache() {
  cachedToken = null
}
