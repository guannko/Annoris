import cosine from 'cosine-similarity';
import fs from 'fs/promises';
import path from 'path';

// Simple embedding function (can be replaced with OpenAI)
async function embed(text: string): Promise<number[]> {
  // Simple hash-based embedding for now
  // TODO: Replace with OpenAI embeddings
  const hash = text.toLowerCase().split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  // Generate pseudo-embedding vector
  const vector = new Array(128).fill(0);
  for (let i = 0; i < text.length; i++) {
    const idx = (hash + i) % 128;
    vector[idx] = text.charCodeAt(i) / 255;
  }
  return vector;
}

type Hit = { 
  path: string; 
  title: string; 
  score: number; 
  snippet: string; 
  visibility: string;
  tags: string[];
};

export async function search(
  query: string, 
  idx: any, 
  k: number = 5
): Promise<Hit[]> {
  console.log(`🔍 Searching for: "${query}"`);
  
  const qv = await embed(query);
  const pool = Object.values(idx.chapters).flat() as any[];
  
  const scored = await Promise.all(pool.map(async item => {
    const itemText = `${item.title} ${item.tags.join(' ')}`;
    const ev = await embed(itemText);
    
    // Calculate cosine similarity manually if library not available
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < qv.length; i++) {
      dotProduct += qv[i] * ev[i];
      normA += qv[i] * qv[i];
      normB += ev[i] * ev[i];
    }
    
    const score = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    
    return { ...item, score };
  }));
  
  // Filter and sort
  return scored
    .filter(h => h.visibility !== 'intimate') // Basic privacy
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(h => ({
      path: h.path,
      title: h.title,
      score: h.score,
      snippet: `[${h.tags.join(', ')}] - ${h.updated_at}`,
      visibility: h.visibility,
      tags: h.tags
    }));
}

export async function searchByTags(
  tags: string[],
  idx: any
): Promise<Hit[]> {
  const pool = Object.values(idx.chapters).flat() as any[];
  
  return pool
    .filter(item => 
      tags.some(tag => item.tags.includes(tag))
    )
    .map(item => ({
      path: item.path,
      title: item.title,
      score: 1.0,
      snippet: `[${item.tags.join(', ')}]`,
      visibility: item.visibility,
      tags: item.tags
    }));
}