/**
 * Tests for logout API endpoint
 */

import { NextApiRequest, NextApiResponse } from 'next'
import handler from '@/pages/api/logout'

describe('/api/logout', () => {
  let req: Partial<NextApiRequest>
  let res: Partial<NextApiResponse>
  let statusCode: number
  let headers: Record<string, string | string[]>
  let ended: boolean

  beforeEach(() => {
    statusCode = 200
    headers = {}
    ended = false

    req = {
      method: 'POST',
    }

    res = {
      status: jest.fn((code: number) => {
        statusCode = code
        return res as NextApiResponse
      }),
      setHeader: jest.fn((name: string, value: string | string[]) => {
        headers[name] = value
        return res as NextApiResponse
      }),
      end: jest.fn(() => {
        ended = true
        return res as NextApiResponse
      }),
    }
  })

  it('should clear session cookie on POST', () => {
    handler(req as NextApiRequest, res as NextApiResponse)

    expect(res.setHeader).toHaveBeenCalledWith(
      'Set-Cookie',
      expect.stringContaining('session=')
    )
    expect(res.setHeader).toHaveBeenCalledWith(
      'Set-Cookie',
      expect.stringContaining('Max-Age=0')
    )
    expect(res.setHeader).toHaveBeenCalledWith(
      'Set-Cookie',
      expect.stringContaining('HttpOnly')
    )
    expect(res.setHeader).toHaveBeenCalledWith(
      'Set-Cookie',
      expect.stringContaining('SameSite=Strict')
    )
    expect(statusCode).toBe(204)
    expect(ended).toBe(true)
  })

  it('should handle environment-based secure flag', () => {
    // In test environment, secure flag behavior depends on NODE_ENV
    // This test verifies the cookie is set with appropriate flags
    handler(req as NextApiRequest, res as NextApiResponse)

    const setCookieCall = (res.setHeader as jest.Mock).mock.calls.find(
      (call) => call[0] === 'Set-Cookie'
    )
    
    // Cookie should always have HttpOnly and SameSite
    expect(setCookieCall[1]).toContain('HttpOnly')
    expect(setCookieCall[1]).toContain('SameSite=Strict')
    expect(setCookieCall[1]).toContain('Max-Age=0')
    
    // Secure flag depends on NODE_ENV (production = true, others = false)
    if (process.env.NODE_ENV === 'production') {
      expect(setCookieCall[1]).toContain('Secure')
    }
  })

  it('should reject non-POST requests', () => {
    req.method = 'GET'

    handler(req as NextApiRequest, res as NextApiResponse)

    expect(statusCode).toBe(405)
    expect(ended).toBe(true)
    expect(res.setHeader).not.toHaveBeenCalled()
  })

  it('should reject PUT requests', () => {
    req.method = 'PUT'

    handler(req as NextApiRequest, res as NextApiResponse)

    expect(statusCode).toBe(405)
    expect(ended).toBe(true)
  })

  it('should reject DELETE requests', () => {
    req.method = 'DELETE'

    handler(req as NextApiRequest, res as NextApiResponse)

    expect(statusCode).toBe(405)
    expect(ended).toBe(true)
  })
})
