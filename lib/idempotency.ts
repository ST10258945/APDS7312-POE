import { createHash } from 'crypto'

type Entry<T = unknown> = { bodyHash: string; expiresAt: number; responseJson?: T }

// Persist across HMR / multi-workers in dev:
const g = globalThis as unknown as { __idemStore?: Map<string, Entry> }
g.__idemStore ??= new Map<string, Entry>()
const store = g.__idemStore

const TTL_MS = 10 * 60 * 1000 // 10 minutes

function sha256(input: string) {
  return createHash('sha256').update(input).digest('hex')
}

export function rememberRequest<T = unknown>(key: string, route: string, body: unknown): { hit: Entry<T> | null; write: (responseJson: T) => void } {
  const now = Date.now()
  // cleanup occasionally
  for (const [k, v] of store) if (v.expiresAt < now) store.delete(k)

  const fullKey = `${route}:${key}`
  const hash = sha256(typeof body === 'string' ? body : JSON.stringify(body ?? {}))
  const existing = store.get(fullKey)
  return {
    hit: (!!existing && existing.bodyHash === hash ? existing : null) as Entry<T> | null,
    write: (responseJson: T) => {
      store.set(fullKey, { bodyHash: hash, expiresAt: now + TTL_MS, responseJson })
    }
  }
}
