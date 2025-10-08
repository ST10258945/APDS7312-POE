type Key = string
const buckets = new Map<Key, { tokens: number; ts: number }>()
const CAPACITY = 30        // requests
const WINDOW_MS = 60_000   // per minute

export function rateLimit(key: Key) {
  const now = Date.now()
  const b = buckets.get(key) ?? { tokens: CAPACITY, ts: now }
  const refill = ((now - b.ts) / WINDOW_MS) * CAPACITY
  b.tokens = Math.min(CAPACITY, b.tokens + refill)
  b.ts = now
  if (b.tokens < 1) return false
  b.tokens -= 1
  buckets.set(key, b)
  return true
}
