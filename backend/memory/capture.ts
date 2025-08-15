import { Pool } from "pg";
import { getEmbeddingsEngine } from "../core/embeddings";
const pg = new Pool({ connectionString: process.env.DATABASE_URL });

export async function captureEvent(input: {
  userId: string; source: string; bucket: string; text: string; meta?: any;
}) {
  const { userId, source, bucket, text, meta } = input;
  const c = await pg.connect();
  try {
    await c.query("BEGIN");
    const ev = await c.query(
      `INSERT INTO brain_events(user_id,source,bucket,text,meta)
       VALUES($1,$2,$3,$4,$5) RETURNING id`,
       [userId, source, bucket, text, meta ?? {}]);
    const id = ev.rows[0].id;

    // embedding (non-fatal)
    try {
      const eng = getEmbeddingsEngine(process.env.OPENAI_API_KEY!);
      const vec = await eng.generateEmbedding(text);
      await c.query(
        `INSERT INTO brain_embeddings(event_id,model,vec) VALUES($1,$2,$3)`,
        [id, "text-embedding-3-small", vec]);
    } catch (e) { /* log only */ }

    await c.query("COMMIT");
    return { id };
  } catch (e) {
    await c.query("ROLLBACK"); throw e;
  } finally { c.release(); }
}