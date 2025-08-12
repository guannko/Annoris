import Redis from 'ioredis';

const url = process.env.REDIS_URL;
if (!url) {
  console.warn('[redis] REDIS_URL is not set — using in-memory fallback');
}

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (!url) return null;
  if (!redis) {
    redis = new Redis(url, { 
      lazyConnect: true, 
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 100, 3000);
      }
    });
  }
  return redis;
}

// Helper for safe Redis operations
export async function safeRedisOp<T>(
  operation: () => Promise<T>, 
  fallback: T
): Promise<T> {
  try {
    const redis = getRedis();
    if (!redis) return fallback;
    return await operation();
  } catch (error) {
    console.warn('[redis] Operation failed:', error);
    return fallback;
  }
}