import { createHash } from 'crypto'

interface Entry<T = unknown> {
  bodyHash: string;
  expiresAt: number;
  responseJson?: T;
}

type WriteFunction<T> = (responseJson: T) => void;

// Persist across HMR / multi-workers in dev:
const g = globalThis as unknown as { __idemStore?: Map<string, Entry> }
g.__idemStore ??= new Map<string, Entry>()
const store = g.__idemStore

const TTL_MS = 10 * 60 * 1000 // 10 minutes

function sha256(input: string) {
  return createHash('sha256').update(input).digest('hex')
}

export function rememberRequest<T = unknown>(
  key: string, 
  route: string, 
  body: unknown
): { hit: Entry<T> | null; write: WriteFunction<T> } {
  const now = Date.now()
  // cleanup occasionally
  for (const [k, v] of store) if (v.expiresAt < now) store.delete(k)

  const fullKey = `${route}:${key}`
  const hash = sha256(typeof body === 'string' ? body : JSON.stringify(body ?? {}))
  const existing = store.get(fullKey)
  const hit = existing?.bodyHash === hash ? (existing as Entry<T>) : null;
  
  return {
    hit,
    write: (responseJson: T) => {
      store.set(fullKey, { 
        bodyHash: hash, 
        expiresAt: now + TTL_MS, 
        responseJson 
      });
    }
  }
}
