import { buildIndex } from '../indexer/brain-indexer';
import fs from 'fs/promises';
import path from 'path';

/**
 * Brain index cron job - runs every 5 minutes
 */
export async function runIndexer() {
  console.log('🔄 Brain Index Cron: Starting...');
  
  try {
    const root = process.env.BRAIN_ROOT || '../offerspsp.com';
    const idx = await buildIndex(root);
    
    const outputPath = path.join(
      process.cwd(), 
      'brain-system', 
      'brain-index.json'
    );
    
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(idx, null, 2));
    
    const stats = {
      version: idx.version,
      generated: idx.generated_at,
      chapters: Object.entries(idx.chapters).map(([name, items]) => ({
        name,
        count: items.length
      }))
    };
    
    console.log('✅ Brain Index Updated:', JSON.stringify(stats, null, 2));
    return stats;
    
  } catch (error) {
    console.error('❌ Brain Index Cron Failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  runIndexer()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

// Export for use in other modules
export default runIndexer;