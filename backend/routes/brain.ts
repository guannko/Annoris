import { Router } from 'express';
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { search, searchByTags } from '../rag/search';
import { runIndexer } from '../jobs/brain-index.cron';

export const brain = Router();

// Middleware
brain.use(express.json());

/**
 * GET /brain/index - Get full brain index
 */
brain.get('/index', async (_req, res) => {
  try {
    const indexPath = path.join(process.cwd(), 'brain-system', 'brain-index.json');
    const raw = await fs.readFile(indexPath, 'utf8');
    res.type('json').send(raw);
  } catch (error) {
    res.status(500).json({ error: 'Index not found', details: error.message });
  }
});

/**
 * POST /brain/search - Semantic search
 */
brain.post('/search', async (req, res) => {
  try {
    const { query, k = 5, privacy = 'public' } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query required' });
    }
    
    const indexPath = path.join(process.cwd(), 'brain-system', 'brain-index.json');
    const idx = JSON.parse(await fs.readFile(indexPath, 'utf8'));
    
    let hits = await search(query, idx, k);
    
    // Apply privacy filter
    if (privacy === 'public') {
      hits = hits.filter(h => h.visibility === 'public');
    } else if (privacy === 'private') {
      hits = hits.filter(h => h.visibility !== 'intimate');
    }
    // 'intimate' returns all
    
    res.json({ 
      query,
      hits,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
});

/**
 * POST /brain/search/tags - Search by tags
 */
brain.post('/search/tags', async (req, res) => {
  try {
    const { tags } = req.body;
    
    if (!tags || !Array.isArray(tags)) {
      return res.status(400).json({ error: 'Tags array required' });
    }
    
    const indexPath = path.join(process.cwd(), 'brain-system', 'brain-index.json');
    const idx = JSON.parse(await fs.readFile(indexPath, 'utf8'));
    
    const hits = await searchByTags(tags, idx);
    
    res.json({ 
      tags,
      hits,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Tag search failed', details: error.message });
  }
});

/**
 * GET /brain/stats - Get brain statistics
 */
brain.get('/stats', async (_req, res) => {
  try {
    const indexPath = path.join(process.cwd(), 'brain-system', 'brain-index.json');
    const idx = JSON.parse(await fs.readFile(indexPath, 'utf8'));
    
    const stats = {
      version: idx.version,
      generated: idx.generated_at,
      chapters: Object.entries(idx.chapters).map(([name, items]) => ({
        name,
        count: items.length,
        latest: items[0]?.updated_at
      })),
      totalFiles: Object.values(idx.chapters).flat().length,
      tags: [...new Set(Object.values(idx.chapters).flat().flatMap(i => i.tags))]
    };
    
    res.json(stats);
    
  } catch (error) {
    res.status(500).json({ error: 'Stats failed', details: error.message });
  }
});

/**
 * POST /brain/reindex - Trigger reindexing
 */
brain.post('/reindex', async (req, res) => {
  try {
    console.log('🔄 Manual reindex triggered');
    
    const stats = await runIndexer();
    
    res.json({ 
      message: 'Reindex complete',
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Reindex failed', details: error.message });
  }
});

export default brain;