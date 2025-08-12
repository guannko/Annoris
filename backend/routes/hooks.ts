import { Router } from 'express';
import express from 'express';
import { runIndexer } from '../jobs/brain-index.cron';
import { tick } from '../pulse/engine';

export const hooks = Router();

// Middleware
hooks.use(express.json());

/**
 * Simple auth middleware
 */
function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || token !== process.env.ANNORIS_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
}

/**
 * POST /hooks/reindex - Trigger brain reindex
 */
hooks.post('/reindex', auth, async (req, res) => {
  try {
    const { source, trigger } = req.body;
    
    console.log(`📡 Reindex webhook from ${source || 'unknown'} - trigger: ${trigger || 'manual'}`);
    
    const stats = await runIndexer();
    
    res.json({ 
      ok: true,
      message: 'Reindex triggered',
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Webhook reindex failed:', error);
    res.status(500).json({ 
      ok: false,
      error: 'Reindex failed',
      details: error.message 
    });
  }
});

/**
 * POST /hooks/pulse - Trigger pulse
 */
hooks.post('/pulse', auth, async (req, res) => {
  try {
    console.log('📡 Pulse webhook triggered');
    
    await tick();
    
    res.json({ 
      ok: true,
      message: 'Pulse triggered',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Webhook pulse failed:', error);
    res.status(500).json({ 
      ok: false,
      error: 'Pulse failed',
      details: error.message 
    });
  }
});

/**
 * GET /hooks/health - Health check
 */
hooks.get('/health', (req, res) => {
  res.json({ 
    ok: true,
    service: 'hooks',
    timestamp: new Date().toISOString()
  });
});

export default hooks;