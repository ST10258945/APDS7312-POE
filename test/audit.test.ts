jest.mock('@/lib/db', () => {
  return {
    prisma: {
      auditLog: {
        findFirst: jest.fn().mockResolvedValue({ hash: 'prevhash' }),
        create: jest.fn().mockResolvedValue({ id: '1' }),
      },
    },
  };
});

import { prisma } from '@/lib/db';
import { appendAuditLog } from '@/lib/audit';

describe('appendAuditLog', () => {
  const fixed = new Date('2020-01-01T00:00:00.000Z');
  let spy: jest.SpyInstance<string, []>;

  beforeAll(() => {
    spy = jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(fixed.toISOString());
  });
  afterAll(() => spy.mockRestore());

  test('creates chained audit entry with sha256 hash', async () => {
    await appendAuditLog({
      entityType: 'Customer',
      entityId: '42',
      action: 'LOGIN_SUCCESS',
      ipAddress: '1.2.3.4',
      userAgent: 'jest',
      metadata: { a: 1 },
    });

    expect(prisma.auditLog.findFirst).toHaveBeenCalled();
    expect(prisma.auditLog.create).toHaveBeenCalled();

    const arg = (prisma.auditLog.create as jest.Mock).mock.calls[0][0].data;
    expect(arg.prevHash).toBe('prevhash');
    expect(typeof arg.hash).toBe('string');
    expect(arg.hash).toHaveLength(64); // sha256 hex
  });
});
