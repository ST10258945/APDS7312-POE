import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { verifyJwt, type UserJwtPayload } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    // Verify session - only employees can view audit logs
    const sessionToken = req.cookies.session
    if (!sessionToken) return res.status(401).json({ error: 'Not authenticated' })

    const session = verifyJwt<UserJwtPayload>(sessionToken)
    if (session?.type !== 'employee') {
      return res.status(403).json({ error: 'Forbidden - employees only' })
    }

    // Get query parameters for filtering
    const { entityType, entityId, action, limit = '50', offset = '0' } = req.query

    // Build where clause
    const where: any = {}
    if (entityType) where.entityType = entityType
    if (entityId) where.entityId = entityId
    if (action) where.action = action

    // Fetch audit logs
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: Math.min(parseInt(limit as string) || 50, 100),
      skip: parseInt(offset as string) || 0,
    })

    // Get total count
    const total = await prisma.auditLog.count({ where })

    return res.status(200).json({
      logs,
      pagination: {
        total,
        limit: Math.min(parseInt(limit as string) || 50, 100),
        offset: parseInt(offset as string) || 0,
      },
    })
  } catch (error) {
    console.error('Audit logs error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
