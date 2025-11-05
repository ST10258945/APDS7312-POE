import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { verifyPassword } from '@/lib/auth'
import { issueSessionCookie } from '@/lib/session'
import { validateUsername, containsInjectionPatterns } from '@/lib/validation'
import { appendAuditLog } from '@/lib/audit'

if (process.env.NODE_ENV !== 'production') {
  console.log('ENV CHECK', {
    hasJwtSecret: Boolean(process.env.JWT_SECRET),
    nodeEnv: process.env.NODE_ENV,
  })
}

// Normalize IP/UA safely (avoids string | string[] pitfalls)
function getIp(req: NextApiRequest): string {
  const xf = req.headers['x-forwarded-for']
  const first = Array.isArray(xf) ? xf[0] : xf?.split(',')[0]
  return (first?.trim() || req.socket?.remoteAddress || '').toString()
}
function getUa(req: NextApiRequest): string {
  const ua = req.headers['user-agent']
  return (Array.isArray(ua) ? ua[0] : ua) || ''
}

type CustomerModel = Awaited<ReturnType<typeof prisma.customer.findUnique>>
type BadReq = { error: string; details: string }
type FindOk = { ok: true; customer: CustomerModel | null; loginIdentifier: string }
type FindErr = { ok: false; bad: BadReq }

// --- small helpers to reduce complexity ---

function validateRequiredCombo(
  username?: unknown,
  accountNumber?: unknown,
  password?: unknown
): string | null {
  if ((!username && !accountNumber) || !password || typeof password !== 'string') {
    return 'Either username or account number must be provided along with password'
  }
  if (username !== undefined && typeof username !== 'string') return 'Username must be a string'
  if (accountNumber !== undefined && typeof accountNumber !== 'string') return 'Account number must be a string'
  return null
}

function validatePasswordBasic(password: string): string | null {
  if (password.length < 1 || password.length > 128) return 'Password length is invalid'
  if (containsInjectionPatterns(password)) return 'Password contains invalid characters'
  return null
}

async function findByUsername(username: string): Promise<FindOk | FindErr> {
  const uv = validateUsername(username)
  if (!uv.isValid) {
    return { ok: false, bad: { error: 'Invalid username format', details: uv.error ?? 'Invalid username' } }
  }
  const customer = await prisma.customer.findUnique({ where: { username: uv.sanitized! } })
  return { ok: true, customer, loginIdentifier: `username: ${uv.sanitized}` }
}

async function findByAccountNumber(accountNumber: string): Promise<FindOk | FindErr> {
  const trimmed = accountNumber.trim()
  if (!/^\d{8,12}$/.test(trimmed)) {
    return { ok: false, bad: { error: 'Invalid account number format', details: 'Account number must be 8-12 digits only' } }
  }
  if (containsInjectionPatterns(trimmed)) {
    return { ok: false, bad: { error: 'Invalid account number format', details: 'Account number contains invalid characters' } }
  }
  const customer = await prisma.customer.findFirst({ where: { accountNumber: trimmed } })
  return { ok: true, customer, loginIdentifier: `account: ${trimmed}` }
}

/** Try username, then account number (if provided).
 *  Returns { ok:false, bad } only for 400-type validation errors.
 *  Returns { ok:true, customer:null } for "not found" so caller can 401.
 */
async function resolveIdentity(
  username?: string,
  accountNumber?: string
): Promise<FindOk | FindErr> {
  if (username) {
    const u = await findByUsername(username)
    if (!u.ok) return u
    if (u.customer) return u
    if (accountNumber) return findByAccountNumber(accountNumber)
    return u // ok:true, customer:null, loginIdentifier from username
  }
  if (accountNumber) {
    return findByAccountNumber(accountNumber)
  }
  // Should not reach here because required-combo gate runs first
  return { ok: true, customer: null, loginIdentifier: '' }
}

// --- audit + response helpers ---

async function auditCustomer(
  req: NextApiRequest,
  entityId: string,
  action: 'LOGIN_FAILED' | 'LOGIN_SUCCESS',
  metadata: Record<string, any>
) {
  await appendAuditLog({
    entityType: 'Customer',
    entityId,
    action,
    ipAddress: getIp(req),
    userAgent: getUa(req),
    metadata,
  })
}

function badRequest(res: NextApiResponse, error: string, details: string) {
  return res.status(400).json({ error, details })
}

// ----------------------------------- handler -----------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { username, accountNumber, password } = req.body || {}

    // Required + password checks (+ type sanity for username/accountNumber)
    const comboErr = validateRequiredCombo(username, accountNumber, password)
    if (comboErr) {
      return res.status(400).json({ error: 'Missing required fields', details: comboErr })
    }
    const pwdErr = validatePasswordBasic(password as string)
    if (pwdErr) return badRequest(res, 'Invalid password format', pwdErr)

    // Narrow to strings to avoid object stringification
    const u = typeof username === 'string' ? username : undefined
    const a = typeof accountNumber === 'string' ? accountNumber : undefined

    // Resolve identity
    const identity = await resolveIdentity(u, a)
    if (!identity.ok) {
      return badRequest(res, identity.bad.error, identity.bad.details)
    }
    const { customer, loginIdentifier } = identity

    // Not found → 401 with audit
    if (!customer) {
      await auditCustomer(req, 'unknown', 'LOGIN_FAILED', {
        reason: 'User not found',
        attempted_login: loginIdentifier,
      })
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Verify password
    const ok = await verifyPassword(password as string, customer.passwordHash)
    if (!ok) {
      await auditCustomer(req, customer.id, 'LOGIN_FAILED', {
        reason: 'Invalid password',
        login_method: u ? 'username' : 'account_number',
      })
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Issue HttpOnly session cookie (JWT)
    issueSessionCookie(
      res,
      { sub: customer.id, username: customer.username, email: customer.email, type: 'customer' },
      { expiresIn: '30m', maxAgeSeconds: 60 * 30 }
    )

    // Audit success
    await auditCustomer(req, customer.id, 'LOGIN_SUCCESS', {
      login_method: u ? 'username' : 'account_number',
    })

    // Response (no token returned)
    return res.status(200).json({
      customer: {
        id: customer.id,
        username: customer.username,
        fullName: customer.fullName,
        email: customer.email,
      },
    })
  } catch (error) {
    console.error('Customer login error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
