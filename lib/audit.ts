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

/** canonicalize and hash a log with prevHash to make a chain */
function computeLogHash(input: Omit<LogInput, 'metadata'> & { metadata?: string | null; timestampISO: string; prevHash: string | null }) {
  const canon = JSON.stringify({
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    metadata: input.metadata ?? null,
    timestamp: input.timestampISO,
    prevHash: input.prevHash ?? null,
  })
  return createHash('sha256').update(canon).digest('hex')
}

/** Append new audit log entry and chain it to previous hash */
export async function appendAuditLog(entry: LogInput) {
  // grab last inserted logs hash (by timestamp desc)
  const last = await prisma.auditLog.findFirst({
    orderBy: { timestamp: 'desc' },
    select: { hash: true },
  })

  const prevHash = last?.hash ?? null
  const timestampISO = new Date().toISOString()
  const metadataStr = entry.metadata != null ? (typeof entry.metadata === 'string' ? entry.metadata : JSON.stringify(entry.metadata)) : null

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
      prevHash,
      hash,
    },
  })
}
