import { readFileSync, readdirSync } from 'fs';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const dir = 'backend/db/migrations';

const run = async () => {
  const files = readdirSync(dir).sort();
  const c = await pool.connect();
  
  try {
    await c.query('BEGIN');
    await c.query('CREATE TABLE IF NOT EXISTS _migrations(id text primary key, applied_at timestamptz default now())');
    
    for (const f of files) {
      const id = f;
      const done = await c.query('SELECT 1 FROM _migrations WHERE id=$1', [id]);
      if (done.rowCount) continue;
      
      const sql = readFileSync(`${dir}/${f}`, 'utf8');
      await c.query(sql);
      await c.query('INSERT INTO _migrations(id) VALUES($1)', [id]);
      console.log('applied', id);
    }
    
    await c.query('COMMIT');
  } catch(e) {
    await c.query('ROLLBACK');
    throw e;
  } finally {
    c.release();
    process.exit(0);
  }
};

run().catch(e => {
  console.error(e);
  process.exit(1);
});