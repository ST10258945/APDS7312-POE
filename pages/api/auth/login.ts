import type { NextApiRequest, NextApiResponse } from 'next'
import { serialize } from 'cookie'
import { prisma } from '../../../lib/db'
import { verifyPassword, signJwt } from '../../../lib/auth'
import { validateEmail, validatePassword, validateFields, containsInjectionPatterns } from '../../../lib/validation'

/**
 * Login API with comprehensive RegEx input validation
 * Implements whitelisting approach to prevent injection attacks
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, password } = req.body || {}

    // Check for missing fields
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        details: 'Email and password are required' 
      })
    }

    // Comprehensive input validation using RegEx patterns
    const validationSchema = {
      email: validateEmail,
      password: (pwd: string) => {
        // For login, we just check if password format is valid (no specific requirements)
        if (!pwd || typeof pwd !== 'string') {
          return { isValid: false, error: 'Password is required and must be a string' }
        }
        if (pwd.length < 1 || pwd.length > 128) {
          return { isValid: false, error: 'Password length invalid' }
        }
        if (containsInjectionPatterns(pwd)) {
          return { isValid: false, error: 'Password contains invalid characters' }
        }
        return { isValid: true, sanitized: pwd }
      }
    }

    const validation = validateFields({ email, password }, validationSchema)

    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Invalid input format', 
        details: validation.errors 
      })
    }

    // Use sanitized inputs for database query
    const sanitizedEmail = validation.sanitized.email
    const sanitizedPassword = validation.sanitized.password

    // Find user by email (using sanitized input)
    const user = await prisma.user.findUnique({ 
      where: { email: sanitizedEmail } 
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Verify password
    const isValidPassword = await verifyPassword(sanitizedPassword, user.passwordHash)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Generate JWT token
    const token = signJwt({ 
      sub: user.id, 
      email: sanitizedEmail,
      type: 'user'
    })

    const isProd = process.env.NODE_ENV === 'production'

    res.setHeader('Set-Cookie', serialize('session', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 30, // 30 minutes
    }))

    // Do NOT return token in body
    return res.status(200).json({ 
      user: {
        id: user.id,
        email: user.email
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
