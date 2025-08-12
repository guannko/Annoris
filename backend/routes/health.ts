import { Router } from 'express';
import { getHealthMetrics, getLatencyMetrics } from '../middleware/metrics';
import { versionManager } from '../version/manager';

export const health = Router();

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
      
      // Performance metrics
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
    
    // Get various latency metrics
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
          p95: Math.round(searchLatency.p95)
        },
        request: {
          p50: Math.round(requestLatency.p50),
          p95: Math.round(requestLatency.p95)
        },
        pulse: {
          p50: Math.round(pulseLatency.p50),
          p95: Math.round(pulseLatency.p95)
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

export default health;