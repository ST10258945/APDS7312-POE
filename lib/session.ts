import type { NextApiResponse } from 'next'
import { signJwt } from './auth'

type JwtPayload = Record<string, any>

export function issueSessionCookie(
  res: NextApiResponse,
  payload: JwtPayload,
  opts?: { expiresIn?: string; maxAgeSeconds?: number }
) {
  const isProd = process.env.NODE_ENV === 'production'
  const expiresIn = opts?.expiresIn ?? '30m'
  const maxAge = opts?.maxAgeSeconds ?? 60 * 30 // default 30 min

  const token = signJwt(payload)

  // Defer require to avoid ESM typing friction
  const { serialize } = require('cookie') as typeof import('cookie')

  res.setHeader(
    'Set-Cookie',
    serialize('session', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      path: '/',
      maxAge,
    })
  )
}
