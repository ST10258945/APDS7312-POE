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

/**
 * Customer Login:
 * - Username + password OR Account number + password
 * - Strict validation + audit logs (tamper-evident chain)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { username, accountNumber, password } = req.body || {}

    // Required combos
    if ((!username && !accountNumber) || !password || typeof password !== 'string') {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Either username or account number must be provided along with password',
      })
    }

    // Password basic checks
    if (password.length < 1 || password.length > 128) {
      return res.status(400).json({
        error: 'Invalid password length',
        details: 'Password length is invalid',
      })
    }
    if (containsInjectionPatterns(password)) {
      return res.status(400).json({
        error: 'Invalid password format',
        details: 'Password contains invalid characters',
      })
    }

    let customer: Awaited<ReturnType<typeof prisma.customer.findUnique>> | null = null
    let loginIdentifier = ''

    // Login with username
    if (username) {
      const uv = validateUsername(username)
      if (!uv.isValid) {
        return res.status(400).json({
          error: 'Invalid username format',
          details: uv.error,
        })
      }
      customer = await prisma.customer.findUnique({ where: { username: uv.sanitized! } })
      loginIdentifier = `username: ${uv.sanitized}`
    }

    // Login with account number (8–12 digits)
    if (accountNumber && !customer) {
      const trimmed = String(accountNumber).trim()
      if (!/^[0-9]{8,12}$/.test(trimmed)) {
        return res.status(400).json({
          error: 'Invalid account number format',
          details: 'Account number must be 8-12 digits only',
        })
      }
      if (containsInjectionPatterns(trimmed)) {
        return res.status(400).json({
          error: 'Invalid account number format',
          details: 'Account number contains invalid characters',
        })
      }
      customer = await prisma.customer.findFirst({ where: { accountNumber: trimmed } })
      loginIdentifier = `account: ${trimmed}`
    }

    // Not found
    if (!customer) {
      await appendAuditLog({
        entityType: 'Customer',
        entityId: 'unknown',
        action: 'LOGIN_FAILED',
        ipAddress: getIp(req),
        userAgent: getUa(req),
        metadata: {
          reason: 'User not found',
          attempted_login: loginIdentifier,
        },
      })
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Verify password
    const ok = await verifyPassword(password, customer.passwordHash)
    if (!ok) {
      await appendAuditLog({
        entityType: 'Customer',
        entityId: customer.id,
        action: 'LOGIN_FAILED',
        ipAddress: getIp(req),
        userAgent: getUa(req),
        metadata: {
          reason: 'Invalid password',
          login_method: username ? 'username' : 'account_number',
        },
      })
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Issue HttpOnly session cookie (JWT)
    issueSessionCookie(
      res,
      {
        sub: customer.id,
        username: customer.username,
        email: customer.email,
        type: 'customer',
      },
      { expiresIn: '30m', maxAgeSeconds: 60 * 30 }
    )

    // Audit success (uses chained hash so Prisma type is satisfied)
    await appendAuditLog({
      entityType: 'Customer',
      entityId: customer.id,
      action: 'LOGIN_SUCCESS',
      ipAddress: getIp(req),
      userAgent: getUa(req),
      metadata: {
        login_method: username ? 'username' : 'account_number',
      },
    })

    // Response (do NOT return token)
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
