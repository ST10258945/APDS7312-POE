import type { NextApiResponse } from 'next'
import { signJwt } from './auth'
import { serialize } from 'cookie'
import type { SignOptions } from 'jsonwebtoken'

type JwtPayload = Record<string, any>

export function issueSessionCookie(
  res: NextApiResponse,
  payload: JwtPayload,
  opts?: { expiresIn?: SignOptions['expiresIn']; maxAgeSeconds?: number } // ← type matches jsonwebtoken
) {
  const isProd = process.env.NODE_ENV === 'production'
  const expiresIn: SignOptions['expiresIn'] = opts?.expiresIn ?? '30m' // ← string | number per jwt
  const maxAge = opts?.maxAgeSeconds ?? 60 * 30 // 30 minutes

  const token = signJwt(
    { iss: 'bank-portal', aud: 'app', ...payload },
    { expiresIn, algorithm: 'HS256' }
  )

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
