import { Router } from 'express';
import { versionManager } from '../version/manager';
import { logMetric } from '../middleware/metrics';

export const rollback = Router();

/**
 * AUTH MIDDLEWARE - Check authorization token
 */
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || token !== process.env.AUTH_TOKEN) {
    logMetric('auth_failure', 1, { endpoint: req.path });
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid Bearer token required'
    });
  }
  
  next();
}

/**
 * POST /brain/rollback - Rollback to specific version
 * PROTECTED: Requires Bearer token
 * Body: { version: string }
 * DoD: Complete rollback in < 5 seconds
 */
rollback.post('/', requireAuth, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { version } = req.body;
    
    if (!version) {
      return res.status(400).json({
        error: 'Version parameter required',
        example: { version: 'v2025-08-12T14-00-00' }
      });
    }
    
    // Log rollback attempt
    console.log(`🔄 Initiating rollback to version: ${version}`);
    
    // Perform rollback (atomic in versionManager)
    await versionManager.rollback(version);
    
    // Calculate duration
    const duration = Date.now() - startTime;
    
    // Log metrics
    await logMetric('rollback_duration_ms', duration);
    await logMetric('rollback_success', 1, { version });
    
    // Check DoD requirement (< 5 seconds)
    const meetsSLA = duration < 5000;
    
    res.json({
      success: true,
      version,
      duration_ms: duration,
      meets_sla: meetsSLA,
      message: `Successfully rolled back to version ${version}`
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log failure
    await logMetric('rollback_failure', 1);
    await logMetric('rollback_duration_ms', duration);
    
    res.status(500).json({
      success: false,
      error: error.message,
      duration_ms: duration
    });
  }
});

/**
 * GET /brain/versions - List all available versions
 * PROTECTED: Requires Bearer token
 */
rollback.get('/versions', requireAuth, async (req, res) => {
  try {
    const versions = await versionManager.listVersions();
    const current = await versionManager.getCurrentVersion();
    
    res.json({
      current,
      total: versions.length,
      versions: versions.slice(0, 20) // Return last 20 versions
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to list versions',
      details: error.message
    });
  }
});

/**
 * GET /brain/diff - Compare two versions
 * PROTECTED: Requires Bearer token
 */
rollback.get('/diff', requireAuth, async (req, res) => {
  try {
    const { v1, v2 } = req.query;
    
    if (!v1 || !v2) {
      return res.status(400).json({
        error: 'Both v1 and v2 parameters required',
        example: '/brain/diff?v1=v2025-08-12T14-00&v2=v2025-08-12T15-00'
      });
    }
    
    const diff = await versionManager.getVersionDiff(v1 as string, v2 as string);
    
    res.json({
      v1,
      v2,
      diff
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to compare versions',
      details: error.message
    });
  }
});

export default rollback;