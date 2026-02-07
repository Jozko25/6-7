import { Redis } from "@upstash/redis";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// Configuration
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_SECONDS = 15 * 60; // 15 minutes
const ATTEMPT_WINDOW_SECONDS = 60 * 60; // 1 hour window for counting attempts

interface LockoutStatus {
  isLocked: boolean;
  remainingAttempts: number;
  lockoutEndsAt?: Date;
  failedAttempts: number;
}

/**
 * Get the Redis key for tracking failed attempts
 */
function getFailedAttemptsKey(identifier: string): string {
  return `auth:failed_attempts:${identifier}`;
}

/**
 * Get the Redis key for lockout status
 */
function getLockoutKey(identifier: string): string {
  return `auth:lockout:${identifier}`;
}

/**
 * Check if an account/IP is currently locked out
 */
export async function checkLockoutStatus(identifier: string): Promise<LockoutStatus> {
  if (!redis) {
    // No Redis = no lockout enforcement (development mode)
    return {
      isLocked: false,
      remainingAttempts: MAX_FAILED_ATTEMPTS,
      failedAttempts: 0,
    };
  }

  const [lockoutExpiry, failedAttempts] = await Promise.all([
    redis.get<number>(getLockoutKey(identifier)),
    redis.get<number>(getFailedAttemptsKey(identifier)),
  ]);

  const attempts = failedAttempts || 0;

  if (lockoutExpiry && lockoutExpiry > Date.now()) {
    return {
      isLocked: true,
      remainingAttempts: 0,
      lockoutEndsAt: new Date(lockoutExpiry),
      failedAttempts: attempts,
    };
  }

  return {
    isLocked: false,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - attempts),
    failedAttempts: attempts,
  };
}

/**
 * Record a failed login attempt
 * Returns true if account is now locked
 */
export async function recordFailedAttempt(identifier: string): Promise<LockoutStatus> {
  if (!redis) {
    return {
      isLocked: false,
      remainingAttempts: MAX_FAILED_ATTEMPTS,
      failedAttempts: 0,
    };
  }

  const key = getFailedAttemptsKey(identifier);

  // Increment failed attempts
  const attempts = await redis.incr(key);

  // Set expiry on first attempt
  if (attempts === 1) {
    await redis.expire(key, ATTEMPT_WINDOW_SECONDS);
  }

  // Check if we should lock the account
  if (attempts >= MAX_FAILED_ATTEMPTS) {
    const lockoutExpiry = Date.now() + LOCKOUT_DURATION_SECONDS * 1000;
    await redis.set(getLockoutKey(identifier), lockoutExpiry, {
      ex: LOCKOUT_DURATION_SECONDS,
    });

    return {
      isLocked: true,
      remainingAttempts: 0,
      lockoutEndsAt: new Date(lockoutExpiry),
      failedAttempts: attempts,
    };
  }

  return {
    isLocked: false,
    remainingAttempts: MAX_FAILED_ATTEMPTS - attempts,
    failedAttempts: attempts,
  };
}

/**
 * Clear failed attempts after successful login
 */
export async function clearFailedAttempts(identifier: string): Promise<void> {
  if (!redis) return;

  await Promise.all([
    redis.del(getFailedAttemptsKey(identifier)),
    redis.del(getLockoutKey(identifier)),
  ]);
}

/**
 * Get formatted lockout message
 */
export function getLockoutMessage(status: LockoutStatus): string {
  if (!status.isLocked) {
    if (status.failedAttempts > 0) {
      return `${status.remainingAttempts} attempt(s) remaining before account lockout.`;
    }
    return "";
  }

  if (status.lockoutEndsAt) {
    const minutes = Math.ceil((status.lockoutEndsAt.getTime() - Date.now()) / 60000);
    return `Account temporarily locked. Try again in ${minutes} minute(s).`;
  }

  return "Account temporarily locked. Please try again later.";
}
