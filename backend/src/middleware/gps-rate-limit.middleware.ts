import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';

/**
 * GPS Location Rate Limiting Middleware
 * Limits: 10 GPS updates per minute per vehicle
 * Also enforces per-driver limits to prevent spam
 */

interface RateLimitConfig {
  maxUpdates: number; // Max updates allowed
  windowSeconds: number; // Time window in seconds
  keyPrefix: string; // Redis key prefix for this limit type
}

const GPS_RATE_LIMITS: Record<string, RateLimitConfig> = {
  vehicle: {
    maxUpdates: 10, // 10 updates per minute per vehicle
    windowSeconds: 60,
    keyPrefix: 'ratelimit:gps:vehicle:',
  },
  driver: {
    maxUpdates: 20, // 20 updates per minute per driver (combined across all vehicles)
    windowSeconds: 60,
    keyPrefix: 'ratelimit:gps:driver:',
  },
};

/**
 * Check rate limit for vehicle GPS updates
 */
async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const client = redis.getClient();

  // If Redis is not available, allow the request (graceful degradation)
  if (!client) {
    const now = new Date();
    return {
      allowed: true,
      remaining: config.maxUpdates,
      resetAt: new Date(now.getTime() + config.windowSeconds * 1000),
    };
  }

  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - config.windowSeconds;

  // Use a Redis sorted set to track timestamps
  const limitKey = `${config.keyPrefix}${key}`;

  // Remove old entries outside the window
  await client.zremrangebyscore(limitKey, '-inf', windowStart);

  // Count current entries in window
  const count = await client.zcard(limitKey);

  if (count >= config.maxUpdates) {
    // Get the oldest entry timestamp for reset time
    const oldest = await client.zrange(limitKey, 0, 0, 'WITHSCORES');
    const oldestScore = oldest.length > 0 ? parseInt(oldest[1] as string) : now;
    const resetAtSeconds = oldestScore + config.windowSeconds;

    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(resetAtSeconds * 1000),
    };
  }

  // Add new entry with current timestamp
  await client.zadd(limitKey, now, `${now}-${Math.random()}`);
  await client.expire(limitKey, config.windowSeconds + 1);

  return {
    allowed: true,
    remaining: config.maxUpdates - count - 1,
    resetAt: new Date((now + config.windowSeconds) * 1000),
  };
}

/**
 * Middleware for GPS location endpoint rate limiting
 */
export async function gpsLocationRateLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const { vehicleId } = req.body;

    if (!vehicleId) {
      return next(); // Let controller handle validation
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Check vehicle-level rate limit
    const vehicleLimit = await checkRateLimit(vehicleId, GPS_RATE_LIMITS.vehicle);

    if (!vehicleLimit.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded for this vehicle',
        retryAfter: vehicleLimit.resetAt.getTime() - Date.now(),
        resetAt: vehicleLimit.resetAt,
      });
    }

    // Check driver-level rate limit (user ID)
    const driverLimit = await checkRateLimit(userId, GPS_RATE_LIMITS.driver);

    if (!driverLimit.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Too many location updates from your account.',
        retryAfter: driverLimit.resetAt.getTime() - Date.now(),
        resetAt: driverLimit.resetAt,
      });
    }

    // Pass rate limit info to controller for response headers
    res.setHeader('X-RateLimit-Limit-Vehicle', GPS_RATE_LIMITS.vehicle.maxUpdates);
    res.setHeader('X-RateLimit-Remaining-Vehicle', vehicleLimit.remaining);
    res.setHeader('X-RateLimit-Reset-Vehicle', Math.floor(vehicleLimit.resetAt.getTime() / 1000));

    res.setHeader('X-RateLimit-Limit-Driver', GPS_RATE_LIMITS.driver.maxUpdates);
    res.setHeader('X-RateLimit-Remaining-Driver', driverLimit.remaining);
    res.setHeader('X-RateLimit-Reset-Driver', Math.floor(driverLimit.resetAt.getTime() / 1000));

    next();
  } catch (error: any) {
    console.error('Error in GPS rate limit middleware:', error);
    // Don't block requests if rate limiting fails
    next();
  }
}

/**
 * Middleware for active vehicles endpoint (lighter rate limit)
 */
export async function gpsActiveVehiclesRateLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return next();
    }

    // Allow 30 requests per minute per user for active vehicles endpoint
    const client = redis.getClient();

    // If Redis is not available, allow request (graceful degradation)
    if (!client) {
      return next();
    }

    const now = Math.floor(Date.now() / 1000);
    const limitKey = `ratelimit:gps:active:${userId}`;
    const windowSeconds = 60;

    const count = await client.incr(limitKey);

    if (count === 1) {
      await client.expire(limitKey, windowSeconds);
    }

    const remaining = Math.max(0, 30 - count);

    res.setHeader('X-RateLimit-Limit', '30');
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.floor((now + windowSeconds) / 1000));

    if (count > 30) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: windowSeconds,
      });
    }

    next();
  } catch (error: any) {
    console.error('Error in active vehicles rate limit middleware:', error);
    next();
  }
}

/**
 * Middleware for location history endpoint (relaxed rate limit)
 */
export async function gpsHistoryRateLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return next();
    }

    // Allow 60 requests per minute per user for history endpoint
    const client = redis.getClient();

    // If Redis is not available, allow request (graceful degradation)
    if (!client) {
      return next();
    }

    const now = Math.floor(Date.now() / 1000);
    const limitKey = `ratelimit:gps:history:${userId}`;
    const windowSeconds = 60;

    const count = await client.incr(limitKey);

    if (count === 1) {
      await client.expire(limitKey, windowSeconds);
    }

    const remaining = Math.max(0, 60 - count);

    res.setHeader('X-RateLimit-Limit', '60');
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.floor((now + windowSeconds) / 1000));

    if (count > 60) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: windowSeconds,
      });
    }

    next();
  } catch (error: any) {
    console.error('Error in location history rate limit middleware:', error);
    next();
  }
}
