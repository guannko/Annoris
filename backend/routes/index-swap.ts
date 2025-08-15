import { Router } from "express";
import { Pool } from "pg";
import { auth } from "../middleware/auth";
const r = Router(); 
const pg = new Pool({ connectionString: process.env.DATABASE_URL });

r.post("/brain/index/swap", auth, async (_req, res) => {
  const client = await pg.connect();
  try {
    await client.query("BEGIN");
    await client.query(`ALTER TABLE brain_index RENAME TO brain_index_old`);
    await client.query(`ALTER TABLE brain_index_new RENAME TO brain_index`);
    await client.query("COMMIT");
    res.json({ ok:true });
  } catch (e:any) {
    await client.query("ROLLBACK");
    res.status(500).json({ ok:false, error:e?.message });
  } finally { client.release(); }
});

export default r;