import rateLimit from 'express-rate-limit';
import { Pool } from 'pg';

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

/**
 * Rate limiters for different endpoints
 */
export const webhookLimiter = rateLimit({
  windowMs: 60_000,          // 1 minute
  max: 60,                   // 60 requests/min
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logMetric('rate_limit_hit', 1, { endpoint: 'webhook' });
    res.status(429).json({ error: 'Too many requests' });
  }
});

export const searchLimiter = rateLimit({
  windowMs: 60_000,          // 1 minute
  max: 100,                  // 100 searches/min
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logMetric('rate_limit_hit', 1, { endpoint: 'search' });
    res.status(429).json({ error: 'Too many searches' });
  }
});

export const apiLimiter = rateLimit({
  windowMs: 60_000,          // 1 minute
  max: 300,                  // 300 requests/min general
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Metrics tracking middleware
 */
export function metricsMiddleware(req, res, next) {
  const start = Date.now();
  
  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    
    // Log latency
    logMetric('request_latency_ms', duration, {
      method: req.method,
      path: req.path,
      status: res.statusCode
    });
    
    // Log specific metrics
    if (req.path.includes('/search')) {
      logMetric('search_latency_ms', duration);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
}

/**
 * Log metric to PostgreSQL
 */
export async function logMetric(
  metric: string, 
  value: number, 
  tags: Record<string, any> = {}
): Promise<void> {
  try {
    await pool.query(
      'INSERT INTO brain_metrics (metric, value, tags) VALUES ($1, $2, $3)',
      [metric, value, JSON.stringify(tags)]
    );
  } catch (error) {
    console.error('Failed to log metric:', error);
  }
}

/**
 * Log pulse activity
 */
export async function logPulse(
  pulse: string,
  success: boolean,
  duration: number,
  notes?: string
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO pulse_logs (pulse, finished_at, success, duration_ms, notes) 
       VALUES ($1, now(), $2, $3, $4)`,
      [pulse, success, duration, notes]
    );
  } catch (error) {
    console.error('Failed to log pulse:', error);
  }
}

/**
 * Track RAG hit rate
 */
export async function trackRagHit(
  query: string,
  hit: boolean,
  relevance: number,
  filesUsed: string[]
): Promise<void> {
  try {
    await pool.query(
      'INSERT INTO rag_hits (query, hit, relevance, files_used) VALUES ($1, $2, $3, $4)',
      [query, hit, relevance, filesUsed]
    );
    
    // Also log as metric
    logMetric('rag_hit', hit ? 1 : 0, { relevance });
  } catch (error) {
    console.error('Failed to track RAG hit:', error);
  }
}

/**
 * Get health metrics
 */
export async function getHealthMetrics(): Promise<any> {
  try {
    const result = await pool.query('SELECT * FROM brain_health');
    return result.rows[0] || {};
  } catch (error) {
    console.error('Failed to get health metrics:', error);
    return {};
  }
}

/**
 * Get p50/p95 latency
 */
export async function getLatencyMetrics(
  metric: string = 'search_latency_ms',
  hours: number = 1
): Promise<{ p50: number; p95: number }> {
  try {
    const result = await pool.query(
      `SELECT 
        percentile_cont(0.50) WITHIN GROUP (ORDER BY value) as p50,
        percentile_cont(0.95) WITHIN GROUP (ORDER BY value) as p95
       FROM brain_metrics 
       WHERE metric = $1 
       AND ts > now() - interval '${hours} hours'`,
      [metric]
    );
    
    return {
      p50: result.rows[0]?.p50 || 0,
      p95: result.rows[0]?.p95 || 0
    };
  } catch (error) {
    console.error('Failed to get latency metrics:', error);
    return { p50: 0, p95: 0 };
  }
}

/**
 * Circuit breaker for search
 */
let circuitBreakerOpen = false;
let failureCount = 0;
const FAILURE_THRESHOLD = 5;
const RESET_TIMEOUT = 60_000; // 1 minute

export function circuitBreaker(fn: Function) {
  return async (...args: any[]) => {
    if (circuitBreakerOpen) {
      throw new Error('Circuit breaker is open');
    }
    
    try {
      const result = await fn(...args);
      failureCount = 0; // Reset on success
      return result;
    } catch (error) {
      failureCount++;
      
      if (failureCount >= FAILURE_THRESHOLD) {
        circuitBreakerOpen = true;
        logMetric('circuit_breaker_open', 1);
        
        // Auto-reset after timeout
        setTimeout(() => {
          circuitBreakerOpen = false;
          failureCount = 0;
          logMetric('circuit_breaker_reset', 1);
        }, RESET_TIMEOUT);
      }
      
      throw error;
    }
  };
}