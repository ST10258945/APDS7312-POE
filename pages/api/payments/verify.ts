import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { verifyJwt } from '@/lib/auth'
import { appendAuditLog } from '@/lib/audit'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    // must be logged-in employee (session cookie)
    const sessionToken = req.cookies.session
    const session = sessionToken ? verifyJwt<any>(sessionToken) : null
    console.log('Session verification debug:', {
      hasSessionToken: !!sessionToken,
      sessionType: session?.type,
      sessionSub: session?.sub,
      sessionEmployeeId: session?.employeeId
    })
    if (session?.type !== 'employee') return res.status(401).json({ error: 'Not authenticated' })

    console.log('Verify request body:', { body: req.body, keys: Object.keys(req.body || {}) })
    const { actionToken, paymentId } = req.body || {}
    console.log('Extracted fields:', { actionToken: !!actionToken, paymentId: !!paymentId, actionTokenLength: actionToken?.length })
    if (!actionToken || !paymentId) {
      console.error('Missing required fields:', { actionToken: !!actionToken, paymentId: !!paymentId })
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // action token must be issued for actions
    const action = verifyJwt<any>(actionToken, { aud: 'action-token', iss: 'bank-portal' })
    console.log('Action token verification debug:', {
      actionToken: actionToken?.slice(0, 20) + '...',
      action: action,
      hasAction: !!action,
      audience: action?.aud,
      expectedAudience: 'action-token'
    })
    if (action?.aud !== 'action-token') return res.status(403).json({ error: 'Invalid action token' })
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
    console.log('Verify payment debug:', { paymentId })
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
    console.log('Payment found:', { payment: payment ? { id: payment.id, status: payment.status } : null })
    
    if (!payment) {
      console.error('Payment not found for ID:', paymentId)
      await appendAuditLog({
        entityType: 'Payment',
        entityId: paymentId,
        action: 'VERIFY_FAILED',
        ipAddress: req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || null,
        userAgent: req.headers['user-agent'] || null,
        metadata: { reason: 'Payment not found', by: session.sub, employeeId: session.employeeId }
      })
      return res.status(404).json({ error: 'Payment not found' })
    }
    
    console.log('Payment status check:', { currentStatus: payment.status, expectedStatus: 'PENDING' })
    if (payment.status !== 'PENDING') {
      console.error('Payment not in PENDING state:', { paymentId, currentStatus: payment.status })
      await appendAuditLog({
        entityType: 'Payment',
        entityId: paymentId,
        action: 'VERIFY_FAILED',
        ipAddress: req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || null,
        userAgent: req.headers['user-agent'] || null,
        metadata: { reason: `Payment not in PENDING state, current status: ${payment.status}`, by: session.sub, employeeId: session.employeeId }
      })
      return res.status(400).json({ error: `Payment not in PENDING state (current: ${payment.status})` })
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'VERIFIED', verifiedAt: new Date() as any }
    })

    // consume token with tamper-evident audit logging
    await appendAuditLog({
      entityType: 'Employee',
      entityId: session.sub,
      action: 'ACTION_TOKEN_CONSUMED',
      ipAddress: req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || null,
      userAgent: req.headers['user-agent'] || null,
      metadata: { jti, paymentId }
    })

    await appendAuditLog({
      entityType: 'Payment',
      entityId: paymentId,
      action: 'VERIFIED',
      ipAddress: req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || null,
      userAgent: req.headers['user-agent'] || null,
      metadata: { by: session.sub, employeeId: session.employeeId }
    })

    return res.status(200).json({ ok: true, message: 'Payment verified' })
  } catch (err) {
    console.error('verify error', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
