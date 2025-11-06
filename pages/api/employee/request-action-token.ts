import type { NextApiRequest, NextApiResponse } from 'next'
import { verifyJwt, signJwt } from '@/lib/auth'
import { appendAuditLog } from '@/lib/audit'
import { rateLimit } from '@/lib/rateLimit'
import { randomBytes } from 'node:crypto'
import type { Algorithm } from 'jsonwebtoken'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    // ---- per-route rate limit (token issuance) ----
    const xff = req.headers['x-forwarded-for']
    const firstXff = Array.isArray(xff) ? xff[0] : xff
    const ipForRate =
      firstXff?.split(',')[0]?.trim() ??
      req.socket.remoteAddress ??
      'unknown'
    if (!rateLimit(`emp-token-ip:${ipForRate}`)) {
      return res.status(429).json({ error: 'Too many requests from this IP' })
    }

    // Expect session cookie - server-side verifyJwt helper reads cookie/session
    const sessionToken = req.cookies.session
    if (!sessionToken) return res.status(401).json({ error: 'Not authenticated' })

    const session = verifyJwt(sessionToken)
    if (session?.type !== 'employee') return res.status(403).json({ error: 'Forbidden - staff only' })

    // ---- per-employee throttle (session-scoped) ----
    if (!rateLimit(`emp-token-user:${session.sub}`)) {
      return res.status(429).json({ error: 'Too many token requests, slow down' })
    }

    // Required body: action and optional context
    const { action, context } = req.body || {}
    if (!action || typeof action !== 'string') return res.status(400).json({ error: 'Missing action' })

    // Create jti
    const jti = cryptoRandomString(32)

    // Sign the JWT token with action type
    const token = signJwt(
      {
        sub: session.sub,
        employeeId: session.employeeId ?? session.sub,
        action,
        jti
      },
      { 
        type: 'action',
        algorithm: (process.env.JWT_ALGORITHM as Algorithm | undefined) || 'HS256',
        // The signJwt function will use '15m' as default for action tokens
        // If you need to customize this, you can uncomment the line below
        // and set ACTION_TOKEN_EXPIRY in your .env file
        // expiresIn: process.env.ACTION_TOKEN_EXPIRY || '15m'
      }
    )

    // Write audit log with tamper-evident chain for token tracking
    await appendAuditLog({
      entityType: 'Employee',
      entityId: session.sub as string,
      action: 'ACTION_TOKEN_ISSUED',
      ipAddress: firstXff ?? req.socket.remoteAddress ?? null,
      userAgent: req.headers['user-agent'] || null,
      metadata: { jti, action, context, employeeId: session.employeeId }
    })

    return res.status(200).json({ token })
  } catch (err) {
    console.error('request-action-token error', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/** helper: small secure random function */
function cryptoRandomString(len = 32) {
  return randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len)
}
