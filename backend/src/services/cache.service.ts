import { redis } from '../config/redis';
import { REDIS_DEFAULT_TTL } from '../config/redis.config';

/**
 * Cache Service
 *
 * Provides a high-level caching interface with:
 * - Graceful degradation when Redis is unavailable
 * - Type-safe get/set operations
 * - TTL management
 * - Key prefixing (handled by redis config)
 *
 * Usage:
 *   import cacheService from './services/cache.service';
 *   await cacheService.set('user:123', userData, 3600);
 *   const user = await cacheService.get<User>('user:123');
 */
class CacheService {
  /**
   * Get a cached value by key
   * Returns null if key doesn't exist or Redis is unavailable
   *
   * @param key - Cache key (prefix is auto-applied)
   * @returns Parsed value or null
   */
  async get<T>(key: string): Promise<T | null> {
    const client = redis.getClient();

    // Graceful degradation - return null if Redis unavailable
    if (!client) {
      return null;
    }

    try {
      const value = await client.get(key);

      if (value === null) {
        return null;
      }

      // Parse JSON value
      return JSON.parse(value) as T;
    } catch (error) {
      const err = error as Error;
      console.warn(`⚠️ Cache get error for key "${key}": ${err.message}`);
      return null;
    }
  }

  /**
   * Set a cached value with optional TTL
   *
   * @param key - Cache key (prefix is auto-applied)
   * @param value - Value to cache (will be JSON stringified)
   * @param ttlSeconds - Time to live in seconds (default: 1 hour)
   */
  async set(key: string, value: any, ttlSeconds: number = REDIS_DEFAULT_TTL): Promise<void> {
    const client = redis.getClient();

    // Graceful degradation - silently skip if Redis unavailable
    if (!client) {
      return;
    }

    try {
      const serialized = JSON.stringify(value);

      if (ttlSeconds > 0) {
        await client.setex(key, ttlSeconds, serialized);
      } else {
        await client.set(key, serialized);
      }
    } catch (error) {
      const err = error as Error;
      console.warn(`⚠️ Cache set error for key "${key}": ${err.message}`);
      // Don't throw - graceful degradation
    }
  }

  /**
   * Delete a cached value
   *
   * @param key - Cache key to delete
   */
  async del(key: string): Promise<void> {
    const client = redis.getClient();

    // Graceful degradation - silently skip if Redis unavailable
    if (!client) {
      return;
    }

    try {
      await client.del(key);
    } catch (error) {
      const err = error as Error;
      console.warn(`⚠️ Cache delete error for key "${key}": ${err.message}`);
      // Don't throw - graceful degradation
    }
  }

  /**
   * Check if a key exists in cache
   *
   * @param key - Cache key to check
   * @returns true if exists, false otherwise (or if Redis unavailable)
   */
  async exists(key: string): Promise<boolean> {
    const client = redis.getClient();

    // Graceful degradation - return false if Redis unavailable
    if (!client) {
      return false;
    }

    try {
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      const err = error as Error;
      console.warn(`⚠️ Cache exists error for key "${key}": ${err.message}`);
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   * Use with caution - can be slow for large datasets
   *
   * @param pattern - Key pattern (e.g., "user:*")
   */
  async deletePattern(pattern: string): Promise<void> {
    const client = redis.getClient();

    if (!client) {
      return;
    }

    try {
      // Use SCAN to avoid blocking Redis with KEYS
      let cursor = '0';
      do {
        const result = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = result[0];
        const keys = result[1];

        if (keys.length > 0) {
          await client.del(...keys);
        }
      } while (cursor !== '0');
    } catch (error) {
      const err = error as Error;
      console.warn(`⚠️ Cache deletePattern error for "${pattern}": ${err.message}`);
    }
  }

  /**
   * Set a value only if it doesn't exist (for locks/deduplication)
   *
   * @param key - Cache key
   * @param value - Value to set
   * @param ttlSeconds - TTL in seconds
   * @returns true if set successfully, false if key already exists
   */
  async setNX(key: string, value: any, ttlSeconds: number = REDIS_DEFAULT_TTL): Promise<boolean> {
    const client = redis.getClient();

    if (!client) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      const result = await client.set(key, serialized, 'EX', ttlSeconds, 'NX');
      return result === 'OK';
    } catch (error) {
      const err = error as Error;
      console.warn(`⚠️ Cache setNX error for key "${key}": ${err.message}`);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   *
   * @param key - Cache key
   * @returns TTL in seconds, -1 if no TTL, -2 if key doesn't exist, null if Redis unavailable
   */
  async ttl(key: string): Promise<number | null> {
    const client = redis.getClient();

    if (!client) {
      return null;
    }

    try {
      return await client.ttl(key);
    } catch (error) {
      const err = error as Error;
      console.warn(`⚠️ Cache TTL error for key "${key}": ${err.message}`);
      return null;
    }
  }

  /**
   * Check if caching is available
   */
  isAvailable(): boolean {
    return redis.isConnected();
  }
}

// Singleton export following architecture pattern
export const cacheService = new CacheService();
export default cacheService;
