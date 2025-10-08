import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 12)
const JWT_SECRET = process.env.JWT_SECRET!

export async function hashPassword(p: string) {
  return bcrypt.hash(p, ROUNDS)
}
export async function verifyPassword(p: string, h: string) {
  return bcrypt.compare(p, h)
}

// signJwt now accepts standard jwt.SignOptions
export function signJwt(payload: object, opts?: jwt.SignOptions) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h', ...(opts ?? {}) })
}

/** Safe verify that returns null on failure instead of throwing */
export function verifyJwt<T = any>(token: string): T | null {
  try {
    return jwt.verify(token, JWT_SECRET) as T
  } catch {
    return null
  }
}