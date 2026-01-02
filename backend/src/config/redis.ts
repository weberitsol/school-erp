import Redis from 'ioredis';
import { getRedisOptions, redisConfig } from './redis.config';

/**
 * Redis Client Singleton
 *
 * Provides a centralized Redis connection with:
 * - Graceful degradation when Redis is unavailable
 * - Connection event handling (connect, error, reconnecting)
 * - Retry strategy with exponential backoff
 * - Health check support
 *
 * Usage:
 *   import { redis } from './config/redis';
 *   await redis.connect();
 *   const client = redis.getClient();
 */
class RedisClient {
  private client: Redis | null = null;
  private isAvailable: boolean = false;
  private connectionAttempted: boolean = false;
  private lastError: Error | null = null;

  /**
   * Initialize and connect to Redis
   * Handles connection errors gracefully - app continues without caching
   */
  async connect(): Promise<void> {
    if (this.client && this.isAvailable) {
      return; // Already connected
    }

    this.connectionAttempted = true;

    try {
      const options = getRedisOptions();
      this.client = new Redis(options);

      // Connection event handlers
      this.client.on('connect', () => {
        console.log(`✅ Redis connected to ${redisConfig.host}:${redisConfig.port}`);
        this.isAvailable = true;
        this.lastError = null;
      });

      this.client.on('ready', () => {
        console.log('✅ Redis client ready');
        this.isAvailable = true;
      });

      this.client.on('error', (err: Error) => {
        // Log warning, not error, to avoid log spam during graceful degradation
        console.warn('⚠️ Redis connection error:', err.message);
        this.lastError = err;
        // Don't set isAvailable to false immediately - let reconnect attempt
      });

      this.client.on('close', () => {
        console.warn('⚠️ Redis connection closed');
        this.isAvailable = false;
      });

      this.client.on('reconnecting', (delay: number) => {
        console.log(`🔄 Redis reconnecting in ${delay}ms...`);
      });

      this.client.on('end', () => {
        console.log('🔚 Redis connection ended');
        this.isAvailable = false;
      });

      // Attempt connection (lazyConnect is true, so we need to call connect)
      await this.client.connect();

    } catch (error) {
      const err = error as Error;
      console.warn(`⚠️ Redis connection failed: ${err.message}`);
      console.warn('📝 App will continue without caching (graceful degradation)');
      this.lastError = err;
      this.isAvailable = false;
      // Don't throw - allow app to continue without Redis
    }
  }

  /**
   * Get the Redis client instance
   * Returns null if Redis is not available
   */
  getClient(): Redis | null {
    if (!this.isAvailable || !this.client) {
      return null;
    }
    return this.client;
  }

  /**
   * Check if Redis is connected and available
   */
  isConnected(): boolean {
    return this.isAvailable && this.client !== null;
  }

  /**
   * Get connection status for health checks
   */
  getStatus(): 'connected' | 'disconnected' | 'degraded' {
    if (this.isAvailable && this.client) {
      return 'connected';
    }
    if (this.connectionAttempted && !this.isAvailable) {
      return 'degraded';
    }
    return 'disconnected';
  }

  /**
   * Get last connection error if any
   */
  getLastError(): Error | null {
    return this.lastError;
  }

  /**
   * Perform health check with latency measurement
   */
  async healthCheck(): Promise<{
    status: 'connected' | 'disconnected' | 'degraded';
    latencyMs: number | null;
    memoryUsage: string | null;
    uptime: number | null;
    error: string | null;
  }> {
    const status = this.getStatus();

    if (status !== 'connected' || !this.client) {
      return {
        status,
        latencyMs: null,
        memoryUsage: null,
        uptime: null,
        error: this.lastError?.message || null,
      };
    }

    try {
      // Measure PING latency
      const startTime = Date.now();
      await this.client.ping();
      const latencyMs = Date.now() - startTime;

      // Get memory and server info
      const [memoryInfo, serverInfo] = await Promise.all([
        this.client.info('memory'),
        this.client.info('server'),
      ]);

      const memoryMatch = memoryInfo.match(/used_memory_human:(\S+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1] : null;

      const uptimeMatch = serverInfo.match(/uptime_in_seconds:(\d+)/);
      const uptime = uptimeMatch ? parseInt(uptimeMatch[1], 10) : null;

      return {
        status: 'connected',
        latencyMs,
        memoryUsage,
        uptime,
        error: null,
      };
    } catch (error) {
      const err = error as Error;
      return {
        status: 'degraded',
        latencyMs: null,
        memoryUsage: null,
        uptime: null,
        error: err.message,
      };
    }
  }

  /**
   * Gracefully disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isAvailable = false;
      console.log('🔌 Redis disconnected');
    }
  }
}

// Singleton instance
export const redis = new RedisClient();

// Prevent multiple instances in development (similar to Prisma pattern)
declare global {
  var redisClient: RedisClient | undefined;
}

if (process.env.NODE_ENV !== 'production') {
  global.redisClient = redis;
}

export default redis;
