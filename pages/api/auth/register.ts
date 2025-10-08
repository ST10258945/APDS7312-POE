import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { validateEmail, validatePassword, validateFields } from '@/lib/validation'

/**
 * Registration API with comprehensive RegEx input validation
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
      password: validatePassword
    }

    const validation = validateFields({ email, password }, validationSchema)

    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Invalid input format', 
        details: validation.errors 
      })
    }

    // Use sanitized inputs
    const sanitizedEmail = validation.sanitized.email
    const sanitizedPassword = validation.sanitized.password

    // Check if user already exists (using sanitized email)
    const existingUser = await prisma.user.findUnique({ 
      where: { email: sanitizedEmail } 
    })

    if (existingUser) {
      return res.status(409).json({ 
        error: 'Email already registered',
        details: 'A user with this email address already exists'
      })
    }

    // Hash the validated password
    const passwordHash = await hashPassword(sanitizedPassword)

    // Create new user with sanitized inputs
    const user = await prisma.user.create({ 
      data: { 
        email: sanitizedEmail, 
        passwordHash 
      } 
    })

    return res.status(201).json({ 
      id: user.id,
      email: user.email,
      message: 'User registered successfully'
    })

  } catch (error) {
    console.error('Registration error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
