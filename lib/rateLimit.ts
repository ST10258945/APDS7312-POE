const buckets = new Map<string, { tokens: number; ts: number }>()

function getCapacity() {
  const raw = process.env.RATE_LIMIT_MAX
  const parsed = raw ? Number.parseInt(raw, 10) : NaN
  // default capacity 3 if invalid
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3
}

function getWindowMs() {
  const raw = process.env.RATE_LIMIT_WINDOW_MS
  const parsed = raw ? Number.parseInt(raw, 10) : NaN
  // default 60_000ms if invalid
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60_000
}

function isBypassed() {
  return (
    process.env.DISABLE_RATE_LIMIT === 'true' ||
    process.env.NODE_ENV === 'test' // tests should not be affected
  )
}

export function rateLimit(key: string) {
  if (isBypassed()) return true

  const CAPACITY = getCapacity()
  const WINDOW_MS = getWindowMs()

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
