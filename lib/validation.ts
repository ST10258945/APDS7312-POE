// lib/validation.ts
// Comprehensive input validation using RegEx patterns for whitelisting approach
// This ensures only safe, expected characters are allowed in user inputs

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: string;
}

/**
 * RegEx patterns for input validation (WHITELIST APPROACH)
 * Only allows specific, safe characters - rejects everything else
 */
export const REGEX_PATTERNS = {
  // Email: Standard email format, no special characters that could be exploited
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

  // Password: Minimum security requirements, no SQL injection characters
  // Must be 8-128 chars, include uppercase, lowercase, number, special char
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{}|;:,.<>?]{8,128}$/,

  // Full name: Letters, spaces, hyphens, apostrophes only (international names)
  FULL_NAME: /^[a-zA-ZÀ-ÿĀ-žА-я\s'-]{2,100}$/,

  // South African ID Number: Exactly 13 digits
  SA_ID_NUMBER: /^[0-9]{13}$/,

  // Bank account number: 8-12 digits (South African standard)
  ACCOUNT_NUMBER: /^[0-9]{8,12}$/,

  // SWIFT/BIC Code: 8 or 11 characters, letters and numbers only
  SWIFT_CODE: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,

  // ISO 4217 Currency codes: 3 uppercase letters
  CURRENCY_CODE: /^[A-Z]{3}$/,

  // Payment amount: Positive decimal number, max 2 decimal places, reasonable limits
  AMOUNT: /^(?!0(\.00?)?$)\d{1,10}(\.\d{1,2})?$/,

  // Username: Alphanumeric with limited special characters
  USERNAME: /^[a-zA-Z0-9._-]{3,30}$/,

  // Payment provider name: Letters, spaces, and safe punctuation only
  PROVIDER_NAME: /^[a-zA-Z\s&.-]{2,50}$/,

  // Recipient name: Same as full name but allow for company names
  RECIPIENT_NAME: /^[a-zA-ZÀ-ÿĀ-žА-я0-9\s'.-]{2,100}$/,

  // Payment reference: Alphanumeric with safe special characters
  PAYMENT_REFERENCE: /^[a-zA-Z0-9\s\-_\.]{1,50}$/,

  // Phone number: International format with country code
  PHONE_NUMBER: /^\+[1-9]\d{1,14}$/,

  // Address: Letters, numbers, spaces, and common punctuation
  ADDRESS: /^[a-zA-Z0-9\s,.'#-]{5,200}$/,

  // Employee ID: Alphanumeric employee identifier
  EMPLOYEE_ID: /^[a-zA-Z0-9]{3,20}$/,

  // Transaction ID: System-generated transaction identifier
  TRANSACTION_ID: /^[a-zA-Z0-9-]{10,50}$/,
} as const;

/**
 * Validation functions for each input type
 */

export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required and must be a string' };
  }
  
  const trimmed = email.trim().toLowerCase();
  
  if (!REGEX_PATTERNS.EMAIL.test(trimmed)) {
    return { isValid: false, error: 'Invalid email format. Only standard email addresses are allowed.' };
  }
  
  return { isValid: true, sanitized: trimmed };
}

export function validatePassword(password: string): ValidationResult {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required and must be a string' };
  }
  
  if (!REGEX_PATTERNS.PASSWORD.test(password)) {
    return { 
      isValid: false, 
      error: 'Password must be 8-128 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.' 
    };
  }
  
  return { isValid: true, sanitized: password };
}

export function validateFullName(name: string): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Full name is required and must be a string' };
  }
  
  const trimmed = name.trim();
  
  if (!REGEX_PATTERNS.FULL_NAME.test(trimmed)) {
    return { isValid: false, error: 'Full name can only contain letters, spaces, hyphens, and apostrophes (2-100 characters).' };
  }
  
  return { isValid: true, sanitized: trimmed };
}

export function validateSAIdNumber(idNumber: string): ValidationResult {
  if (!idNumber || typeof idNumber !== 'string') {
    return { isValid: false, error: 'ID number is required and must be a string' };
  }
  
  const trimmed = idNumber.trim();
  
  if (!REGEX_PATTERNS.SA_ID_NUMBER.test(trimmed)) {
    return { isValid: false, error: 'South African ID number must be exactly 13 digits.' };
  }
  
  return { isValid: true, sanitized: trimmed };
}

export function validateAccountNumber(accountNumber: string): ValidationResult {
  if (!accountNumber || typeof accountNumber !== 'string') {
    return { isValid: false, error: 'Account number is required and must be a string' };
  }
  
  const trimmed = accountNumber.trim();
  
  if (!REGEX_PATTERNS.ACCOUNT_NUMBER.test(trimmed)) {
    return { isValid: false, error: 'Account number must be 8-12 digits only.' };
  }
  
  return { isValid: true, sanitized: trimmed };
}

export function validateSwiftCode(swiftCode: string): ValidationResult {
  if (!swiftCode || typeof swiftCode !== 'string') {
    return { isValid: false, error: 'SWIFT code is required and must be a string' };
  }
  
  const trimmed = swiftCode.trim().toUpperCase();
  
  if (!REGEX_PATTERNS.SWIFT_CODE.test(trimmed)) {
    return { isValid: false, error: 'SWIFT code must be 8 or 11 characters (letters and numbers only).' };
  }
  
  return { isValid: true, sanitized: trimmed };
}

export function validateCurrencyCode(currencyCode: string): ValidationResult {
  if (!currencyCode || typeof currencyCode !== 'string') {
    return { isValid: false, error: 'Currency code is required and must be a string' };
  }
  
  const trimmed = currencyCode.trim().toUpperCase();
  
  if (!REGEX_PATTERNS.CURRENCY_CODE.test(trimmed)) {
    return { isValid: false, error: 'Currency code must be exactly 3 uppercase letters (ISO 4217 format).' };
  }
  
  // Additional validation for common currency codes
  const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'ZAR', 'AUD', 'CAD', 'CHF', 'CNY', 'INR'];
  if (!validCurrencies.includes(trimmed)) {
    return { isValid: false, error: 'Unsupported currency code. Please use a valid ISO 4217 currency code.' };
  }
  
  return { isValid: true, sanitized: trimmed };
}

export function validateAmount(amount: string): ValidationResult {
  if (!amount || typeof amount !== 'string') {
    return { isValid: false, error: 'Amount is required and must be a string' };
  }
  
  const trimmed = amount.trim();
  
  if (!REGEX_PATTERNS.AMOUNT.test(trimmed)) {
    return { isValid: false, error: 'Amount must be a positive number with up to 2 decimal places (max 10 digits before decimal).' };
  }
  
  const numericAmount = parseFloat(trimmed);
  if (numericAmount < 0.01 || numericAmount > 999999999.99) {
    return { isValid: false, error: 'Amount must be between 0.01 and 999,999,999.99.' };
  }
  
  return { isValid: true, sanitized: trimmed };
}

export function validateUsername(username: string): ValidationResult {
  if (!username || typeof username !== 'string') {
    return { isValid: false, error: 'Username is required and must be a string' };
  }
  
  const trimmed = username.trim().toLowerCase();
  
  if (!REGEX_PATTERNS.USERNAME.test(trimmed)) {
    return { isValid: false, error: 'Username must be 3-30 characters and can only contain letters, numbers, dots, underscores, and hyphens.' };
  }
  
  return { isValid: true, sanitized: trimmed };
}

export function validateProviderName(providerName: string): ValidationResult {
  if (!providerName || typeof providerName !== 'string') {
    return { isValid: false, error: 'Provider name is required and must be a string' };
  }
  
  const trimmed = providerName.trim();
  
  if (!REGEX_PATTERNS.PROVIDER_NAME.test(trimmed)) {
    return { isValid: false, error: 'Provider name can only contain letters, spaces, ampersands, dots, and hyphens (2-50 characters).' };
  }
  
  return { isValid: true, sanitized: trimmed };
}

export function validateRecipientName(recipientName: string): ValidationResult {
  if (!recipientName || typeof recipientName !== 'string') {
    return { isValid: false, error: 'Recipient name is required and must be a string' };
  }
  
  const trimmed = recipientName.trim();
  
  if (!REGEX_PATTERNS.RECIPIENT_NAME.test(trimmed)) {
    return { isValid: false, error: 'Recipient name can only contain letters, numbers, spaces, apostrophes, dots, and hyphens (2-100 characters).' };
  }
  
  return { isValid: true, sanitized: trimmed };
}

export function validatePaymentReference(reference: string): ValidationResult {
  if (!reference || typeof reference !== 'string') {
    return { isValid: false, error: 'Payment reference is required and must be a string' };
  }
  
  const trimmed = reference.trim();
  
  if (!REGEX_PATTERNS.PAYMENT_REFERENCE.test(trimmed)) {
    return { isValid: false, error: 'Payment reference can only contain letters, numbers, spaces, hyphens, underscores, and dots (1-50 characters).' };
  }
  
  return { isValid: true, sanitized: trimmed };
}

export function validateEmployeeId(employeeId: string): ValidationResult {
  if (!employeeId || typeof employeeId !== 'string') {
    return { isValid: false, error: 'Employee ID is required and must be a string' };
  }
  
  const trimmed = employeeId.trim().toUpperCase();
  
  if (!REGEX_PATTERNS.EMPLOYEE_ID.test(trimmed)) {
    return { isValid: false, error: 'Employee ID must be 3-20 alphanumeric characters only.' };
  }
  
  return { isValid: true, sanitized: trimmed };
}

/**
 * Multi-field validation function
 * Validates an object containing multiple fields
 */
export function validateFields(data: Record<string, any>, validationSchema: Record<string, (value: any) => ValidationResult>): { isValid: boolean; errors: Record<string, string>; sanitized: Record<string, any> } {
  const errors: Record<string, string> = {};
  const sanitized: Record<string, any> = {};
  
  for (const [field, validator] of Object.entries(validationSchema)) {
    const value = data[field];
    const result = validator(value);
    
    if (!result.isValid) {
      errors[field] = result.error!;
    } else {
      sanitized[field] = result.sanitized ?? value;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized
  };
}

/**
 * Sanitize input by removing potentially dangerous characters
 * This is a fallback for cases where strict validation isn't possible
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    // Remove null bytes and control characters
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Remove SQL injection patterns
    .replace(/[';\"\\]/g, '')
    // Remove script tags
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    // Remove other HTML tags
    .replace(/<[^>]*>/g, '')
    // Limit length to prevent DoS
    .substring(0, 1000);
}

/**
 * Check for common injection patterns
 */
export function containsInjectionPatterns(input: string): boolean {
  if (typeof input !== 'string') return false
  // Minimal, robust blacklist: any quote or semicolon, or SQL comment tokens
  // Keep the regex simple so it won't break the build (broke during testing)
  const re = /['";]|--|\/\*|\*\//
  return re.test(input)
}

/**
 * Comprehensive input validation middleware
 */
export function validateInput(input: string, type: keyof typeof REGEX_PATTERNS): ValidationResult {
  if (containsInjectionPatterns(input)) {
    return { isValid: false, error: 'Input contains potentially dangerous patterns' };
  }
  
  const pattern = REGEX_PATTERNS[type];
  if (!pattern.test(input)) {
    return { isValid: false, error: `Invalid ${type.toLowerCase()} format` };
  }
  
  return { isValid: true, sanitized: input };
}
