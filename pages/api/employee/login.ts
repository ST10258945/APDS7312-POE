import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { issueSessionCookie } from '@/lib/session'
import { rateLimit } from '@/lib/rateLimit'
import { validateEmployeeId, validatePassword } from '@/lib/validation'
import { appendAuditLog } from '@/lib/audit'

// Best-effort IP + UA helpers (proxy/CDN aware)
function getClientIp(req: NextApiRequest): string {
  const xfwd = req.headers['x-forwarded-for']
  const first = Array.isArray(xfwd) ? xfwd[0] : xfwd?.split(',')[0]
  return (first?.trim() || req.headers['x-real-ip'] || req.headers['x-vercel-ip'] || req.socket?.remoteAddress || '127.0.0.1').toString()
}
function getUa(req: NextApiRequest): string {
  const ua = req.headers['user-agent']
  return (Array.isArray(ua) ? ua[0] : ua) || ''
}

// Optional IP shape check (prod-only)
function validateIpAddress(ip: string | undefined | null): boolean {
  if (!ip) return false
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('::ffff:127.0.0.1')) return true
  const ipv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip)
  const ipv6 = /^[0-9a-fA-F:]+$/.test(ip)
  return ipv4 || ipv6
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    // Per-route rate limit
    const ip = getClientIp(req)
    if (!rateLimit(`emp-login:${ip}`)) {
      return res.status(429).json({ error: 'Too many attempts, try again shortly' })
    }

    const { employeeId, password } = req.body || {}

    // Validate inputs
    const vEmp = validateEmployeeId(employeeId)
    if (!vEmp.isValid) {
      await appendAuditLog({
        entityType: 'Employee',
        entityId: 'unknown',
        action: 'EMPLOYEE_LOGIN_FAILED',
        ipAddress: ip,
        userAgent: getUa(req),
        metadata: { reason: vEmp.error },
      })
      return res.status(400).json({ error: 'Invalid employee ID format' })
    }
    const vPwd = validatePassword(password)
    if (!vPwd.isValid) {
      await appendAuditLog({
        entityType: 'Employee',
        entityId: 'unknown',
        action: 'EMPLOYEE_LOGIN_FAILED',
        ipAddress: ip,
        userAgent: getUa(req),
        metadata: { reason: vPwd.error },
      })
      return res.status(400).json({ error: 'Invalid password format', details: vPwd.error })
    }

    // Optional prod IP validation
    if (process.env.NODE_ENV === 'production') {
      if (!validateIpAddress(ip)) {
        await appendAuditLog({
          entityType: 'Employee',
          entityId: 'unknown',
          action: 'EMPLOYEE_LOGIN_BLOCKED',
          ipAddress: ip,
          userAgent: getUa(req),
          metadata: { reason: 'Invalid IP address format' },
        })
        return res.status(400).json({ error: 'Invalid request source' })
      }
    }

    // Lookup employee
    const sanitizedEmployeeId = vEmp.sanitized ?? employeeId
    const employee = await prisma.employee.findUnique({
      where: { employeeId: sanitizedEmployeeId },
    })
    if (!employee) {
      await appendAuditLog({
        entityType: 'Employee',
        entityId: 'unknown',
        action: 'EMPLOYEE_LOGIN_FAILED',
        ipAddress: ip,
        userAgent: getUa(req),
        metadata: { reason: `Employee not found: ${sanitizedEmployeeId}` },
      })
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Active check
    if (Object.prototype.hasOwnProperty.call(employee, 'isActive') && (employee as any).isActive === false) {
      await appendAuditLog({
        entityType: 'Employee',
        entityId: employee.id,
        action: 'EMPLOYEE_LOGIN_BLOCKED',
        ipAddress: ip,
        userAgent: getUa(req),
        metadata: { reason: 'Inactive employee' },
      })
      return res.status(401).json({ error: 'Account is inactive' })
    }

    // Verify password
    const ok = await bcrypt.compare(password, employee.passwordHash)
    if (!ok) {
      await appendAuditLog({
        entityType: 'Employee',
        entityId: 'unknown',
        action: 'EMPLOYEE_LOGIN_FAILED',
        ipAddress: ip,
        userAgent: getUa(req),
        metadata: { reason: 'Invalid password' },
      })
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Ensure JWT secret exists
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not configured')

    // Issue session cookie (HttpOnly JWT)
    issueSessionCookie(
      res,
      { sub: employee.id, employeeId: employee.employeeId, fullName: employee.fullName, type: 'employee' },
      { expiresIn: '8h', maxAgeSeconds: 60 * 60 * 8 }
    )

    // Audit success (uses chained hash to satisfies Prisma type)
    await appendAuditLog({
      entityType: 'Employee',
      entityId: employee.id,
      action: 'EMPLOYEE_LOGIN_SUCCESS',
      ipAddress: ip,
      userAgent: getUa(req),
      metadata: {},
    })

    // Response (do not return token)
    return res.status(200).json({
      message: 'Login successful',
      employee: {
        employeeId: employee.employeeId,
        fullName: employee.fullName,
        email: employee.email,
      },
    })
  } catch (error) {
    console.error('Employee login error:', error)

    const ip = getClientIp(req)
    try {
      await appendAuditLog({
        entityType: 'Employee',
        entityId: 'unknown',
        action: 'EMPLOYEE_LOGIN_ERROR',
        ipAddress: ip,
        userAgent: getUa(req),
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      })
    } catch (_) { /* best-effort */ }

    return res.status(500).json({ error: 'Internal server error' })
  }
}
