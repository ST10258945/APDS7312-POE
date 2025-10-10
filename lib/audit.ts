import { prisma } from '@/lib/db'
import { createHash } from 'crypto'

type LogInput = {
  entityType: string
  entityId: string
  action: string
  ipAddress?: string | null
  userAgent?: string | null
  metadata?: any
}

/** canonicalize + sha256(prevHash + entry) so logs are tamper-evident */
function computeLogHash(input: {
  entityType: string
  entityId: string
  action: string
  ipAddress: string | null
  userAgent: string | null
  metadata: string | null
  timestampISO: string
  prevHash: string | null
}) {
  const canon = JSON.stringify({
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    metadata: input.metadata,
    timestamp: input.timestampISO,
    prevHash: input.prevHash,
  })
  return createHash('sha256').update(canon).digest('hex')
}

/** Append a chained audit-log entry (writes prevHash + hash) */
export async function appendAuditLog(entry: LogInput) {
  // NOTE: If your model uses "createdAt" instead of "timestamp", change the orderBy line accordingly.
  const last = await prisma.auditLog.findFirst({
    orderBy: { timestamp: 'desc' }, // ← change to { createdAt: 'desc' } if your column is createdAt
    select: { hash: true },
  })

  const prevHash = last?.hash ?? null
  const timestampISO = new Date().toISOString()
  const metadataStr =
    entry.metadata != null
      ? typeof entry.metadata === 'string'
        ? entry.metadata
        : JSON.stringify(entry.metadata)
      : null

  const hash = computeLogHash({
    entityType: entry.entityType,
    entityId: entry.entityId,
    action: entry.action,
    ipAddress: entry.ipAddress ?? null,
    userAgent: entry.userAgent ?? null,
    metadata: metadataStr,
    timestampISO,
    prevHash,
  })

  return prisma.auditLog.create({
    data: {
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      ipAddress: entry.ipAddress ?? null,
      userAgent: entry.userAgent ?? null,
      metadata: metadataStr,
      prevHash, // ok if nullable in your schema
      hash,    
    },
  })
}
