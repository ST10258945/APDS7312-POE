import type { NextApiRequest, NextApiResponse } from 'next'
import { serialize } from 'cookie'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const isProd = process.env.NODE_ENV === 'production'
  res.setHeader('Set-Cookie', serialize('session', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: 0, // delete immediately
  }))

  res.status(204).end()
}
