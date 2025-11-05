// lib/api-client.ts
// Shared API client for making authenticated requests with CSRF protection

export interface ApiResponse<T = any> {
  ok: boolean
  data?: T
  error?: string
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
export async function apiRequest<T = any>(
  url: string,
  options: RequestInit & { requireCsrf?: boolean } = {}
): Promise<ApiResponse<T>> {
  const { requireCsrf = false, ...fetchOptions } = options

  try {
    // Get CSRF token for mutation requests
    let headers = { ...fetchOptions.headers } as Record<string, string>
    
    if (requireCsrf) {
      const csrfToken = await fetchCsrfToken()
      headers['x-csrf-token'] = csrfToken
    }

    // Ensure JSON content type for POST/PUT/PATCH
    if (fetchOptions.body && typeof fetchOptions.body === 'string') {
      headers['Content-Type'] = 'application/json'
    }

    const res = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: 'include', // Include cookies
    })

    // Try to parse JSON, handle non-JSON responses
    let data: any
    const contentType = res.headers.get('content-type')
    
    if (contentType?.includes('application/json')) {
      try {
        data = await res.json()
      } catch (e) {
        // If JSON parsing fails, return text
        const text = await res.text()
        return {
          ok: false,
          error: `Invalid JSON response: ${text.substring(0, 100)}`,
        }
      }
    } else {
      // Non-JSON response
      const text = await res.text()
      data = { message: text }
    }

    if (!res.ok) {
      return {
        ok: false,
        error: data.error || data.message || `Request failed with status ${res.status}`,
      }
    }

    return {
      ok: true,
      data,
    }
  } catch (error) {
    console.error('API request error:', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: <T = any>(url: string) => apiRequest<T>(url, { method: 'GET' }),
  
  post: <T = any>(url: string, body: any, requireCsrf = true) =>
    apiRequest<T>(url, {
      method: 'POST',
      body: JSON.stringify(body),
      requireCsrf,
    }),
  
  put: <T = any>(url: string, body: any, requireCsrf = true) =>
    apiRequest<T>(url, {
      method: 'PUT',
      body: JSON.stringify(body),
      requireCsrf,
    }),
  
  delete: <T = any>(url: string, requireCsrf = true) =>
    apiRequest<T>(url, {
      method: 'DELETE',
      requireCsrf,
    }),
}
