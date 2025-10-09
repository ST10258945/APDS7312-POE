import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { verifyJwt } from '@/lib/auth'
import { rememberRequest } from '@/lib/idempotency'

import {
  validateAmount,
  validateCurrencyCode,
  validateProviderName,
  validateRecipientName,
  validateAccountNumber,
  validateSwiftCode,
  validatePaymentReference,
  validateFields
} from '@/lib/validation'

/**
 * Payment Creation API with comprehensive RegEx input validation
 * Creates international payment transactions with full input whitelisting
 * 
 * Required fields:
 * - amount: Payment amount (positive decimal with up to 2 decimal places)
 * - currency: ISO 4217 currency code (3 uppercase letters)
 * - provider: Payment provider name (letters, spaces, safe punctuation)
 * - recipientName: Name of payment recipient
 * - recipientAccount: Recipient's account number (8-12 digits)
 * - swiftCode: SWIFT/BIC code (8 or 11 characters)
 * - paymentReference: Optional payment reference
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Verify JWT token and extract customer information
    const sessionToken = req.cookies.session
    const session = sessionToken ? verifyJwt<any>(sessionToken) : null
    if (!session || session.type !== 'customer') {
      return res.status(401).json({ error: 'Not authenticated' })
    }
    const customerId = session.sub

    // Verify JWT/session (already done)
    const idemKey = req.headers['idempotency-key'] as string | undefined
    if (idemKey) {
      const idem = rememberRequest(idemKey, 'payments/create', req.body)
      if (idem.hit) return res.status(200).json(idem.hit.responseJson)
    }

    // Extract payment data from request body
    const {
      amount,
      currency,
      provider,
      recipientName,
      recipientAccount,
      swiftCode,
      paymentReference
    } = req.body || {}

    // Check for missing required fields
    const requiredFields = ['amount', 'currency', 'provider', 'recipientName', 'recipientAccount', 'swiftCode']
    const missingFields = requiredFields.filter(field => !req.body[field])

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: `The following fields are required: ${missingFields.join(', ')}`
      })
    }

    // Comprehensive input validation using RegEx patterns (WHITELISTING APPROACH)
    const validationSchema = {
      amount: validateAmount,
      currency: validateCurrencyCode,
      provider: validateProviderName,
      recipientName: validateRecipientName,
      recipientAccount: validateAccountNumber,
      swiftCode: validateSwiftCode,
      // Payment reference is optional
      ...(paymentReference && { paymentReference: validatePaymentReference })
    }

    const dataToValidate = {
      amount,
      currency,
      provider,
      recipientName,
      recipientAccount,
      swiftCode,
      ...(paymentReference && { paymentReference })
    }

    const validation = validateFields(dataToValidate, validationSchema)

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid input format',
        details: validation.errors
      })
    }

    // Use only sanitized inputs from this point forward
    const sanitizedData = validation.sanitized

    // Verify customer exists and is active
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    })

    if (!customer) {
      return res.status(401).json({
        error: 'Customer not found',
        details: 'Authentication token refers to non-existent customer'
      })
    }

    // Generate unique transaction ID
    const timestamp = Date.now().toString()
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase()
    const transactionId = `TXN-${timestamp}-${randomSuffix}`

    // Create payment record with all sanitized inputs
    const payment = await prisma.payment.create({
      data: {
        transactionId,
        customerId: customer.id,
        amount: sanitizedData.amount,
        currency: sanitizedData.currency,
        provider: sanitizedData.provider,
        recipientName: sanitizedData.recipientName,
        recipientAccount: sanitizedData.recipientAccount,
        swiftCode: sanitizedData.swiftCode,
        paymentReference: sanitizedData.paymentReference || null,
        status: 'PENDING' // Default status awaiting employee verification
      },
      include: {
        customer: {
          select: {
            fullName: true,
            username: true
          }
        }
      }
    })

    const responsePayload = {
      message: 'Payment created successfully and awaiting verification',
      payment: {
        id: payment.id,
        transactionId: payment.transactionId,
        amount: payment.amount,
        currency: payment.currency,
        provider: payment.provider,
        recipientName: payment.recipientName,
        recipientAccount: payment.recipientAccount,
        swiftCode: payment.swiftCode,
        paymentReference: payment.paymentReference,
        status: payment.status,
        createdAt: payment.createdAt,
        customer: {
          fullName: payment.customer.fullName,
          username: payment.customer.username
        }
      }
    }

    // Log payment creation for audit trail
    await prisma.auditLog.create({
      data: {
        entityType: 'Payment',
        entityId: payment.id,
        action: 'CREATE',
        userId: customerId,
        ipAddress: req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        metadata: JSON.stringify({
          transactionId: payment.transactionId,
          amount: sanitizedData.amount,
          currency: sanitizedData.currency,
          recipientName: sanitizedData.recipientName,
          swiftCode: sanitizedData.swiftCode
        })
      }
    })

    if (idemKey) rememberRequest(idemKey, 'payments/create', req.body).write(responsePayload)
return res.status(201).json(responsePayload)

  } catch (error) {
    console.error('Payment creation error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: 'Failed to create payment. Please try again.'
    })
  }
}