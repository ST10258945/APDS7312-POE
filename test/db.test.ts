/**
 * Tests for database client
 */

import { prisma } from '@/lib/db'

describe('Database Client', () => {
  it('should export prisma client', () => {
    expect(prisma).toBeDefined()
  })

  it('should have customer model', () => {
    expect(prisma.customer).toBeDefined()
  })

  it('should have employee model', () => {
    expect(prisma.employee).toBeDefined()
  })

  it('should have payment model', () => {
    expect(prisma.payment).toBeDefined()
  })

  it('should have auditLog model', () => {
    expect(prisma.auditLog).toBeDefined()
  })
})
