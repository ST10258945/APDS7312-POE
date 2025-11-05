import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { verifyJwt } from '@/lib/auth'
import { rememberRequest } from '@/lib/idempotency'
import { appendAuditLog } from '@/lib/audit'

// helpers to reduce branches in handler
function getIdempotencyKey(req: NextApiRequest): string | undefined {
  const raw = req.headers['idempotency-key'] ?? (req.headers as any)['Idempotency-Key']
  return Array.isArray(raw) ? raw[0] : raw
}
function getClientIp(req: NextApiRequest): string {
  const xff = req.headers['x-forwarded-for']
  const first = Array.isArray(xff) ? xff[0] : xff
  return first?.split(',')[0]?.trim() ?? req.socket.remoteAddress ?? 'unknown'
}
function requireEmployeeSession(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies.session
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' })
    return null
  }
  const session = verifyJwt<any>(token)
  if (session?.type !== 'employee') {
    res.status(403).json({ error: 'Forbidden - staff only' })
    return null
  }
  return session
}
function verifyActionTokenOr403(
  res: NextApiResponse,
  token: string,
  expect: { aud: string; iss: string; sub: string; action: string }
) {
  const payload = verifyJwt<any>(token, { aud: expect.aud, iss: expect.iss })
  if (!payload || payload.aud !== expect.aud || String(payload.sub) !== String(expect.sub) || payload.action !== expect.action) {
    res.status(403).json({ error: 'Invalid action token' })
    return null
  }
  if (!payload.jti) {
    res.status(403).json({ error: 'Invalid token' })
    return null
  }
  return payload as { jti: string }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {

    const idemKey = getIdempotencyKey(req)
    if (idemKey) {
      const idem = rememberRequest(idemKey, 'employee/submit-to-swift', req.body)
      if (idem.hit) return res.status(200).json(idem.hit.responseJson)
    }

    const session = requireEmployeeSession(req, res)
    if (!session) return

    const { actionToken, paymentId } = req.body || {}
    if (typeof actionToken !== 'string' || typeof paymentId !== 'string') {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const tok = verifyActionTokenOr403(res, actionToken, {
      aud: 'action-token',
      iss: 'bank-portal',
      sub: session.sub,
      action: 'SUBMIT_TO_SWIFT',
    })
    if (!tok) return
    const jti = tok.jti

    // Check audit log for issued token and ensure not yet consumed
    const issued = await prisma.auditLog.findFirst({
      where: {
        action: 'ACTION_TOKEN_ISSUED',
        metadata: { contains: jti } // quick search - metadata stores JSON string
      },
      orderBy: { timestamp: 'desc' }
    })

    if (!issued) {
      return res.status(403).json({ error: 'Action token not recognized' })
    }

    // Ensure not consumed - record consumption as ACTION_TOKEN_CONSUMED
    const consumed = await prisma.auditLog.findFirst({
      where: {
        action: 'ACTION_TOKEN_CONSUMED',
        metadata: { contains: jti }
      }
    })
    if (consumed) {
      return res.status(403).json({ error: 'Action token already used' })
    }

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
    if (!payment) return res.status(404).json({ error: 'Payment not found' })
    if (payment.status !== 'VERIFIED') {
      return res.status(400).json({ error: 'Payment not ready for SWIFT' })
    }

    // mark as consumed (create audit log with tamper-evident chain)
    await appendAuditLog({
      entityType: 'Employee',
      entityId: session.sub,
      action: 'ACTION_TOKEN_CONSUMED',
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || null,
      metadata: { jti, paymentId }
    })

    // Perform the SWIFT submission flow:
    // - Validate payment exists
    // - Validate payment status = VERIFIED
    // - Sign / queue / idempotency etc

    // - Simulate adapter: set submittedToSwift timestamp and status
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'SUBMITTED',
        submittedToSwift: new Date()
      }
    })

    // Audit with tamper-evident chain
    await appendAuditLog({
      entityType: 'Payment',
      entityId: paymentId,
      action: 'SUBMITTED_TO_SWIFT',
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || null,
      metadata: { by: session.sub, employeeId: session.employeeId, jti }
    })

    // success payload
    const payload = { ok: true, message: 'Payment queued for SWIFT' }

    // write idempotent cache (if key present)
    if (idemKey) rememberRequest(idemKey, 'employee/submit-to-swift', req.body).write(payload)

    return res.status(200).json(payload)
  } catch (err) {
    console.error('submit-to-swift error', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
