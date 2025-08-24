import { Router } from 'express';
import { Pool } from 'pg';
import { auth } from '../middleware/auth';

const r = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

r.post('/brain/index/swap', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Atomic swap
    await client.query('ALTER TABLE brain_index RENAME TO brain_index_old');
    await client.query('ALTER TABLE brain_index_new RENAME TO brain_index');
    await client.query('DROP TABLE IF EXISTS brain_index_old CASCADE');
    
    await client.query('COMMIT');
    res.json({ ok: true, message: 'Index swapped successfully' });
  } catch (e: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ ok: false, error: e.message });
  } finally {
    client.release();
  }
});

export default r;
