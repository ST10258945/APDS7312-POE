/**
 * Minimal tests for /api/customer/register endpoint
 */
import { NextApiRequest, NextApiResponse } from 'next'
import handler from '@/pages/api/customer/register'

describe('/api/customer/register (minimal)', () => {
  let req: Partial<NextApiRequest>
  let res: Partial<NextApiResponse>
  let statusCode = 200
  let body: unknown

  beforeEach(() => {
    statusCode = 200
    body = undefined
    req = { method: 'GET' }
    res = {
      status: jest.fn((code: number) => {
        statusCode = code
        return res as NextApiResponse
      }),
      json: jest.fn((data: unknown) => {
        body = data
        return res as NextApiResponse
      }),
    }
  })

  it('rejects non-POST requests with 405', async () => {
    await handler(req as NextApiRequest, res as NextApiResponse)
    expect(statusCode).toBe(405)
    expect(body).toEqual({ error: 'Method not allowed' })
  })

  it('rejects when registration disabled (default)', async () => {
    req.method = 'POST'
    req.body = {}

    await handler(req as NextApiRequest, res as NextApiResponse)
    expect(statusCode).toBe(403)
    expect(body).toEqual({ error: 'Registration disabled' })
  })
})
