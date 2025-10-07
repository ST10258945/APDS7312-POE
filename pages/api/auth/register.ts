import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' })
  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) return res.status(409).json({ error: 'Email already registered' })
  const passwordHash = await hashPassword(password)
  const user = await prisma.user.create({ data: { email, passwordHash } })
  return res.status(201).json({ id: user.id })
}
