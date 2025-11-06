// lib/api-client.ts
// Shared API client for making authenticated requests with CSRF protection

import { mapErrorToUserMessage } from './error-handling'

export interface ApiResponse<T = unknown> {
  ok: boolean
  data?: T
  error?: string
  userMessage?: string
}

/**
 * Fetch CSRF token from the server
 */
export async function fetchCsrfToken(): Promise<string> {
  try {
    const res = await fetch('/api/csrf', { credentials: 'include' })
    if (!res.ok) throw new Error('Failed to fetch CSRF token')
    const data = await res.json()
    return data.csrfToken
  } catch (error) {
    console.error('CSRF token fetch error:', error)
    throw new Error('Could not obtain CSRF token')
  }
}

/**
 * Make an authenticated API request with CSRF protection
 */
export async function apiRequest<T = unknown>(
  url: string,
  options: RequestInit & { requireCsrf?: boolean } = {}
): Promise<ApiResponse<T>> {
  const { requireCsrf = false, ...fetchOptions } = options

  try {
    // Get CSRF token for mutation requests
    const headers = new Headers(fetchOptions.headers as HeadersInit | undefined)

    if (requireCsrf) {
      const csrfToken = await fetchCsrfToken()
      headers.set('x-csrf-token', csrfToken)
    }

    // Ensure JSON content type for POST/PUT/PATCH
    if (fetchOptions.body && typeof fetchOptions.body === 'string') {
      headers.set('Content-Type', 'application/json')
    }

    const res = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: 'include', // Include cookies
    })

    // Try to parse JSON, handle non-JSON responses
    let data: unknown
    const contentType = res.headers.get('content-type')
    
    if (contentType?.includes('application/json')) {
      try {
        data = (await res.json()) as unknown
      } catch {
        const text = await res.text()
        return {
          ok: false,
          error: `Invalid JSON response: ${text.substring(0, 100)}`,
        }
      }
    } else {
      const text = await res.text()
      data = { message: text }
    }

    if (!res.ok) {
      const body = data as { error?: string; message?: string } | undefined
      const errorMessage = body?.error || body?.message || `Request failed with status ${res.status}`
      const errorMapping = mapErrorToUserMessage(errorMessage)
      return {
        ok: false,
        error: errorMessage,
        userMessage: errorMapping.userMessage,
      }
    }

    return {
      ok: true,
      data: data as T,
    }
  } catch (error) {
    console.error('API request error:', error)
    const errorMapping = mapErrorToUserMessage(error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Network error',
      userMessage: errorMapping.userMessage,
    }
  }
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: <T = unknown>(url: string) => apiRequest<T>(url, { method: 'GET' }),

  post: <T = unknown, TBody = unknown>(url: string, body: TBody, requireCsrf = true) =>
    apiRequest<T>(url, {
      method: 'POST',
      body: JSON.stringify(body),
      requireCsrf,
    }),

  put: <T = unknown, TBody = unknown>(url: string, body: TBody, requireCsrf = true) =>
    apiRequest<T>(url, {
      method: 'PUT',
      body: JSON.stringify(body),
      requireCsrf,
    }),

  delete: <T = unknown>(url: string, requireCsrf = true) =>
    apiRequest<T>(url, {
      method: 'DELETE',
      requireCsrf,
    }),
}
