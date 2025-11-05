import { signJwt, verifyJwt, hashPassword, verifyPassword } from '@/lib/auth';

const OLD_ENV = process.env;

describe('auth helpers', () => {
  beforeEach(() => {
    process.env = { ...OLD_ENV, JWT_SECRET: 'test-secret' };
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  test('signJwt + verifyJwt happy path', () => {
    const token = signJwt({ sub: '123' }, { expiresIn: '1h' });
    const payload = verifyJwt<{ sub: string }>(token, { aud: 'app', iss: 'bank-portal' });
    expect(payload?.sub).toBe('123');
  });

  test('verifyJwt returns null on bad audience', () => {
    const token = signJwt({ sub: 'x' }, { expiresIn: '10m' });
    const payload = verifyJwt<{ sub: string }>(token, { aud: 'wrong', iss: 'bank-portal' });
    expect(payload).toBeNull();
  });

  test('hash/verify password', async () => {
    const h = await hashPassword('passw0rd!');
    await expect(verifyPassword('passw0rd!', h)).resolves.toBe(true);
    await expect(verifyPassword('nope', h)).resolves.toBe(false);
  });
});
