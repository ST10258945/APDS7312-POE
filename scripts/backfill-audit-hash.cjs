const { PrismaClient } = require('@prisma/client');
const { createHash } = require('node:crypto');

const prisma = new PrismaClient();

function computeHash(entry) {
  const canon = JSON.stringify({
    entityType: entry.entityType,
    entityId: entry.entityId,
    action: entry.action,
    ipAddress: entry.ipAddress,
    userAgent: entry.userAgent,
    metadata: entry.metadata,
    timestamp: entry.timestampISO,
    prevHash: entry.prevHash,
  });
  return createHash('sha256').update(canon).digest('hex');
}

async function main() {
  const rows = await prisma.auditLog.findMany({
    orderBy: [{ timestamp: 'asc' }, { id: 'asc' }],
  });

  let prevHash = null;
  for (const r of rows) {
    const hash = computeHash({
      entityType: r.entityType,
      entityId: r.entityId,
      action: r.action,
      ipAddress: r.ipAddress ?? null,
      userAgent: r.userAgent ?? null,
      metadata: r.metadata ?? null,
      timestampISO: r.timestamp.toISOString(),
      prevHash,
    });

    await prisma.auditLog.update({
      where: { id: r.id },
      data: { prevHash, hash },
    });

    prevHash = hash;
  }

  console.log(`Backfilled ${rows.length} audit logs`);
}

// Prefer top-level await style via IIFE
(async () => {
  try {
    await main();
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
