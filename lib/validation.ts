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
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{}|;:,.<>?])[A-Za-z\d!@#$%^&*()_+\-=[\]{}|;:,.<>?]{8,128}$/,

  // Full name: Letters, spaces, hyphens, apostrophes only (international names)
  FULL_NAME: /^[a-zA-ZÀ-ÿĀ-žА-я\s'-]{2,100}$/,

  // South African ID Number: Exactly 13 digits
  SA_ID_NUMBER: /^\d{13}$/,

  // Bank account number: 8-12 digits (South African standard)
  ACCOUNT_NUMBER:/^\d{8,12}$/,

  // SWIFT/BIC Code: 6 or 11 characters, letters and numbers only
  SWIFT_CODE: /^[A-Z0-9]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,

  // ISO 4217 Currency codes: 3 uppercase letters
  CURRENCY_CODE: /^[A-Z]{3}$/,

  // Payment amount: Positive decimal number, max 2 decimal places, reasonable limits
  AMOUNT: /^(?!0(\.00?)?$)\d{1,10}(\.\d{1,2})?$/,

  // Username: Alphanumeric with limited special characters
  USERNAME: /^[a-zA-Z0-9._-]{3,30}$/,

  // Payment provider name: Letters, spaces, and safe punctuation only
  PROVIDER_NAME: /^[a-zA-Z\s&.-]{2,50}$/,

  // Recipient name: Letters (required), spaces, numbers, apostrophes, dots, hyphens - must contain at least one letter
  RECIPIENT_NAME: /^(?=.*[a-zA-ZÀ-ÿĀ-žА-я])[a-zA-ZÀ-ÿĀ-žА-я0-9\s'.-]{2,100}$/,

  // Payment reference: Alphanumeric with safe special characters
  PAYMENT_REFERENCE: /^[A-Za-z0-9\s_.-]{1,50}$/,

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
  if (typeof email !== 'string') return { isValid: false, error: 'Email is required and must be a string' };
  if (email.length === 0) return { isValid: false, error: 'Email is required and must be a string' };


  const trimmed = email.trim().toLowerCase();

  if (!REGEX_PATTERNS.EMAIL.test(trimmed)) {
    return { isValid: false, error: 'Invalid email format. Only standard email addresses are allowed.' };
  }

  return { isValid: true, sanitized: trimmed };
}

export function validatePassword(password: string): ValidationResult {
  if (typeof password !== 'string' || password.length === 0) {
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
  if (typeof name !== 'string' || name.length === 0) {
    return { isValid: false, error: 'Full name is required and must be a string' };
  }

  const trimmed = name.trim();

  if (!REGEX_PATTERNS.FULL_NAME.test(trimmed)) {
    return { isValid: false, error: 'Full name can only contain letters, spaces, hyphens, and apostrophes (2-100 characters).' };
  }

  return { isValid: true, sanitized: trimmed };
}

export function validateSAIdNumber(idNumber: string): ValidationResult {
  if (typeof idNumber !== 'string' || idNumber.length === 0) {
    return { isValid: false, error: 'ID number is required and must be a string' };
  }

  const trimmed = idNumber.trim();

  if (!REGEX_PATTERNS.SA_ID_NUMBER.test(trimmed)) {
    return { isValid: false, error: 'South African ID number must be exactly 13 digits.' };
  }

  return { isValid: true, sanitized: trimmed };
}

export function validateAccountNumber(accountNumber: string): ValidationResult {
  if (typeof accountNumber !== 'string' || accountNumber.length === 0) {
    return { isValid: false, error: 'Account number is required and must be a string' };
  }

  const trimmed = accountNumber.trim();

  if (!REGEX_PATTERNS.ACCOUNT_NUMBER.test(trimmed)) {
    return { isValid: false, error: 'Account number must be 8-12 digits only.' };
  }

  return { isValid: true, sanitized: trimmed };
}

export function validateSwiftCode(swiftCode: string): ValidationResult {
  if (typeof swiftCode !== 'string' || swiftCode.length === 0) {
    return { isValid: false, error: 'SWIFT code is required and must be a string' };
  }

  const trimmed = swiftCode.trim().toUpperCase();

  if (!REGEX_PATTERNS.SWIFT_CODE.test(trimmed)) {
    return { isValid: false, error: 'SWIFT code must be 8 or 11 characters (letters and numbers only).' };
  }

  return { isValid: true, sanitized: trimmed };
}

export function validateCurrencyCode(currencyCode: string): ValidationResult {
  if (typeof currencyCode !== 'string' || currencyCode.length === 0) {
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
  if (typeof amount !== 'string' || amount.length === 0) {
    return { isValid: false, error: 'Amount is required and must be a string' };
  }

  const trimmed = amount.trim();

  if (!REGEX_PATTERNS.AMOUNT.test(trimmed)) {
    return { isValid: false, error: 'Amount must be a positive number with up to 2 decimal places (max 10 digits before decimal).' };
  }

  const numericAmount = Number.parseFloat(trimmed);
  if (numericAmount < 0.01 || numericAmount > 999999999.99) {
    return { isValid: false, error: 'Amount must be between 0.01 and 999,999,999.99.' };
  }

  return { isValid: true, sanitized: trimmed };
}

export function validateUsername(username: string): ValidationResult {
  if (typeof username !== 'string' || username.length === 0) {
    return { isValid: false, error: 'Username is required and must be a string' };
  }

  const trimmed = username.trim().toLowerCase();

  if (!REGEX_PATTERNS.USERNAME.test(trimmed)) {
    return { isValid: false, error: 'Username must be 3-30 characters and can only contain letters, numbers, dots, underscores, and hyphens.' };
  }

  return { isValid: true, sanitized: trimmed };
}

export function validateProviderName(providerName: string): ValidationResult {
  if (typeof providerName !== 'string' || providerName.length === 0) {
    return { isValid: false, error: 'Provider name is required and must be a string' };
  }

  const trimmed = providerName.trim();

  if (!REGEX_PATTERNS.PROVIDER_NAME.test(trimmed)) {
    return { isValid: false, error: 'Provider name can only contain letters, spaces, ampersands, dots, and hyphens (2-50 characters).' };
  }

  return { isValid: true, sanitized: trimmed };
}

export function validateRecipientName(recipientName: string): ValidationResult {
  if (typeof recipientName !== 'string' || recipientName.length === 0) {
    return { isValid: false, error: 'Recipient name is required and must be a string' };
  }

  const trimmed = recipientName.trim();

  if (!REGEX_PATTERNS.RECIPIENT_NAME.test(trimmed)) {
    return { isValid: false, error: 'Recipient name can only contain letters, numbers, spaces, apostrophes, dots, and hyphens (2-100 characters).' };
  }

  return { isValid: true, sanitized: trimmed };
}

export function validatePaymentReference(reference: string): ValidationResult {
  if (typeof reference !== 'string' || reference.length === 0) {
    return { isValid: false, error: 'Payment reference is required and must be a string' };
  }

  const trimmed = reference.trim();

  if (!REGEX_PATTERNS.PAYMENT_REFERENCE.test(trimmed)) {
    return { isValid: false, error: 'Payment reference can only contain letters, numbers, spaces, hyphens, underscores, and dots (1-50 characters).' };
  }

  return { isValid: true, sanitized: trimmed };
}

export function validateEmployeeId(employeeId: string): ValidationResult {
  if (typeof employeeId !== 'string' || employeeId.length === 0) {
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

    if (result.isValid) {
      sanitized[field] = result.sanitized ?? value;
    } else {
      errors[field] = result.error ?? 'Invalid value';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized
  };
}

// Linear-time removal of <script>...</script> blocks (case-insensitive).
// Avoids backtracking risks in regex engines.
// Processes at most 10k chars to cap work and memory.
// Prevents found security hotspot
function stripScriptTags(input: string, max = 10_000): string {
  let s = input.slice(0, max);
  let lower = s.toLowerCase();

  let start = lower.indexOf('<script');
  while (start !== -1) {
    const end = lower.indexOf('</script>', start + 7);
    const cutTo = end === -1 ? s.length : end + 9; // include "</script>"
    s = s.slice(0, start) + s.slice(cutTo);
    lower = s.toLowerCase(); // keep in sync
    start = lower.indexOf('<script');
  }
  return s;
}

/**
 * Sanitize input by removing potentially dangerous characters
 * This is a fallback for cases where strict validation isn't possible
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string' || input.length === 0) return '';

  // Start with trimming, then run simple regex-based stripping where safe,
  // and use a linear-time helper for <script> blocks to avoid regex backtracking.
  let value = input.trim()
    // Remove null bytes and control characters
    .replaceAll(/\p{Cc}+/gu, '')
    // Remove SQL injection patterns
    .replaceAll(/[';"\\]/g, '');

  // Remove script tags (linear-time, no regex backtracking)
  value = stripScriptTags(value);

  // Remove other HTML tags
  value = value.replaceAll(/<[^>]*>/g, '');

  // Limit length to prevent DoS
  return value.substring(0, 1000);
}

/**
 * Check for common injection patterns
 */
export function containsInjectionPatterns(input: string): boolean {
  if (typeof input !== 'string') return false;
  // Minimal, robust blacklist: any quote or semicolon, or SQL comment tokens
  // Keep the regex simple so it won't break the build (broke during testing)
  const re = /['";]|--|\/\*|\*\//;
  return re.test(input);
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
