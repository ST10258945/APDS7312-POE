import type { NextApiResponse } from 'next'
import { signJwt } from './auth'
import { serialize } from 'cookie'
import type { SignOptions } from 'jsonwebtoken'

type JwtPayload = {
  sub?: string
  iss?: string | string[]
  aud?: string | string[]
  [key: string]: unknown
}

/** Minimal parser: supports "30m", "8h", "1d", numeric seconds, or "1800" */
function parseDurationToSeconds(input: SignOptions['expiresIn']): number {
  if (typeof input === 'number') return input
  if (!input) return 1800
  const re = /^(\d+)\s*([smhd])?$/i
  const m = re.exec(String(input).trim())
  if (!m) return 1800
  const n = Number.parseInt(m[1], 10)
  const unit = (m[2] || 's').toLowerCase()
  switch (unit) {
    case 's': return n
    case 'm': return n * 60
    case 'h': return n * 60 * 60
    case 'd': return n * 60 * 60 * 24
    default: return n
  }
}

export function issueSessionCookie(
  res: NextApiResponse,
  payload: JwtPayload,
  opts?: { expiresIn?: SignOptions['expiresIn']; maxAgeSeconds?: number } // type matches jsonwebtoken
) {
  const isProd = process.env.NODE_ENV === 'production'

  const ttl: SignOptions['expiresIn'] =
    opts?.expiresIn ?? (process.env.SESSION_TTL as SignOptions['expiresIn']) ?? '30m'

  const maxAge = opts?.maxAgeSeconds ?? parseDurationToSeconds(ttl)

  const { iss: payloadIss, aud: payloadAud, ...sessionPayload } = payload

  const issuerOption = Array.isArray(payloadIss) ? payloadIss[0] : payloadIss
  const audienceOption = payloadAud

  const token = signJwt(
    sessionPayload,
    {
      type: 'user',
      expiresIn: ttl,
      algorithm: 'HS256',
      ...(issuerOption ? { issuer: issuerOption } : {}),
      ...(audienceOption ? { audience: audienceOption } : {}),
    }
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
