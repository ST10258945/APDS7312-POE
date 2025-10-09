import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { verifyJwt } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    // must be logged-in employee (session cookie)
    const sessionToken = req.cookies.session
    const session = sessionToken ? verifyJwt<any>(sessionToken) : null
    if (!session || session.type !== 'employee') return res.status(401).json({ error: 'Not authenticated' })

    const { actionToken, paymentId } = req.body || {}
    if (!actionToken || !paymentId) return res.status(400).json({ error: 'Missing required fields' })

    // action token must be issued for actions
    const action = verifyJwt<any>(actionToken)
    if (!action || action.aud !== 'action-token') return res.status(403).json({ error: 'Invalid action token' })
    if (String(action.sub) !== String(session.sub)) return res.status(403).json({ error: 'Action token not for this user' })
    if (action.action !== 'VERIFY_PAYMENT') return res.status(403).json({ error: 'Action token not valid for this operation' })
    const jti = action.jti
    if (!jti) return res.status(403).json({ error: 'Invalid token' })

    // ensure issued + not yet consumed
    const issued = await prisma.auditLog.findFirst({
      where: { action: 'ACTION_TOKEN_ISSUED', metadata: { contains: jti } },
      orderBy: { timestamp: 'desc' }
    })
    if (!issued) return res.status(403).json({ error: 'Action token not recognized' })

    const consumed = await prisma.auditLog.findFirst({
      where: { action: 'ACTION_TOKEN_CONSUMED', metadata: { contains: jti } }
    })
    if (consumed) return res.status(403).json({ error: 'Action token already used' })

    // fetch + transition
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
    if (!payment) return res.status(404).json({ error: 'Payment not found' })
    if (payment.status !== 'PENDING') return res.status(400).json({ error: 'Payment not in PENDING state' })

    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'VERIFIED', verifiedAt: new Date() as any }
    })

    // consume token
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

    await prisma.auditLog.create({
      data: {
        entityType: 'Payment',
        entityId: paymentId,
        action: 'VERIFIED',
        ipAddress: req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || null,
        userAgent: req.headers['user-agent'],
        metadata: JSON.stringify({ by: session.sub })
      }
    })

    return res.status(200).json({ ok: true, message: 'Payment verified' })
  } catch (err) {
    console.error('verify error', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
