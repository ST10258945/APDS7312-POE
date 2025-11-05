import {
  sanitizeInput,
  validateAmount,
  validateCurrencyCode,
  validateFields,
  validateProviderName,
} from '../lib/validation';

describe('sanitizeInput edge cases', () => {
  test('removes <script> when closing tag is missing (cuts to end)', () => {
    const raw = 'x<script>alert(1)';
    // stripScriptTags should remove from "<script" to the end
    expect(sanitizeInput(raw)).toBe('x');
  });
});

describe('validation bounds/allow-list', () => {
  test('validateAmount fails when above max', () => {
    const over = '1000000000.00'; // > 999,999,999.99
    expect(validateAmount(over).isValid).toBe(false);
  });

  test('validateCurrencyCode fails when not in supported list', () => {
    // ABC matches the regex but is not in our supported currency allow-list
    const res = validateCurrencyCode('ABC');
    expect(res.isValid).toBe(false);
  });
});

describe('validateFields aggregates errors and sanitized values', () => {
  const schema = {
    provider: validateProviderName,
  };
  test('returns errors for bad field', () => {
    const r = validateFields({ provider: '$$' }, schema);
    expect(r.isValid).toBe(false);
    expect(Object.keys(r.errors)).toContain('provider');
  });

  test('returns sanitized for good field', () => {
    const r = validateFields({ provider: 'Acme Pay' }, schema);
    expect(r.isValid).toBe(true);
    expect(r.sanitized.provider).toBe('Acme Pay');
  });
});
