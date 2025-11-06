/**
 * Centralized error handling utilities
 * Maps technical error messages to user-friendly messages
 */

export type ErrorType = 'csrf' | 'auth' | 'validation' | 'rate-limit' | 'network' | 'unknown'

export interface ErrorMapping {
  type: ErrorType
  userMessage: string
  shouldRedirect?: boolean
  redirectPath?: string
}

/**
 * Maps technical error messages to user-friendly messages
 */
export function mapErrorToUserMessage(error: unknown): ErrorMapping {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const lowerMessage = errorMessage.toLowerCase()

  // CSRF token errors
  if (lowerMessage.includes('csrf') || lowerMessage.includes('token validation')) {
    return {
      type: 'csrf',
      userMessage: 'Session expired. Please refresh the page and try again.',
    }
  }

  // Authentication errors
  if (
    lowerMessage.includes('authenticated') ||
    lowerMessage.includes('forbidden') ||
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('session expired')
  ) {
    return {
      type: 'auth',
      userMessage: 'Your session has expired. Please log in again.',
      shouldRedirect: true,
      redirectPath: '/customer/login',
    }
  }

  if (
    lowerMessage.includes('invalid credentials') ||
    lowerMessage.includes('invalid') ||
    lowerMessage.includes('credentials') ||
    lowerMessage.includes('password') ||
    lowerMessage.includes('username')
  ) {
    return {
      type: 'auth',
      userMessage: 'Invalid credentials. Please check your username and password.',
    }
  }

  // Rate limiting errors
  if (
    lowerMessage.includes('too many') ||
    lowerMessage.includes('rate limit') ||
    lowerMessage.includes('429')
  ) {
    return {
      type: 'rate-limit',
      userMessage: 'Too many requests. Please wait a moment and try again.',
    }
  }

  // Validation errors - keep as-is for specific feedback
  if (lowerMessage.includes('format') || lowerMessage.includes('invalid')) {
    return {
      type: 'validation',
      userMessage: errorMessage, // Keep validation messages as-is
    }
  }

  // Network errors
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('fetch') ||
    lowerMessage.includes('connection') ||
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('failed to fetch')
  ) {
    return {
      type: 'network',
      userMessage: 'Unable to connect to the server. Please check your connection and try again.',
    }
  }

  // Account-related errors
  if (lowerMessage.includes('already exists') || lowerMessage.includes('unique')) {
    return {
      type: 'validation',
      userMessage: 'An account with this email, username, or ID number already exists.',
    }
  }

  if (lowerMessage.includes('inactive')) {
    return {
      type: 'auth',
      userMessage: 'Account is inactive. Please contact your administrator.',
    }
  }

  // Unknown error - return original message or generic
  return {
    type: 'unknown',
    userMessage: errorMessage || 'An unexpected error occurred. Please try again.',
  }
}

/**
 * Extracts error message from API response
 */
export function extractErrorMessage(response: { error?: string; message?: string }): string {
  return response.error || response.message || 'An error occurred'
}
