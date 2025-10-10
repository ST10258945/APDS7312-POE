import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { verifyJwt, signJwt } from '@/lib/auth'
import { appendAuditLog } from '@/lib/audit'
import { rateLimit } from '@/lib/rateLimit'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    // ---- per-route rate limit (token issuance) ----
    const ipForRate = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || req.socket.remoteAddress || 'unknown';
    if (!rateLimit(`emp-token-ip:${ipForRate}`)) {
      return res.status(429).json({ error: 'Too many requests from this IP' })
    }

    // Expect session cookie - server-side verifyJwt helper reads cookie/session
    const sessionToken = req.cookies.session
    if (!sessionToken) return res.status(401).json({ error: 'Not authenticated' })

    const session = verifyJwt(sessionToken)
    if (!session || session.type !== 'employee') return res.status(403).json({ error: 'Forbidden - staff only' })

    // ---- per-employee throttle (session-scoped) ----
    if (!rateLimit(`emp-token-user:${session.sub}`)) {
      return res.status(429).json({ error: 'Too many token requests, slow down' })
    }

    // Required body: action and optional context
    const { action, context } = req.body || {}
    if (!action || typeof action !== 'string') return res.status(400).json({ error: 'Missing action' })

    // Create jti
    const jti = cryptoRandomString(32)

    // Action token payload: sub = employeeId, action, jti, aud
    const token = signJwt({
      iss: 'bank-portal',
      sub: session.sub,
      employeeId: session.employeeId ?? session.sub,
      action,
      jti,
      aud: 'action-token'
    }, { expiresIn: '5m', algorithm: 'HS256' })

    // Write audit log with tamper-evident chain for token tracking
    await appendAuditLog({
      entityType: 'Employee',
      entityId: session.sub,
      action: 'ACTION_TOKEN_ISSUED',
      ipAddress: req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || null,
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
  // Node's built-in crypto
  const { randomBytes } = require('crypto')
  return randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len)
}
