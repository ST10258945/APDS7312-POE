/**
 * Tests for API client utilities
 */

import { fetchCsrfToken, apiRequest } from '@/lib/api-client'

// Mock fetch globally
globalThis.fetch = jest.fn()

describe('fetchCsrfToken', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch CSRF token successfully', async () => {
    const mockToken = 'test-csrf-token'
    ;(globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ csrfToken: mockToken }),
    })

    const token = await fetchCsrfToken()
    expect(token).toBe(mockToken)
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/csrf', { credentials: 'include' })
  })

  it('should throw error when fetch fails', async () => {
    ;(globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    })

    await expect(fetchCsrfToken()).rejects.toThrow('Could not obtain CSRF token')
  })

  it('should handle network errors', async () => {
    ;(globalThis.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    await expect(fetchCsrfToken()).rejects.toThrow('Could not obtain CSRF token')
  })

  it('should handle JSON parse errors', async () => {
    ;(globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON')
      },
    })

    await expect(fetchCsrfToken()).rejects.toThrow()
  })
})

describe('apiRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('successful requests', () => {
    it('should make a GET request without CSRF', async () => {
      const mockData = { id: 1, name: 'Test' }
      ;(globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      })

      const result = await apiRequest('/api/test')
      expect(result.ok).toBe(true)
      expect(result.data).toEqual(mockData)
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          credentials: 'include',
        })
      )
    })

    it('should make a POST request with CSRF token', async () => {
      const mockCsrfToken = 'csrf-token-123'
      const mockData = { success: true }

      // Mock CSRF token fetch
      ;(globalThis.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ csrfToken: mockCsrfToken }),
        })
        // Mock actual request
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => mockData,
        })

      const result = await apiRequest('/api/test', {
        method: 'POST',
        requireCsrf: true,
        body: JSON.stringify({ test: 'data' }),
      })

      expect(result.ok).toBe(true)
      expect(result.data).toEqual(mockData)
      expect(globalThis.fetch).toHaveBeenCalledTimes(2)
    })

    it('should include custom headers', async () => {
      ;(globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      })

      await apiRequest('/api/test', {
        headers: {
          'Custom-Header': 'value',
        },
      })

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.any(Headers),
        })
      )
    })
  })

  describe('error handling', () => {
    it('should handle 400 Bad Request', async () => {
      ;(globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Bad request' }),
      })

      const result = await apiRequest('/api/test')
      expect(result.ok).toBe(false)
      expect(result.error).toBe('Bad request')
    })

    it('should handle 401 Unauthorized', async () => {
      ;(globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Unauthorized' }),
      })

      const result = await apiRequest('/api/test')
      expect(result.ok).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })

    it('should handle 403 Forbidden', async () => {
      ;(globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Forbidden' }),
      })

      const result = await apiRequest('/api/test')
      expect(result.ok).toBe(false)
      expect(result.error).toBe('Forbidden')
    })

    it('should handle 404 Not Found', async () => {
      ;(globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Not found' }),
      })

      const result = await apiRequest('/api/test')
      expect(result.ok).toBe(false)
      expect(result.error).toBe('Not found')
    })

    it('should handle 429 Rate Limit', async () => {
      ;(globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Too many requests' }),
      })

      const result = await apiRequest('/api/test')
      expect(result.ok).toBe(false)
      expect(result.error).toBe('Too many requests')
    })

    it('should handle 500 Server Error', async () => {
      ;(globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Internal server error' }),
      })

      const result = await apiRequest('/api/test')
      expect(result.ok).toBe(false)
      expect(result.error).toBe('Internal server error')
    })

    it('should handle network errors', async () => {
      ;(globalThis.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'))

      const result = await apiRequest('/api/test')
      expect(result.ok).toBe(false)
      expect(result.error).toContain('Network failure')
    })

    it('should handle JSON parse errors in error response', async () => {
      ;(globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => 'Invalid response',
        json: async () => {
          throw new Error('Invalid JSON')
        },
      })

      const result = await apiRequest('/api/test')
      expect(result.ok).toBe(false)
      expect(result.error).toContain('Invalid JSON response')
    })

    it('should map error to userMessage', async () => {
      ;(globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Network request failed' }),
      })

      const result = await apiRequest('/api/test')
      expect(result.ok).toBe(false)
      expect(result.error).toBe('Network request failed')
      expect(result.userMessage).toBe('Unable to connect to the server. Please check your connection and try again.')
    })
  })

  describe('CSRF token handling', () => {
    it('should not fetch CSRF token when requireCsrf is false', async () => {
      ;(globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      })

      await apiRequest('/api/test', { requireCsrf: false })
      expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    })

    it('should handle CSRF token fetch failure', async () => {
      ;(globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      const result = await apiRequest('/api/test', { requireCsrf: true })
      expect(result.ok).toBe(false)
      expect(result.error).toContain('Could not obtain CSRF token')
    })

    it('should add CSRF token to headers', async () => {
      const mockCsrfToken = 'csrf-token-456'
      ;(globalThis.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ csrfToken: mockCsrfToken }),
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({}),
        })

      await apiRequest('/api/test', { requireCsrf: true })

      const lastCall = (globalThis.fetch as jest.Mock).mock.calls[1]
      const headers = lastCall[1].headers as Headers
      expect(headers.get('X-CSRF-Token')).toBe(mockCsrfToken)
    })
  })

  describe('request options', () => {
    it('should pass through method', async () => {
      ;(globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      })

      await apiRequest('/api/test', { method: 'PUT' })

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'PUT',
        })
      )
    })

    it('should pass through body', async () => {
      const body = JSON.stringify({ test: 'data' })
      ;(globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      })

      await apiRequest('/api/test', { method: 'POST', body })

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          body,
        })
      )
    })

    it('should always include credentials', async () => {
      ;(globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      })

      await apiRequest('/api/test')

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          credentials: 'include',
        })
      )
    })
  })
})
