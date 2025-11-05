import { sanitizeInput, containsInjectionPatterns, validateInput, REGEX_PATTERNS } from '../lib/validation';

describe('sanitizeInput extras', () => {
  test('removes control characters incl. DEL (\\u007F)', () => {
    const raw = `hi\u0000\u0001middle\u007Fend`;
    expect(sanitizeInput(raw)).toBe('himiddleend');
  });

  test('strips <script> blocks case-insensitively', () => {
    const raw = 'a<ScRiPt>alert(1)</sCrIpT>b';
    expect(sanitizeInput(raw)).toBe('ab');
  });

  test('removes other HTML tags after script removal', () => {
    const raw = '<b>bold</b><i>i</i>';
    expect(sanitizeInput(raw)).toBe('boldi');
  });
});

describe('containsInjectionPatterns / validateInput smoke', () => {
  test('flags basic SQL-ish patterns and allows safe strings', () => {
    expect(containsInjectionPatterns(`abc' OR 1=1 --`)).toBe(true);
    expect(containsInjectionPatterns('plain text')).toBe(false);
  });

  test('validateInput passes a known-good USERNAME and fails bad one', () => {
    expect(validateInput('good-user_01', 'USERNAME').isValid).toBe(true);
    expect(validateInput('bad space', 'USERNAME').isValid).toBe(false);
  });
});
