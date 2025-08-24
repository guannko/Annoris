import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

export async function isEnabled(flag: string): Promise<boolean> {
  try {
    const value = await redis.get(`ff:${flag}`);
    return value === '1' || value === 'true';
  } catch {
    return false; // Default to disabled if Redis is down
  }
}

export async function setFlag(flag: string, enabled: boolean): Promise<void> {
  await redis.set(`ff:${flag}`, enabled ? '1' : '0');
}

export async function getAllFlags(): Promise<Record<string, boolean>> {
  const keys = await redis.keys('ff:*');
  const flags: Record<string, boolean> = {};
  
  for (const key of keys) {
    const flag = key.replace('ff:', '');
    flags[flag] = await isEnabled(flag);
  }
  
  return flags;
}
