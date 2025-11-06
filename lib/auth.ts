import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const ROUNDS = Number.parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10)

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set')
}

const JWT_SECRET = process.env.JWT_SECRET

// JWT Payload Types
export interface BaseJwtPayload {
  iss: string
  aud: string
  iat: number
  exp: number
  [key: string]: unknown
}

export interface UserJwtPayload extends BaseJwtPayload {
  sub: string
  type: 'user' | 'employee' | 'customer'
  email: string
  role?: string
  employeeId?: string
}

export interface ActionJwtPayload extends BaseJwtPayload {
  sub: string
  action: string
  jti?: string
}

// Union type for all possible JWT payloads
export type JwtPayload = UserJwtPayload | ActionJwtPayload

export async function hashPassword(p: string) {
  return bcrypt.hash(p, ROUNDS)
}
export async function verifyPassword(p: string, h: string) {
  return bcrypt.compare(p, h)
}

// signJwt now accepts standard jwt.SignOptions
/**
 * Signs a JWT token with the given payload and options
 * @param payload The payload to sign
 * @param options JWT sign options
 * @returns Signed JWT token
 */
export function signJwt<T extends object>(
  payload: Omit<T, 'iss' | 'aud' | 'iat' | 'exp'>,
  options: jwt.SignOptions & { type?: 'user' | 'action' } = {}
): string {
  const { type = 'user', ...signOptions } = options
  
  const baseOptions: jwt.SignOptions = { 
    algorithm: 'HS256', 
    expiresIn: type === 'action' ? '15m' : '1h',
    issuer: 'bank-portal',
    audience: type === 'action' ? 'action-token' : 'app'
  }
  
  return jwt.sign(
    payload,
    JWT_SECRET,
    { ...baseOptions, ...signOptions }
  )
}

/**
 * Verifies a JWT token and returns its payload
 * @param token The JWT token to verify
 * @param options Options for verification including expected audience and issuer
 * @returns The decoded token payload or null if verification fails
 */
export function verifyJwt<T extends BaseJwtPayload>(
  token: string,
  options: { aud?: string; iss?: string } = {}
): T | null {
  const { aud = 'app', iss = 'bank-portal' } = options;
  
  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      audience: aud,
      issuer: iss,
    }) as T;

    // Additional runtime type checking
    if (!payload?.sub || !payload.iat || !payload.exp) {
      console.warn('JWT payload missing required fields');
      return null;
    }

    return payload;
  } catch (error) {
    if (error instanceof Error) {
      console.warn(`JWT verification failed: ${error.message}`);
    }
    return null;
  }
}