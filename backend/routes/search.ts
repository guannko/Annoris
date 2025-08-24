import { Router } from 'express';
import { Pool } from 'pg';
import { auth } from '../middleware/auth';
import { hybridSearch } from '../memory/retrieve';

const r = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

r.get('/brain/search', auth, async (req, res) => {
  try {
    const { q, user = 'boris', k = 10 } = req.query as any;
    if (!q) return res.status(400).json({ error: 'q required' });
    
    const results = await hybridSearch({
      query: q,
      userId: user,
      topK: Math.min(k, 100),
    });
    
    res.json({ ok: true, query: q, results });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default r;
