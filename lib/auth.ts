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
export function signJwt(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' })
}
