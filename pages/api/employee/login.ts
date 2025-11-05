import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { issueSessionCookie } from '@/lib/session'
import { rateLimit } from '@/lib/rateLimit'
import { validateEmployeeId, validatePassword } from '@/lib/validation'
import { appendAuditLog } from '@/lib/audit'
import { isIP } from 'node:net'

// ------------------------ small helpers ------------------------

function getClientIp(req: NextApiRequest): string {
  const xfwd = req.headers['x-forwarded-for']
  const first = Array.isArray(xfwd) ? xfwd[0] : xfwd?.split(',')[0]
  return (first?.trim() ||
    req.headers['x-real-ip'] ||
    req.headers['x-vercel-ip'] ||
    req.socket?.remoteAddress ||
    '127.0.0.1').toString()
}
function getUa(req: NextApiRequest): string {
  const ua = req.headers['user-agent']
  return (Array.isArray(ua) ? ua[0] : ua) || ''
}

// Treat IPv4 127.0.0.0/8, IPv6 ::1 and IPv4-mapped ::ffff:127.x.x.x as loopback
function isLoopback(ip: string): boolean {
  const v = isIP(ip)
  if (v === 4) {
    const [a] = ip.split('.').map(Number)
    return a === 127
  }
  if (v === 6) {
    if (ip === '::1') return true
    const m = /^::ffff:(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/i.exec(ip)
    if (m) {
      const a = Number(m[1])
      return a === 127
    }
  }
  return false
}
function validateIpAddress(ip: string | undefined | null): boolean {
  if (!ip) return false
  if (isLoopback(ip)) return true
  const v = isIP(ip)
  return v === 4 || v === 6
}

// --- audit shorthands
async function audit(req: NextApiRequest, ip: string, action: string, meta: Record<string, unknown>, entityId = 'unknown') {
  await appendAuditLog({
    entityType: 'Employee',
    entityId,
    action,
    ipAddress: ip,
    userAgent: getUa(req),
    metadata: meta,
  })
}
const auditFail = (req: NextApiRequest, ip: string, reason: string, id = 'unknown') => audit(req, ip, 'EMPLOYEE_LOGIN_FAILED', { reason }, id)
const auditBlocked = (req: NextApiRequest, ip: string, reason: string, id = 'unknown') => audit(req, ip, 'EMPLOYEE_LOGIN_BLOCKED', { reason }, id)
const auditSuccess = (req: NextApiRequest, ip: string, id: string) => audit(req, ip, 'EMPLOYEE_LOGIN_SUCCESS', {}, id)

// --- response shorthands
const json = (res: NextApiResponse, code: number, body: object) => res.status(code).json(body)
const tooMany = (res: NextApiResponse) => json(res, 429, { error: 'Too many attempts, try again shortly' })
const badEmpId = (res: NextApiResponse) => json(res, 400, { error: 'Invalid employee ID format' })
const badPwd = (res: NextApiResponse, details?: string) =>
  json(res, 400, { error: 'Invalid password format', ...(details ? { details } : {}) })
const unauthorized = (res: NextApiResponse) => json(res, 401, { error: 'Invalid credentials' })

// --- grouped guards (reduces branches in handler)

function rateLimitGuard(req: NextApiRequest, res: NextApiResponse, ip: string): boolean {
  if (!rateLimit(`emp-login:${ip}`)) {
    tooMany(res)
    return false
  }
  return true
}

async function inputGuard(
  req: NextApiRequest,
  res: NextApiResponse,
  ip: string,
  employeeIdInput: unknown,
  passwordInput: unknown
): Promise<{ sanitizedEmployeeId: string; password: string } | null> {
  if (typeof employeeIdInput !== 'string') {
    await auditFail(req, ip, 'Invalid employee ID')
    badEmpId(res)
    return null
  }
  if (typeof passwordInput !== 'string') {
    await auditFail(req, ip, 'Invalid password')
    badPwd(res, 'Password must be a string')
    return null
  }

  const vEmp = validateEmployeeId(employeeIdInput)
  const vPwd = validatePassword(passwordInput)

  if (!vEmp.isValid) {
    await auditFail(req, ip, vEmp.error ?? 'Invalid employee ID')
    badEmpId(res)
    return null
  }
  if (!vPwd.isValid) {
    await auditFail(req, ip, vPwd.error ?? 'Invalid password')
    badPwd(res, vPwd.error)
    return null
  }
  return { sanitizedEmployeeId: vEmp.sanitized ?? employeeIdInput, password: passwordInput }
}

async function prodIpGuard(req: NextApiRequest, res: NextApiResponse, ip: string): Promise<boolean> {
  if (process.env.NODE_ENV !== 'production') return true
  if (validateIpAddress(ip)) return true
  await auditBlocked(req, ip, 'Invalid IP address format')
  json(res, 400, { error: 'Invalid request source' })
  return false
}

async function employeeGuard(
  req: NextApiRequest,
  res: NextApiResponse,
  ip: string,
  employeeId: string
) {
  const employee = await prisma.employee.findUnique({ where: { employeeId } })
  if (!employee) {
    await auditFail(req, ip, `Employee not found: ${employeeId}`)
    unauthorized(res)
    return null
  }
  if (Object.hasOwn(employee, 'isActive') && (employee as any).isActive === false) {
    await auditBlocked(req, ip, 'Inactive employee', employee.id)
    json(res, 401, { error: 'Account is inactive' })
    return null
  }
  return employee
}

async function passwordGuard(
  req: NextApiRequest,
  res: NextApiResponse,
  ip: string,
  password: string,
  employee: { passwordHash: string }
): Promise<boolean> {
  const ok = await bcrypt.compare(password, employee.passwordHash)
  if (ok) return true
  await auditFail(req, ip, 'Invalid password')
  unauthorized(res)
  return false
}

// ----------------------------- handler -----------------------------

async function processLogin(req: NextApiRequest, res: NextApiResponse) {
  const ip = getClientIp(req)
  if (!rateLimitGuard(req, res, ip)) return

  const { employeeId, password } = req.body || {}
  const validated = await inputGuard(req, res, ip, employeeId, password)
  if (!validated) return

  if (!await prodIpGuard(req, res, ip)) return

  const employee = await employeeGuard(req, res, ip, validated.sanitizedEmployeeId)
  if (!employee) return

  if (!await passwordGuard(req, res, ip, validated.password, employee)) return

  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not configured')

  issueSessionCookie(
    res,
    { sub: employee.id, employeeId: employee.employeeId, fullName: employee.fullName, type: 'employee' },
    { expiresIn: '8h', maxAgeSeconds: 60 * 60 * 8 }
  )

  await auditSuccess(req, ip, employee.id)

  return json(res, 200, {
    message: 'Login successful',
    employee: {
      employeeId: employee.employeeId,
      fullName: employee.fullName,
      email: employee.email,
    },
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })

  try {
    return await processLogin(req, res)
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
    } catch (err) {
      console.warn('Audit log write failed:', err instanceof Error ? err.message : err)
    }

    return json(res, 500, { error: 'Internal server error' })
  }
}

// Expose tiny helpers for unit tests only (tree-shaken in prod)
export const __test = { isLoopback, validateIpAddress }
