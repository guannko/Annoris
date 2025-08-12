import { Router } from 'express';
import { getHealthMetrics, getLatencyMetrics, logMetric } from '../middleware/metrics';
import { versionManager } from '../version/manager';
import { getRedis, safeRedisOp } from '../lib/redis';
import { Pool } from 'pg';

export const health = Router();

// PostgreSQL connection check
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

/**
 * GET /health/live - Simple liveness check
 * Returns 200 if service is alive
 */
health.get('/live', (req, res) => {
  res.status(200).json({ 
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /health/ready - Readiness check with Redis caching
 * Checks DB connection and index freshness
 */
health.get('/ready', async (req, res) => {
  const cacheKey = 'health:ready:v1';
  
  try {
    // Try to get from Redis cache first
    const cached = await safeRedisOp(
      async () => {
        const redis = getRedis();
        if (!redis) return null;
        const data = await redis.get(cacheKey);
        if (data) {
          logMetric('health_ready_cache_hits', 1);
          return data;
        }
        return null;
      },
      null
    );
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    // Perform actual health checks
    const checks = {
      database: false,
      indexFresh: false,
      redis: false,
      ready: false
    };
    
    // Check database connection
    try {
      const dbCheck = await pool.query('SELECT 1');
      checks.database = !!dbCheck.rows;
    } catch (error) {
      checks.database = false;
    }
    
    // Check index freshness
    try {
      const dbHealth = await getHealthMetrics();
      const freshnessMinutes = dbHealth.freshness_minutes || 999;
      checks.indexFresh = freshnessMinutes < 10; // Must be < 10 minutes old
    } catch (error) {
      checks.indexFresh = false;
    }
    
    // Check Redis connection
    checks.redis = await safeRedisOp(
      async () => {
        const redis = getRedis();
        if (!redis) return false;
        await redis.ping();
        return true;
      },
      false
    );
    
    // Overall readiness
    checks.ready = checks.database && checks.indexFresh;
    
    const statusCode = checks.ready ? 200 : 503;
    
    const response = {
      status: checks.ready ? 'ready' : 'not ready',
      checks,
      timestamp: new Date().toISOString()
    };
    
    // Cache the response for 60 seconds if healthy
    if (checks.ready) {
      await safeRedisOp(
        async () => {
          const redis = getRedis();
          if (redis) {
            await redis.set(cacheKey, JSON.stringify(response), 'EX', 60);
          }
        },
        null
      );
    }
    
    res.status(statusCode).json(response);
    
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /brain/health - Complete health check with metrics
 */
health.get('/', async (req, res) => {
  try {
    // Get all metrics
    const dbHealth = await getHealthMetrics();
    const versionHealth = await versionManager.healthCheck();
    const latency = await getLatencyMetrics('search_latency_ms', 1);
    
    // Build response
    const healthStatus = {
      status: versionHealth.ok ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      
      // Version info
      version: {
        active: dbHealth.active_version || versionHealth.currentVersion,
        created: dbHealth.version_created,
        freshness_minutes: Math.round(dbHealth.freshness_minutes || 0),
        total_versions: dbHealth.total_versions || versionHealth.totalVersions
      },
      
      // Performance metrics with tags
      metrics: {
        p50_latency_ms: Math.round(latency.p50),
        p95_latency_ms: Math.round(latency.p95 || dbHealth.p95_latency_ms || 0),
        hit_rate_24h: dbHealth.hit_rate_24h || 0,
        
        // DoD requirements check
        meets_sla: {
          p95_under_800ms: (latency.p95 || 0) < 800,
          hit_rate_above_70: (dbHealth.hit_rate_24h || 0) >= 0.7,
          freshness_under_10min: (dbHealth.freshness_minutes || 0) < 10
        }
      },
      
      // Errors if any
      errors: versionHealth.errors
    };
    
    // Set status code based on health
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
    
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /brain/metrics - Detailed metrics dashboard
 */
health.get('/metrics', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    
    // Get various latency metrics with phases
    const searchLatency = await getLatencyMetrics('search_latency_ms', hours);
    const requestLatency = await getLatencyMetrics('request_latency_ms', hours);
    const pulseLatency = await getLatencyMetrics('pulse_duration_ms', hours);
    
    // Get health metrics
    const health = await getHealthMetrics();
    
    res.json({
      period: `${hours} hours`,
      timestamp: new Date().toISOString(),
      
      latency: {
        search: {
          p50: Math.round(searchLatency.p50),
          p95: Math.round(searchLatency.p95),
          phase: 'query'
        },
        request: {
          p50: Math.round(requestLatency.p50),
          p95: Math.round(requestLatency.p95),
          phase: 'total'
        },
        pulse: {
          p50: Math.round(pulseLatency.p50),
          p95: Math.round(pulseLatency.p95),
          phase: 'background'
        }
      },
      
      accuracy: {
        hit_rate_24h: health.hit_rate_24h || 0,
        total_searches: health.total_searches || 0
      },
      
      freshness: {
        index_age_minutes: Math.round(health.freshness_minutes || 0),
        last_update: health.version_created
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get metrics',
      details: error.message
    });
  }
});

// Graceful shutdown handler
let shuttingDown = false;

export function gracefulShutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  
  console.log('🛑 Graceful shutdown initiated...');
  
  // Stop accepting new requests
  health.get('/ready', (req, res) => {
    res.status(503).json({ 
      status: 'shutting down',
      timestamp: new Date().toISOString()
    });
  });
  
  // Wait for active requests to complete (max 10 seconds)
  setTimeout(() => {
    console.log('👋 Shutdown complete');
    process.exit(0);
  }, 10000);
}

// Handle SIGTERM from Railway
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default health;