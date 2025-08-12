#!/usr/bin/env node
import { buildIndex } from './brain-indexer';
import fs from 'fs/promises';
import path from 'path';

(async () => {
  try {
    console.log('🧠 Building Brain Index...');
    
    const root = process.env.BRAIN_ROOT || '../offerspsp.com';
    const index = await buildIndex(root);
    
    // Ensure directory exists
    const outputDir = './brain-system';
    await fs.mkdir(outputDir, { recursive: true });
    
    // Write index
    const outputPath = path.join(outputDir, 'brain-index.json');
    await fs.writeFile(outputPath, JSON.stringify(index, null, 2));
    
    // Stats
    const totalFiles = Object.values(index.chapters)
      .reduce((sum, chapter) => sum + chapter.length, 0);
    
    console.log('✅ Brain Index Updated!');
    console.log(`📊 Stats:`);
    console.log(`  - Version: ${index.version}`);
    console.log(`  - Generated: ${index.generated_at}`);
    console.log(`  - Total files: ${totalFiles}`);
    console.log(`  - Chapters:`);
    Object.entries(index.chapters).forEach(([name, items]) => {
      console.log(`    - ${name}: ${items.length} files`);
    });
    
  } catch (error) {
    console.error('❌ Failed to build index:', error);
    process.exit(1);
  }
})();