const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const DIR = path.join(__dirname, '..', 'backend', 'db', 'migrations');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations(
        id text PRIMARY KEY,
        applied_at timestamptz DEFAULT now()
      )`);
    const files = fs.readdirSync(DIR).filter(f => f.endsWith('.sql')).sort();
    for (const f of files) {
      const done = await client.query('SELECT 1 FROM _migrations WHERE id=$1', [f]);
      if (done.rowCount) continue;
      const sql = fs.readFileSync(path.join(DIR, f), 'utf8');
      await client.query(sql);
      await client.query('INSERT INTO _migrations(id) VALUES($1)', [f]);
      console.log('applied', f);
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
