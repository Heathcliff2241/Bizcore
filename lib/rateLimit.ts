// In-memory cache
const failedAttempts = new Map<string, { count: number; resetTime: number }>()

/**
 * Check if user is rate limited based on failed attempts (persistent across page refreshes)
 */
export function isRateLimited(key: string, maxAttempts = 5, windowMs = 900000) {
  // Bypass rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return false
  }

  const now = Date.now()
  const record = failedAttempts.get(key)

  if (!record || now > record.resetTime) {
    return false
  }

  return record.count >= maxAttempts
}

/**
 * Record a failed attempt (persists to in-memory map)
 */
export function recordFailedAttempt(key: string, windowMs = 900000) {
  // Defensive: ignore blank keys to avoid accidentally rate-limiting all users
  if (!key || !String(key).trim()) {
    console.warn('[RATE_LIMIT] Ignoring attempt for empty key')
    return
  }
  const now = Date.now()
  const record = failedAttempts.get(key)

  if (!record || now > record.resetTime) {
    failedAttempts.set(key, { count: 1, resetTime: now + windowMs })
  } else {
    record.count++
  }
}

/**
 * Clear failed attempts (called on successful login)
 */
export function clearFailedAttempts(key: string) {
  if (!key || !String(key).trim()) {
    return
  }
  failedAttempts.delete(key)
}

/**
 * Get remaining time in seconds until rate limit resets (for UI display - CLIENT ONLY)
 */
export function getRateLimitTimeRemaining(key: string): number {
  // Only works on client
  if (typeof window === 'undefined') {
    return 0
  }

  try {
    const stored = localStorage.getItem('bizcore_rate_limit')
    if (!stored) {
      return 0
    }

    const allRecords = JSON.parse(stored) as Record<string, { count: number; resetTime: number }>
    const record = allRecords[key]

    if (!record) {
      return 0
    }

    const now = Date.now()
    const remaining = record.resetTime - now

    return remaining > 0 ? Math.ceil(remaining / 1000) : 0
  } catch (err) {
    console.error('[RATE_LIMIT] Failed to get time remaining:', err)
    return 0
  }
}

/**
 * Get the time remaining from server-side attempt (used to populate localStorage on client)
 */
export function getServerSideTimeRemaining(key: string): number {
  const now = Date.now()
  const record = failedAttempts.get(key)

  if (!record || now > record.resetTime) {
    return 0
  }

  const remaining = record.resetTime - now
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0
}
