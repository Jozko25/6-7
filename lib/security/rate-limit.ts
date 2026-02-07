import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Different rate limits for different endpoints
export const rateLimiters = redis
  ? {
      // Strict limit for auth endpoints
      auth: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 requests per 15 minutes
        analytics: true,
      }),

      // Medium limit for API
      api: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
        analytics: true,
      }),

      // Generous limit for public pages
      public: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(1000, "1 m"), // 1000 requests per minute
        analytics: true,
      }),
    }
  : null;

export async function checkRateLimit(
  identifier: string,
  type: "auth" | "api" | "public"
) {
  if (!rateLimiters) {
    // If Redis is not configured, allow all requests in development
    return {
      success: true,
      limit: 1000,
      reset: Date.now() + 60000,
      remaining: 1000,
    };
  }

  const limiter = rateLimiters[type];
  const { success, limit, reset, remaining } = await limiter.limit(identifier);

  return {
    success,
    limit,
    reset,
    remaining,
  };
}
