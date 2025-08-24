import { Pool } from 'pg';
import { generateEmbedding } from '../lib/embeddings';
import { isEnabled } from '../lib/featureFlags';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function hybridSearch(params: {
  query: string;
  userId: string;
  topK: number;
}) {
  const useHybrid = await isEnabled('hybridSearch');
  
  if (!useHybrid) {
    // Simple keyword search
    const result = await pool.query(
      `SELECT * FROM brain_events 
       WHERE user_id = $1 AND text ILIKE $2
       ORDER BY created_at DESC LIMIT $3`,
      [params.userId, `%${params.query}%`, params.topK]
    );
    return result.rows;
  }
  
  // Hybrid: vector + keyword + fuzzy
  const embedding = await generateEmbedding(params.query);
  
  const result = await pool.query(`
    WITH vector_search AS (
      SELECT *, embedding <-> $2::vector AS distance
      FROM brain_events
      WHERE user_id = $1
      ORDER BY distance LIMIT $3
    ),
    keyword_search AS (
      SELECT *, 0 AS distance
      FROM brain_events
      WHERE user_id = $1 AND text ILIKE $4
      LIMIT $3
    ),
    fuzzy_search AS (
      SELECT *, similarity(text, $5) AS score
      FROM brain_events
      WHERE user_id = $1 AND text % $5
      ORDER BY score DESC LIMIT $3
    )
    SELECT DISTINCT ON (id) * FROM (
      SELECT * FROM vector_search
      UNION ALL
      SELECT * FROM keyword_search
      UNION ALL
      SELECT *, 1 - score AS distance FROM fuzzy_search
    ) combined
    ORDER BY id, distance
    LIMIT $3
  `, [
    params.userId,
    `[${embedding.join(',')}]`,
    params.topK,
    `%${params.query}%`,
    params.query
  ]);
  
  return result.rows;
}
