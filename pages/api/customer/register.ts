import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { appendAuditLog } from '@/lib/audit'
import { 
  validateEmail, 
  validatePassword, 
  validateFullName, 
  validateSAIdNumber, 
  validateAccountNumber, 
  validateUsername,
  validateFields 
} from '@/lib/validation'

/**
 * Customer Registration API with comprehensive RegEx input validation
 * Implements whitelisting approach for all inputs as per assignment requirements
 * 
 * Required fields:
 * - fullName: Customer's full name (letters, spaces, hyphens, apostrophes only)
 * - idNumber: South African ID number (exactly 13 digits)
 * - accountNumber: Bank account number (8-12 digits)
 * - username: Username for login (alphanumeric with limited special chars)
 * - email: Email address (standard email format)
 * - password: Secure password (meets complexity requirements)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { fullName, idNumber, accountNumber, username, email, password } = req.body || {}

    // Check for missing required fields
    const requiredFields = ['fullName', 'idNumber', 'accountNumber', 'username', 'email', 'password']
    const missingFields = requiredFields.filter(field => !req.body[field])
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        details: `The following fields are required: ${missingFields.join(', ')}`
      })
    }

    // Comprehensive input validation using RegEx patterns (WHITELISTING APPROACH)
    const validationSchema = {
      fullName: validateFullName,
      idNumber: validateSAIdNumber,
      accountNumber: validateAccountNumber,
      username: validateUsername,
      email: validateEmail,
      password: validatePassword
    }

    const validation = validateFields({
      fullName,
      idNumber,
      accountNumber,
      username,
      email,
      password
    }, validationSchema)

    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Invalid input format', 
        details: validation.errors 
      })
    }

    // Use only sanitized inputs from this point forward
    const sanitizedData = validation.sanitized

    // Check for existing customer with same ID number
    const existingCustomerById = await prisma.customer.findUnique({ 
      where: { idNumber: sanitizedData.idNumber } 
    })

    if (existingCustomerById) {
      return res.status(409).json({ 
        error: 'Customer already exists',
        details: 'A customer with this ID number is already registered'
      })
    }

    // Check for existing customer with same username
    const existingCustomerByUsername = await prisma.customer.findUnique({ 
      where: { username: sanitizedData.username } 
    })

    if (existingCustomerByUsername) {
      return res.status(409).json({ 
        error: 'Username already taken',
        details: 'This username is already in use. Please choose a different one.'
      })
    }

    // Check for existing customer with same email
    const existingCustomerByEmail = await prisma.customer.findUnique({ 
      where: { email: sanitizedData.email } 
    })

    if (existingCustomerByEmail) {
      return res.status(409).json({ 
        error: 'Email already registered',
        details: 'A customer with this email address is already registered'
      })
    }

    // Hash the validated password
    const passwordHash = await hashPassword(sanitizedData.password)

    // Create new customer with all sanitized inputs
    const customer = await prisma.customer.create({ 
      data: { 
        fullName: sanitizedData.fullName,
        idNumber: sanitizedData.idNumber,
        accountNumber: sanitizedData.accountNumber,
        username: sanitizedData.username,
        email: sanitizedData.email,
        passwordHash
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        createdAt: true
      }
    })

    // Log successful registration (for security audit with tamper-evident chain)
    await appendAuditLog({
      entityType: 'Customer',
      entityId: customer.id,
      action: 'REGISTER',
      ipAddress: req.headers['x-forwarded-for']?.toString() || req.connection.remoteAddress || null,
      userAgent: req.headers['user-agent'] || null,
      metadata: { 
        email: sanitizedData.email,
        username: sanitizedData.username 
      }
    })

    return res.status(201).json({ 
      message: 'Customer registered successfully',
      customer: {
        id: customer.id,
        fullName: customer.fullName,
        username: customer.username,
        email: customer.email,
        registeredAt: customer.createdAt
      }
    })

  } catch (error) {
    console.error('Customer registration error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: 'Failed to register customer. Please try again.'
    })
  }
}