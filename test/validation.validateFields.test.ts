import { validateFields, validateUsername, REGEX_PATTERNS } from '@/lib/validation';

describe('validateFields', () => {
  test('collects errors and sanitized values', () => {
    const data = { u: 'good-user', bad: '!' };
    const result = validateFields(data, {
      u: (v) => validateUsername(String(v)),
      bad: (v) => ({ isValid: REGEX_PATTERNS.USERNAME.test(String(v)), error: 'nope' }),
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.bad).toBe('nope');
    expect(result.sanitized.u).toBe('good-user');
  });
});
