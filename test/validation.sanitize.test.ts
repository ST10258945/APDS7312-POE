import { sanitizeInput, containsInjectionPatterns } from '../lib/validation';

test('sanitizeInput removes script blocks and html', () => {
  const dirty = 'Hi<script>alert(1)</script><b>bold</b>';
  const clean = sanitizeInput(dirty);
  expect(clean).toBe('Hibold'); // tags removed, content kept
});

test('containsInjectionPatterns flags dangerous tokens', () => {
  expect(containsInjectionPatterns("abc' OR 1=1 --")).toBe(true);
  expect(containsInjectionPatterns('normal text')).toBe(false);
});
