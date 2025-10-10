import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { verifyJwt } from '@/lib/auth'
import { rememberRequest } from '@/lib/idempotency'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {

    const idemKey = (req.headers['idempotency-key'] ??
                     (req.headers as any)['Idempotency-Key']) as string | undefined
    if (idemKey) {
      const idem = rememberRequest(idemKey, 'employee/submit-to-swift', req.body)
      if (idem.hit) return res.status(200).json(idem.hit.responseJson)
    }

    const sessionToken = req.cookies.session
    if (!sessionToken) return res.status(401).json({ error: 'Not authenticated' })

    const session = verifyJwt(sessionToken)
    if (!session || session.type !== 'employee') return res.status(403).json({ error: 'Forbidden - staff only' })

    const { actionToken, paymentId } = req.body || {}
    if (!actionToken || !paymentId) return res.status(400).json({ error: 'Missing required fields' })

    // Verify action token (must be issued for actions)
    const tokenPayload = verifyJwt<any>(actionToken, { aud: 'action-token', iss: 'bank-portal' })
    if (!tokenPayload || tokenPayload.aud !== 'action-token') {
      return res.status(403).json({ error: 'Invalid action token' })
    }

    // token must belong to this employee and be for SUBMIT_TO_SWIFT (or similar)
    if (String(tokenPayload.sub) !== String(session.sub)) {
      return res.status(403).json({ error: 'Action token not for this user' })
    }

    // confirm action matches expected
    if (tokenPayload.action !== 'SUBMIT_TO_SWIFT') {
      return res.status(403).json({ error: 'Action token not valid for this operation' })
    }

    const jti = tokenPayload.jti
    if (!jti) return res.status(403).json({ error: 'Invalid token' })

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

    // mark as consumed (create audit log)
    await prisma.auditLog.create({
      data: {
        entityType: 'Employee',
        entityId: session.sub,
        action: 'ACTION_TOKEN_CONSUMED',
        ipAddress: req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || null,
        userAgent: req.headers['user-agent'],
        metadata: JSON.stringify({ jti, paymentId })
      }
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

    // Audit
    await prisma.auditLog.create({
      data: {
        entityType: 'Payment',
        entityId: paymentId,
        action: 'SUBMITTED_TO_SWIFT',
        ipAddress: req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || null,
        userAgent: req.headers['user-agent'],
        metadata: JSON.stringify({ by: session.sub, jti })
      }
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
