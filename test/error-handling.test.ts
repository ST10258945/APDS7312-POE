/**
 * Tests for error-handling utilities
 */

import { mapErrorToUserMessage } from '@/lib/error-handling'

describe('mapErrorToUserMessage', () => {
  describe('CSRF token errors', () => {
    it('should map CSRF errors to user-friendly message', () => {
      const result = mapErrorToUserMessage('CSRF token validation failed')
      expect(result.type).toBe('csrf')
      expect(result.userMessage).toBe('Session expired. Please refresh the page and try again.')
      expect(result.shouldRedirect).toBeUndefined()
    })

    it('should handle token validation errors', () => {
      const result = mapErrorToUserMessage('token validation error')
      expect(result.type).toBe('csrf')
      expect(result.userMessage).toBe('Session expired. Please refresh the page and try again.')
    })

    it('should handle Error objects with CSRF message', () => {
      const error = new Error('CSRF validation failed')
      const result = mapErrorToUserMessage(error)
      expect(result.type).toBe('csrf')
    })
  })

  describe('Authentication errors', () => {
    it('should map authenticated errors with redirect', () => {
      const result = mapErrorToUserMessage('User not authenticated')
      expect(result.type).toBe('auth')
      expect(result.userMessage).toBe('Your session has expired. Please log in again.')
      expect(result.shouldRedirect).toBe(true)
      expect(result.redirectPath).toBe('/customer/login')
    })

    it('should handle forbidden errors', () => {
      const result = mapErrorToUserMessage('Forbidden access')
      expect(result.type).toBe('auth')
      expect(result.shouldRedirect).toBe(true)
    })

    it('should handle unauthorized errors', () => {
      const result = mapErrorToUserMessage('unauthorized request')
      expect(result.type).toBe('auth')
      expect(result.shouldRedirect).toBe(true)
    })

    it('should handle session expired errors', () => {
      const result = mapErrorToUserMessage('session expired')
      expect(result.type).toBe('auth')
      expect(result.shouldRedirect).toBe(true)
    })
  })

  describe('Validation errors', () => {
    it('should map format errors without invalid keyword', () => {
      const result = mapErrorToUserMessage('Wrong format for field')
      expect(result.type).toBe('validation')
      expect(result.userMessage).toBe('Wrong format for field')
    })

    it('should handle already exists errors', () => {
      const result = mapErrorToUserMessage('Email already exists')
      expect(result.type).toBe('validation')
      expect(result.userMessage).toBe('An account with this email, username, or ID number already exists.')
    })

    it('should handle unique constraint errors', () => {
      const result = mapErrorToUserMessage('Unique constraint violation')
      expect(result.type).toBe('validation')
      expect(result.userMessage).toBe('An account with this email, username, or ID number already exists.')
    })
  })

  describe('Rate limit errors', () => {
    it('should map rate limit errors', () => {
      const result = mapErrorToUserMessage('Rate limit exceeded')
      expect(result.type).toBe('rate-limit')
      expect(result.userMessage).toBe('Too many requests. Please wait a moment and try again.')
    })

    it('should handle too many requests errors', () => {
      const result = mapErrorToUserMessage('Too many requests from this IP')
      expect(result.type).toBe('rate-limit')
    })
  })

  describe('Network errors', () => {
    it('should map network errors', () => {
      const result = mapErrorToUserMessage('Network request failed')
      expect(result.type).toBe('network')
      expect(result.userMessage).toBe('Unable to connect to the server. Please check your connection and try again.')
    })

    it('should handle fetch errors', () => {
      const result = mapErrorToUserMessage('fetch failed')
      expect(result.type).toBe('network')
    })

    it('should handle connection errors', () => {
      const result = mapErrorToUserMessage('connection timeout')
      expect(result.type).toBe('network')
    })
  })

  describe('Unknown errors', () => {
    it('should map unknown errors', () => {
      const result = mapErrorToUserMessage('Some random error')
      expect(result.type).toBe('unknown')
      expect(result.userMessage).toBe('Some random error')
    })

    it('should handle Error objects with unknown message', () => {
      const error = new Error('Something went wrong')
      const result = mapErrorToUserMessage(error)
      expect(result.type).toBe('unknown')
    })

    it('should handle non-Error objects', () => {
      const result = mapErrorToUserMessage({ code: 500 })
      expect(result.type).toBe('unknown')
    })

    it('should handle null and undefined', () => {
      const nullResult = mapErrorToUserMessage(null)
      expect(nullResult.type).toBe('unknown')

      const undefinedResult = mapErrorToUserMessage(undefined)
      expect(undefinedResult.type).toBe('unknown')
    })

    it('should handle numbers', () => {
      const result = mapErrorToUserMessage(404)
      expect(result.type).toBe('unknown')
    })

    it('should handle boolean values', () => {
      const result = mapErrorToUserMessage(false)
      expect(result.type).toBe('unknown')
    })
  })

  describe('Case insensitivity', () => {
    it('should handle uppercase CSRF', () => {
      const result = mapErrorToUserMessage('CSRF TOKEN VALIDATION FAILED')
      expect(result.type).toBe('csrf')
    })

    it('should handle mixed case authentication', () => {
      const result = mapErrorToUserMessage('User Not Authenticated')
      expect(result.type).toBe('auth')
    })

    it('should handle uppercase format', () => {
      const result = mapErrorToUserMessage('WRONG FORMAT')
      expect(result.type).toBe('validation')
    })
  })
})

describe('extractErrorMessage', () => {
  it('should extract error from error property', () => {
    const { extractErrorMessage } = require('@/lib/error-handling')
    const result = extractErrorMessage({ error: 'Something went wrong' })
    expect(result).toBe('Something went wrong')
  })

  it('should extract error from message property', () => {
    const { extractErrorMessage } = require('@/lib/error-handling')
    const result = extractErrorMessage({ message: 'Error message' })
    expect(result).toBe('Error message')
  })

  it('should prefer error over message', () => {
    const { extractErrorMessage } = require('@/lib/error-handling')
    const result = extractErrorMessage({ error: 'Error text', message: 'Message text' })
    expect(result).toBe('Error text')
  })

  it('should return default message when no error or message', () => {
    const { extractErrorMessage } = require('@/lib/error-handling')
    const result = extractErrorMessage({})
    expect(result).toBe('An error occurred')
  })
})
