/**
 * Rate Limiting Utility for BizCore
 * Uses in-memory storage (suitable for single server)
 * For distributed systems, migrate to Redis
 */

import { NextRequest } from 'next/server'

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory storage for rate limits
const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Check if action is rate limited
 * @param key Unique identifier (email, IP, etc.)
 * @param limit Maximum number of attempts
 * @param windowMs Time window in milliseconds
 * @returns { allowed: boolean, remaining: number, resetTime: Date }
 */
export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  // Entry doesn't exist or has expired
  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    })
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: new Date(now + windowMs),
      retryAfter: null
    }
  }

  // Entry exists and hasn't expired
  if (entry.count < limit) {
    entry.count++
    return {
      allowed: true,
      remaining: limit - entry.count,
      resetTime: new Date(entry.resetTime),
      retryAfter: null
    }
  }

  // Rate limit exceeded
  return {
    allowed: false,
    remaining: 0,
    resetTime: new Date(entry.resetTime),
    retryAfter: Math.ceil((entry.resetTime - now) / 1000) // seconds
  }
}

/**
 * Reset rate limit for a key
 */
export function resetRateLimit(key: string) {
  rateLimitStore.delete(key)
}

/**
 * Cleanup expired entries (call periodically)
 */
export function cleanupExpiredEntries() {
  const now = Date.now()
  let cleaned = 0

  for (const [key, entry] of Array.from(rateLimitStore.entries())) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
      cleaned++
    }
  }

  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} expired rate limit entries`)
  }
}

// Cleanup expired entries every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000)

/**
 * Common rate limit presets
 */
export const rateLimits = {
  // OTP: 3 requests per email per hour
  otpRequest: (email: string) => checkRateLimit(`otp:request:${email}`, 3, 60 * 60 * 1000),

  // OTP Verification: 5 attempts per OTP per 15 minutes
  otpVerify: (email: string) => checkRateLimit(`otp:verify:${email}`, 5, 15 * 60 * 1000),

  // Onboarding submit: 1 per IP per 5 minutes
  onboardingSubmit: (ip: string) => checkRateLimit(`onboarding:submit:${ip}`, 1, 5 * 60 * 1000),

  // Generic API: 100 requests per minute per IP
  api: (ip: string) => checkRateLimit(`api:${ip}`, 100, 60 * 1000),

  // Login attempts: 5 per email per 15 minutes
  login: (email: string) => checkRateLimit(`login:${email}`, 5, 15 * 60 * 1000),

  // Registration: 5 per IP per 24 hours
  registration: (ip: string) => checkRateLimit(`registration:${ip}`, 5, 24 * 60 * 60 * 1000)
}

/**
 * Helper to get client IP from request
 */
export function getClientIp(req: NextRequest | Record<string, unknown>): string {
  // Try to get IP from various sources
  if (req instanceof NextRequest) {
    const forwarded = req.headers.get('x-forwarded-for')
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }

    const clientIp = req.headers.get('x-client-ip')
    if (clientIp) {
      return clientIp
    }
  } else {
    // Fallback for object-based request handling
    const headers = (req as Record<string, unknown>).headers as Record<string, unknown> | undefined
    if (headers) {
      const forwarded = headers['x-forwarded-for']
      if (forwarded) {
        return (forwarded as string).split(',')[0].trim()
      }
      const clientIp = headers['x-client-ip']
      if (clientIp) {
        return clientIp as string
      }
    }
  }

  return 'unknown'
}

/**
 * Middleware for rate limiting in Next.js API routes
 */
export function withRateLimit(
  handler: (req: Request) => Promise<Response>,
  options: { keyGenerator: (req: Request) => string; limit: number; windowMs: number }
) {
  return async (req: Request) => {
    const key = options.keyGenerator(req)
    const result = checkRateLimit(key, options.limit, options.windowMs)

    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Too many requests',
          retryAfter: result.retryAfter,
          resetTime: result.resetTime
        }),
        {
          status: 429,
          headers: {
            'Retry-After': `${result.retryAfter}`,
            'X-RateLimit-Limit': `${options.limit}`,
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetTime.toISOString()
          }
        }
      )
    }

    // Add rate limit info to request for logging
    const reqWithRateLimit = req as NextRequest & { rateLimit?: { remaining: number; resetTime: Date } }
    reqWithRateLimit.rateLimit = {
      remaining: result.remaining,
      resetTime: result.resetTime
    }

    return handler(reqWithRateLimit)
  }
}
