import type { NextApiRequest, NextApiResponse } from 'next'
import { randomBytes } from 'node:crypto'
import { serialize } from 'cookie'

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const token = randomBytes(32).toString('hex')
  const isProd = process.env.NODE_ENV === 'production'

  res.setHeader('Set-Cookie', serialize('csrf', token, {
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax', // Allow Postman testing in dev
    path: '/',
    maxAge: 60 * 30, // 30 min
    httpOnly: false, // Allow reading in client for API testing
  }))
  res.status(200).json({ csrfToken: token })
}
