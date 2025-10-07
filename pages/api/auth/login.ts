import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'               // <- relative path
import { verifyPassword, signJwt } from '../../../lib/auth' // <- relative path

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })

  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

  const token = signJwt({ sub: user.id, email })
  return res.status(200).json({ token })
}
