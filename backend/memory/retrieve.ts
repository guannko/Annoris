import { Pool } from "pg";
import { getEmbeddingsEngine } from "../core/embeddings";
import { isEnabled } from "../lib/featureFlags";
const pg = new Pool({ connectionString: process.env.DATABASE_URL });

export async function hybridSearch(userId: string, query: string, k = 5) {
  const eng = getEmbeddingsEngine(process.env.OPENAI_API_KEY!);
  const qvec = await eng.generateEmbedding(query);
  const hybrid = await isEnabled("hybridSearch");

  const c = await pg.connect();
  try {
    const results = [];

    // 1) brain_index (быстрое «оглавление»)
    const idx = await c.query(
      `SELECT path, title, summary, 1 - (vec <=> $1::vector) AS score
       FROM brain_index WHERE vec IS NOT NULL
       ORDER BY vec <=> $1::vector ASC LIMIT $2`, [qvec, k]);
    results.push(...idx.rows.map(r => ({type:"index", ...r})));

    if (hybrid) {
      // 2) vector по событиям
      const v = await c.query(
        `SELECT e.id, e.text, 1 - (b.vec <=> $1::vector) AS score
         FROM brain_embeddings b
         JOIN brain_events e ON e.id=b.event_id AND e.user_id=$2
         ORDER BY b.vec <=> $1::vector ASC LIMIT $3`,
        [qvec, userId, k]);
      results.push(...v.rows.map(r => ({type:"vector", ...r})));

      // 3) trgm fuzzy по тексту
      const t = await c.query(
        `SELECT id, text, similarity(text,$1) AS score
         FROM brain_events WHERE user_id=$2
         ORDER BY text <-> $1 ASC LIMIT $3`,
        [query, userId, k]);
      results.push(...t.rows.map(r => ({type:"text", ...r})));
    }

    // нормализация + top‑k
    return results
      .sort((a,b)=>b.score-a.score)
      .slice(0, k)
      .map(r => r.summary ? `${r.title}: ${r.summary}` : r.text);
  } finally { c.release(); }
}