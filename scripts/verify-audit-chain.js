const { PrismaClient } = require('@prisma/client')
const { createHash } = require('crypto')

const prisma = new PrismaClient()

function computeHash(entry) {
  const canon = JSON.stringify({
    entityType: entry.entityType,
    entityId: entry.entityId,
    action: entry.action,
    ipAddress: entry.ipAddress ?? null,
    userAgent: entry.userAgent ?? null,
    metadata: entry.metadata ?? null,
    timestamp: entry.timestampISO,      // ISO string
    prevHash: entry.prevHash ?? null,
  })
  return createHash('sha256').update(canon).digest('hex')
}

async function main() {
  const rows = await prisma.auditLog.findMany({
    orderBy: [{ timestamp: 'asc' }, { id: 'asc' }],
  })

  let prevHash = null
  let brokenLinks = 0
  let badHashes = 0

  for (const r of rows) {
    // 1) prev link check
    if ((r.prevHash ?? null) !== (prevHash ?? null)) {
      brokenLinks++
      console.error(`✖ Prev-link mismatch at id=${r.id}`)
    }

    // 2) recompute hash using canonical form
    const recomputed = computeHash({
      entityType: r.entityType,
      entityId: r.entityId,
      action: r.action,
      ipAddress: r.ipAddress,
      userAgent: r.userAgent,
      metadata: r.metadata,
      timestampISO: r.timestamp.toISOString(),
      prevHash: r.prevHash ?? null,
    })

    if (recomputed !== r.hash) {
      badHashes++
      console.error(`✖ Hash mismatch at id=${r.id}`)
    }

    prevHash = r.hash
  }

  console.log('\n=== Audit Chain Verification ===')
  console.log(`Total rows: ${rows.length}`)
  console.log(`Broken prev-links: ${brokenLinks}`)
  console.log(`Bad hashes: ${badHashes}`)
  if (rows.length && !brokenLinks && !badHashes) {
    console.log(':) Chain OK: all links intact and hashes match.')
  }

  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
