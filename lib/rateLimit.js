import { NextResponse } from "next/server";

/**
 * Pure in-memory sliding-window rate limiter with lazy garbage collection.
 * Fully compatible with Next.js Edge Runtime, Serverless Lambdas, and Node.js.
 */
class SlidingWindowRateLimiter {
  constructor() {
    this.storage = new Map();
    this.lastCleanup = Date.now();
  }

  cleanup(now) {
    // Run lazy cleanup once per minute
    if (now - this.lastCleanup < 60000) return;
    this.lastCleanup = now;
    for (const [key, record] of this.storage.entries()) {
      if (now > record.resetTime) {
        this.storage.delete(key);
      }
    }
  }

  /**
   * Check whether an action for a specific key is permitted under the rate limit.
   * @param {string} key - Unique identifier (e.g., user email or client IP + endpoint)
   * @param {Object} options - { limit: number, windowMs: number }
   * @returns {{ success: boolean, limit: number, remaining: number, resetMs: number }}
   */
  check(key, { limit = 10, windowMs = 60000 } = {}) {
    const now = Date.now();
    this.cleanup(now);

    let record = this.storage.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      this.storage.set(key, record);
      return {
        success: true,
        limit,
        remaining: Math.max(0, limit - 1),
        resetMs: windowMs,
      };
    }

    if (record.count < limit) {
      record.count += 1;
      return {
        success: true,
        limit,
        remaining: Math.max(0, limit - record.count),
        resetMs: Math.max(0, record.resetTime - now),
      };
    }

    // Limit exceeded
    return {
      success: false,
      limit,
      remaining: 0,
      resetMs: Math.max(0, record.resetTime - now),
    };
  }
}

const limiter = new SlidingWindowRateLimiter();

/**
 * General rate check helper.
 */
export function checkRateLimit(key, options) {
  return limiter.check(key, options);
}

/**
 * Standard 429 response formatter with standard HTTP rate limiting headers.
 */
export function rateLimitResponse(rateLimitResult) {
  const retrySeconds = Math.max(1, Math.ceil((rateLimitResult.resetMs || 1000) / 1000));
  return NextResponse.json(
    {
      error: "Too many requests. Please slow down and try again shortly.",
      retryAfterSeconds: retrySeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retrySeconds),
        "X-RateLimit-Limit": String(rateLimitResult.limit),
        "X-RateLimit-Remaining": String(rateLimitResult.remaining),
        "X-RateLimit-Reset": String(Math.ceil((Date.now() + rateLimitResult.resetMs) / 1000)),
      },
    }
  );
}

/**
 * Helper to extract client identifier (user email or IP address from headers).
 */
export function getClientIdentifier(req, userEmail = null) {
  if (userEmail) {
    return `user:${userEmail}`;
  }
  const forwarded = req.headers?.get?.("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers?.get?.("x-real-ip") || "unknown-ip";
  return `ip:${ip}`;
}
