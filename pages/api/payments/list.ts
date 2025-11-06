import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { verifyJwt, type UserJwtPayload } from '@/lib/auth'
import type { Prisma, PaymentStatus } from '@prisma/client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const sessionToken = req.cookies.session
  if (!sessionToken) return res.status(401).json({ error: 'Not authenticated' })
  
  const session = verifyJwt<UserJwtPayload>(sessionToken)
  if (session?.type !== 'employee') {
    return res.status(401).json({ error: 'Invalid or expired session' })
  }

  // Normalize & validate status filter
  const rawStatus = Array.isArray(req.query.status) ? req.query.status[0] : req.query.status
  const qStatus = typeof rawStatus === 'string' ? rawStatus.toUpperCase() : undefined
  const allowed: PaymentStatus[] = ['PENDING', 'VERIFIED', 'SUBMITTED'] // adjust to your schema
  const statusFilter = qStatus && allowed.includes(qStatus as PaymentStatus) ? (qStatus as PaymentStatus) : undefined

  const where: Prisma.PaymentWhereInput = statusFilter ? { status: statusFilter } : {}

  const payments = await prisma.payment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true, transactionId: true, status: true, amount: true, currency: true,
      provider: true, recipientName: true, createdAt: true,
    },
  })
  res.status(200).json({ payments })
}
