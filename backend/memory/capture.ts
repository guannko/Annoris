import { Pool } from 'pg';
import { generateEmbedding } from '../lib/embeddings';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function captureEvent(event: {
  userId: string;
  source: string;
  bucket: string;
  text: string;
  meta?: any;
}) {
  const embedding = await generateEmbedding(event.text);
  
  const query = `
    INSERT INTO brain_events (user_id, source, bucket, text, meta, embedding)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, created_at
  `;
  
  const result = await pool.query(query, [
    event.userId,
    event.source,
    event.bucket,
    event.text,
    JSON.stringify(event.meta || {}),
    `[${embedding.join(',')}]`
  ]);
  
  return result.rows[0];
}
