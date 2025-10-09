import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { verifyPassword } from '@/lib/auth'
import { issueSessionCookie } from '@/lib/session'
import { validateUsername, validateFields, containsInjectionPatterns } from '@/lib/validation'

/**
 * Customer Login API with comprehensive RegEx input validation
 * Implements whitelisting approach to prevent injection attacks
 * 
 * Customers can log in using:
 * - Username and password, OR
 * - Account number and password
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { username, accountNumber, password } = req.body || {}

    // Check for missing fields - either username OR accountNumber must be provided
    if ((!username && !accountNumber) || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Either username or account number must be provided along with password'
      })
    }

    // Validate password for injection patterns
    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        error: 'Invalid password format',
        details: 'Password is required and must be a string'
      })
    }

    if (password.length < 1 || password.length > 128) {
      return res.status(400).json({
        error: 'Invalid password length',
        details: 'Password length is invalid'
      })
    }

    if (containsInjectionPatterns(password)) {
      return res.status(400).json({
        error: 'Invalid password format',
        details: 'Password contains invalid characters'
      })
    }

    let customer = null
    let loginIdentifier = ''

    // Login with username
    if (username) {
      const usernameValidation = validateUsername(username)
      if (!usernameValidation.isValid) {
        return res.status(400).json({
          error: 'Invalid username format',
          details: usernameValidation.error
        })
      }

      customer = await prisma.customer.findUnique({
        where: { username: usernameValidation.sanitized }
      })
      loginIdentifier = `username: ${usernameValidation.sanitized}`
    }

    // Login with account number
    if (accountNumber && !customer) {
      // Simple validation for account number (8-12 digits)
      const trimmedAccountNumber = accountNumber.trim()
      if (!/^[0-9]{8,12}$/.test(trimmedAccountNumber)) {
        return res.status(400).json({
          error: 'Invalid account number format',
          details: 'Account number must be 8-12 digits only'
        })
      }

      if (containsInjectionPatterns(trimmedAccountNumber)) {
        return res.status(400).json({
          error: 'Invalid account number format',
          details: 'Account number contains invalid characters'
        })
      }

      customer = await prisma.customer.findFirst({
        where: { accountNumber: trimmedAccountNumber }
      })
      loginIdentifier = `account: ${trimmedAccountNumber}`
    }

    if (!customer) {
      // Log failed login attempt
      await prisma.auditLog.create({
        data: {
          entityType: 'Customer',
          entityId: 'unknown',
          action: 'LOGIN_FAILED',
          ipAddress: req.headers['x-forwarded-for']?.toString() || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          metadata: JSON.stringify({
            reason: 'User not found',
            attempted_login: loginIdentifier
          })
        }
      })

      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, customer.passwordHash)
    if (!isValidPassword) {
      // Log failed login attempt
      await prisma.auditLog.create({
        data: {
          entityType: 'Customer',
          entityId: customer.id,
          action: 'LOGIN_FAILED',
          ipAddress: req.headers['x-forwarded-for']?.toString() || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          metadata: JSON.stringify({
            reason: 'Invalid password',
            login_method: username ? 'username' : 'account_number'
          })
        }
      })

      return res.status(401).json({ error: 'Invalid credentials' })
    }

    issueSessionCookie(res, {
      sub: customer.id,
      username: customer.username,
      email: customer.email,
      type: 'customer'
    }, { expiresIn: '30m', maxAgeSeconds: 60 * 30 })


    const isProd = process.env.NODE_ENV === 'production'

    // Log successful login
    await prisma.auditLog.create({
      data: {
        entityType: 'Customer',
        entityId: customer.id,
        action: 'LOGIN_SUCCESS',
        ipAddress: req.headers['x-forwarded-for']?.toString() || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        metadata: JSON.stringify({
          login_method: username ? 'username' : 'account_number'
        })
      }
    })

    // Do NOT return token in body
    return res.status(200).json({
      customer: {
        id: customer.id,
        username: customer.username,
        fullName: customer.fullName,
        email: customer.email
      }
    })

  } catch (error) {
    console.error('Customer login error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}