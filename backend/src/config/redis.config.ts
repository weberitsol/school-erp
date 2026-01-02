import { RedisOptions } from 'ioredis';

// Redis configuration following architecture.md patterns
// Environment variables for flexible deployment across dev/staging/prod

export const REDIS_DEFAULT_TTL = 3600; // 1 hour default cache TTL
export const REDIS_SESSION_TTL = 86400; // 24 hours for sessions
export const REDIS_SHORT_TTL = 300; // 5 minutes for frequently changing data

export interface RedisConfig {
  host: string;
  port: number;
  password: string | undefined;
  db: number;
  tls: boolean;
  tlsRejectUnauthorized: boolean;
  keyPrefix: string;
}

export const redisConfig: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  tls: process.env.REDIS_TLS === 'true',
  tlsRejectUnauthorized: process.env.REDIS_TLS_REJECT_UNAUTHORIZED !== 'false', // Default: true (secure)
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'school-erp:',
};

// Build ioredis connection options
export const getRedisOptions = (): RedisOptions => {
  const options: RedisOptions = {
    host: redisConfig.host,
    port: redisConfig.port,
    db: redisConfig.db,
    keyPrefix: redisConfig.keyPrefix,

    // Connection pooling and retry strategy
    retryStrategy: (times: number) => {
      if (times > 10) {
        // Stop retrying after 10 attempts
        return null;
      }
      // Exponential backoff: 50ms, 100ms, 200ms... max 2000ms
      return Math.min(times * 50, 2000);
    },

    maxRetriesPerRequest: 3,
    enableReadyCheck: true,

    // Connection timeout settings
    connectTimeout: 10000,
    commandTimeout: 5000,

    // Lazy connect - don't connect until first command
    lazyConnect: true,
  };

  // Add password if provided
  if (redisConfig.password) {
    options.password = redisConfig.password;
  }

  // Add TLS configuration for production
  if (redisConfig.tls) {
    options.tls = {
      rejectUnauthorized: redisConfig.tlsRejectUnauthorized,
    };
  }

  return options;
};

export default redisConfig;
