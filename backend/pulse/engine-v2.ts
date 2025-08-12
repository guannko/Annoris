import { logMetric, logPulse } from '../middleware/metrics';
import { getRedis, safeRedisOp } from '../lib/redis';

export interface Pulse {
  key: string;
  ratePerMin?: number;
  when?: string;
  run: () => Promise<void>;
}

/**
 * Check if pulse should run based on rate limit
 */
async function shouldRunWithLimit(pulse: Pulse, now = new Date()): Promise<boolean> {
  const limit = pulse.ratePerMin ?? 3; // Default 3/min
  
  // Try Redis-based rate limiting first
  const allowed = await safeRedisOp(
    async () => {
      const redis = getRedis();
      if (!redis) return null;
      
      // Create minute-based key
      const minuteKey = `pulse:${pulse.key}:${now.toISOString().slice(0, 16)}`; // YYYY-MM-DDTHH:MM
      const count = await redis.incr(minuteKey);
      
      // Set expiry on first increment
      if (count === 1) {
        await redis.expire(minuteKey, 120); // 2 minutes TTL
      }
      
      return count <= limit;
    },
    null
  );
  
  // If Redis is available, use its decision
  if (allowed !== null) {
    if (!allowed) {
      logMetric('pulse_dropped_due_rate', 1, { pulse: pulse.key });
    }
    return allowed;
  }
  
  // Fallback: probabilistic rate limiting without Redis
  const probability = limit / 60;
  return Math.random() < probability;
}

/**
 * Execute pulse engine tick
 */
export async function tick(now = new Date(), pulses: Pulse[]): Promise<void> {
  for (const pulse of pulses) {
    try {
      // Check rate limit
      const shouldRun = await shouldRunWithLimit(pulse, now);
      if (!shouldRun) {
        console.log(`[pulse] ${pulse.key} skipped due to rate limit`);
        continue;
      }
      
      // Execute pulse
      const startTime = Date.now();
      console.log(`[pulse] Running ${pulse.key} at ${now.toISOString()}`);
      
      await pulse.run();
      
      // Log success
      const duration = Date.now() - startTime;
      await logPulse(pulse.key, true, duration);
      await logMetric('pulse_duration_ms', duration, { pulse: pulse.key });
      
    } catch (error) {
      // Log failure but don't crash
      console.error(`[pulse] Error in ${pulse.key}:`, error);
      await logPulse(pulse.key, false, 0, error.message);
      await logMetric('pulse_errors', 1, { pulse: pulse.key });
    }
  }
}

/**
 * Default pulses configuration
 */
export const defaultPulses: Pulse[] = [
  {
    key: 'morning_reflection',
    ratePerMin: 1,
    when: '06:30',
    run: async () => {
      console.log('[pulse] Morning reflection: Checking what changed yesterday');
      // TODO: Implement reflection logic
      // - Check file changes
      // - Generate summary
      // - Create autosave
      // - Trigger incremental reindex
    }
  },
  {
    key: 'evening_check',
    ratePerMin: 1,
    when: '18:00',
    run: async () => {
      console.log('[pulse] Evening check: Status of active projects');
      // TODO: Implement evening check
      // - Check project statuses
      // - Generate daily digest
      // - Update long-term memory
    }
  },
  {
    key: 'night_organize',
    ratePerMin: 1,
    when: '22:30',
    run: async () => {
      console.log('[pulse] Night organize: Reorganizing memory');
      // TODO: Implement night organization
      // - Compress old memories
      // - Clean up temp files
      // - Optimize indexes
    }
  },
  {
    key: 'health_check',
    ratePerMin: 6, // Every 10 seconds
    run: async () => {
      // Simple health ping
      await logMetric('pulse_heartbeat', 1);
    }
  }
];

/**
 * Check if current time matches pulse schedule
 */
export function shouldRunBySchedule(pulse: Pulse, now = new Date()): boolean {
  if (!pulse.when) return true; // No schedule = always ready
  
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM
  return currentTime === pulse.when;
}

/**
 * Main pulse runner (call from cron)
 */
export async function runPulses(): Promise<void> {
  const now = new Date();
  const hour = now.getHours();
  
  // Check if night mode (22:30 - 06:30)
  const isNightMode = hour >= 22.5 || hour < 6.5;
  
  if (isNightMode) {
    console.log('[pulse] Night mode active, only critical pulses running');
    // Only run health checks during night
    await tick(now, defaultPulses.filter(p => p.key === 'health_check'));
    return;
  }
  
  // Filter pulses by schedule
  const readyPulses = defaultPulses.filter(p => shouldRunBySchedule(p, now));
  
  if (readyPulses.length > 0) {
    console.log(`[pulse] Running ${readyPulses.length} pulses`);
    await tick(now, readyPulses);
  }
}

// Export for testing
export { shouldRunWithLimit };