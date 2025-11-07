/**
 * Comprehensive validation tests for additional coverage
 */

import {
  validateEmail,
  validatePassword,
  validateFullName,
  validateSAIdNumber,
  validateAccountNumber,
  validateSwiftCode,
  validateCurrencyCode,
  validateAmount,
  validateUsername,
  validateProviderName,
  validateRecipientName,
  validatePaymentReference,
  validateEmployeeId,
} from '@/lib/validation'

describe('Validation Functions - Edge Cases', () => {
  describe('validateEmail', () => {
    it('should reject empty string', () => {
      const result = validateEmail('')
      expect(result.isValid).toBe(false)
    })

    it('should reject email without @', () => {
      const result = validateEmail('invalidemail.com')
      expect(result.isValid).toBe(false)
    })

    it('should reject email without domain', () => {
      const result = validateEmail('user@')
      expect(result.isValid).toBe(false)
    })

    it('should accept valid email and trim whitespace', () => {
      const result = validateEmail('  user@example.com  ')
      expect(result.isValid).toBe(true)
      expect(result.sanitized).toBe('user@example.com')
    })

    it('should reject non-string input', () => {
      const result = validateEmail(123 as never)
      expect(result.isValid).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('should reject empty password', () => {
      const result = validatePassword('')
      expect(result.isValid).toBe(false)
    })

    it('should reject short password', () => {
      const result = validatePassword('Short1!')
      expect(result.isValid).toBe(false)
    })

    it('should reject password without uppercase', () => {
      const result = validatePassword('password123!')
      expect(result.isValid).toBe(false)
    })

    it('should reject password without lowercase', () => {
      const result = validatePassword('PASSWORD123!')
      expect(result.isValid).toBe(false)
    })

    it('should reject password without number', () => {
      const result = validatePassword('Password!')
      expect(result.isValid).toBe(false)
    })

    it('should reject password without special char', () => {
      const result = validatePassword('Password123')
      expect(result.isValid).toBe(false)
    })

    it('should accept valid password', () => {
      const result = validatePassword('SecurePass123!')
      expect(result.isValid).toBe(true)
    })

    it('should reject non-string input', () => {
      const result = validatePassword(null as never)
      expect(result.isValid).toBe(false)
    })
  })

  describe('validateFullName', () => {
    it('should reject empty name', () => {
      const result = validateFullName('')
      expect(result.isValid).toBe(false)
    })

    it('should reject name with numbers', () => {
      const result = validateFullName('John123 Doe')
      expect(result.isValid).toBe(false)
    })

    it('should accept name with hyphens', () => {
      const result = validateFullName('Mary-Jane Smith')
      expect(result.isValid).toBe(true)
    })

    it('should accept name with apostrophes', () => {
      const result = validateFullName("O'Brien")
      expect(result.isValid).toBe(true)
    })

    it('should trim whitespace', () => {
      const result = validateFullName('  John Doe  ')
      expect(result.isValid).toBe(true)
      expect(result.sanitized).toBe('John Doe')
    })
  })

  describe('validateSAIdNumber', () => {
    it('should reject empty ID', () => {
      const result = validateSAIdNumber('')
      expect(result.isValid).toBe(false)
    })

    it('should reject ID with less than 13 digits', () => {
      const result = validateSAIdNumber('123456789012')
      expect(result.isValid).toBe(false)
    })

    it('should reject ID with more than 13 digits', () => {
      const result = validateSAIdNumber('12345678901234')
      expect(result.isValid).toBe(false)
    })

    it('should reject ID with letters', () => {
      const result = validateSAIdNumber('123456789012A')
      expect(result.isValid).toBe(false)
    })

    it('should accept valid 13-digit ID', () => {
      const result = validateSAIdNumber('9001015009087')
      expect(result.isValid).toBe(true)
    })
  })

  describe('validateAccountNumber', () => {
    it('should reject empty account number', () => {
      const result = validateAccountNumber('')
      expect(result.isValid).toBe(false)
    })

    it('should reject account number too short', () => {
      const result = validateAccountNumber('1234567')
      expect(result.isValid).toBe(false)
    })

    it('should reject account number too long', () => {
      const result = validateAccountNumber('1234567890123')
      expect(result.isValid).toBe(false)
    })

    it('should accept valid account number', () => {
      const result = validateAccountNumber('1234567890')
      expect(result.isValid).toBe(true)
    })
  })

  describe('validateSwiftCode', () => {
    it('should reject empty SWIFT code', () => {
      const result = validateSwiftCode('')
      expect(result.isValid).toBe(false)
    })

    it('should reject SWIFT code too short', () => {
      const result = validateSwiftCode('ABC')
      expect(result.isValid).toBe(false)
    })

    it('should reject SWIFT code too long', () => {
      const result = validateSwiftCode('ABCDEFGHIJK123')
      expect(result.isValid).toBe(false)
    })

    it('should accept 8-character SWIFT code', () => {
      const result = validateSwiftCode('ABCDZAJJ')
      expect(result.isValid).toBe(true)
    })

    it('should accept 11-character SWIFT code', () => {
      const result = validateSwiftCode('ABCDZAJJXXX')
      expect(result.isValid).toBe(true)
    })
  })

  describe('validateCurrencyCode', () => {
    it('should reject empty currency code', () => {
      const result = validateCurrencyCode('')
      expect(result.isValid).toBe(false)
    })

    it('should reject invalid currency code', () => {
      const result = validateCurrencyCode('INVALID')
      expect(result.isValid).toBe(false)
    })

    it('should accept USD', () => {
      const result = validateCurrencyCode('USD')
      expect(result.isValid).toBe(true)
    })

    it('should accept EUR', () => {
      const result = validateCurrencyCode('EUR')
      expect(result.isValid).toBe(true)
    })

    it('should accept ZAR', () => {
      const result = validateCurrencyCode('ZAR')
      expect(result.isValid).toBe(true)
    })
  })

  describe('validateAmount', () => {
    it('should reject empty amount', () => {
      const result = validateAmount('')
      expect(result.isValid).toBe(false)
    })

    it('should reject negative amount', () => {
      const result = validateAmount('-100.00')
      expect(result.isValid).toBe(false)
    })

    it('should reject zero amount', () => {
      const result = validateAmount('0.00')
      expect(result.isValid).toBe(false)
    })

    it('should accept valid amount with decimals', () => {
      const result = validateAmount('100.50')
      expect(result.isValid).toBe(true)
    })

    it('should accept valid amount without decimals', () => {
      const result = validateAmount('100')
      expect(result.isValid).toBe(true)
    })

    it('should reject amount with more than 2 decimals', () => {
      const result = validateAmount('100.123')
      expect(result.isValid).toBe(false)
    })
  })

  describe('validateUsername', () => {
    it('should reject empty username', () => {
      const result = validateUsername('')
      expect(result.isValid).toBe(false)
    })

    it('should reject username too short', () => {
      const result = validateUsername('ab')
      expect(result.isValid).toBe(false)
    })

    it('should reject username with spaces', () => {
      const result = validateUsername('user name')
      expect(result.isValid).toBe(false)
    })

    it('should accept valid username', () => {
      const result = validateUsername('user123')
      expect(result.isValid).toBe(true)
    })

    it('should accept username with underscores', () => {
      const result = validateUsername('user_name')
      expect(result.isValid).toBe(true)
    })
  })

  describe('validateProviderName', () => {
    it('should reject empty provider name', () => {
      const result = validateProviderName('')
      expect(result.isValid).toBe(false)
    })

    it('should accept valid provider name', () => {
      const result = validateProviderName('ACME Corp')
      expect(result.isValid).toBe(true)
    })
  })

  describe('validateRecipientName', () => {
    it('should reject empty recipient name', () => {
      const result = validateRecipientName('')
      expect(result.isValid).toBe(false)
    })

    it('should accept valid recipient name', () => {
      const result = validateRecipientName('John Doe')
      expect(result.isValid).toBe(true)
    })
  })

  describe('validatePaymentReference', () => {
    it('should reject empty reference', () => {
      const result = validatePaymentReference('')
      expect(result.isValid).toBe(false)
    })

    it('should accept valid reference', () => {
      const result = validatePaymentReference('INV-2024-001')
      expect(result.isValid).toBe(true)
    })
  })

  describe('validateEmployeeId', () => {
    it('should reject empty employee ID', () => {
      const result = validateEmployeeId('')
      expect(result.isValid).toBe(false)
    })

    it('should accept valid employee ID', () => {
      const result = validateEmployeeId('EMP001')
      expect(result.isValid).toBe(true)
    })
  })
})
