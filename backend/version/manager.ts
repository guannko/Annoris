import fs from 'fs/promises';
import path from 'path';
import { buildIndex } from '../indexer/brain-indexer';

/**
 * Versioned brain index management for rollback capability
 */
export class BrainVersionManager {
  private versionsDir = './brain-system/versions';
  private currentLink = './brain-system/brain-index.json';
  private versionLog = './brain-system/version.log';
  
  /**
   * Create new version with automatic backup
   */
  async createVersion(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const version = `v${timestamp}`;
    const versionPath = path.join(this.versionsDir, `${version}.json`);
    
    // Build new index
    console.log(`🔄 Building version ${version}...`);
    const index = await buildIndex();
    
    // Save current as backup if exists
    try {
      const current = await fs.readFile(this.currentLink, 'utf8');
      const backupPath = path.join(this.versionsDir, `backup-${timestamp}.json`);
      await fs.writeFile(backupPath, current);
      console.log(`💾 Backed up previous version`);
    } catch (error) {
      console.log('📝 No previous version to backup');
    }
    
    // Ensure directory exists
    await fs.mkdir(this.versionsDir, { recursive: true });
    
    // Write new version
    await fs.writeFile(versionPath, JSON.stringify(index, null, 2));
    
    // Update current link
    await fs.writeFile(this.currentLink, JSON.stringify(index, null, 2));
    
    // Log version
    await this.logVersion(version, 'created');
    
    console.log(`✅ Version ${version} created successfully`);
    return version;
  }
  
  /**
   * Rollback to specific version
   */
  async rollback(version: string): Promise<void> {
    const versionPath = path.join(this.versionsDir, `${version}.json`);
    
    // Check version exists
    try {
      await fs.access(versionPath);
    } catch (error) {
      throw new Error(`Version ${version} not found`);
    }
    
    // Backup current before rollback
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const current = await fs.readFile(this.currentLink, 'utf8');
    const backupPath = path.join(this.versionsDir, `pre-rollback-${timestamp}.json`);
    await fs.writeFile(backupPath, current);
    
    // Perform rollback
    const versionContent = await fs.readFile(versionPath, 'utf8');
    await fs.writeFile(this.currentLink, versionContent);
    
    // Log rollback
    await this.logVersion(version, 'rolled back to');
    
    console.log(`✅ Rolled back to version ${version}`);
  }
  
  /**
   * Get current version info
   */
  async getCurrentVersion(): Promise<string | null> {
    try {
      const log = await fs.readFile(this.versionLog, 'utf8');
      const lines = log.split('\n').filter(l => l);
      const lastLine = lines[lines.length - 1];
      const match = lastLine?.match(/Version: (v[\d-T]+)/);
      return match ? match[1] : null;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * List all available versions
   */
  async listVersions(): Promise<Array<{
    version: string;
    created: string;
    size: number;
    type: 'version' | 'backup';
  }>> {
    await fs.mkdir(this.versionsDir, { recursive: true });
    const files = await fs.readdir(this.versionsDir);
    
    const versions = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const stat = await fs.stat(path.join(this.versionsDir, file));
        const isBackup = file.includes('backup') || file.includes('pre-rollback');
        
        versions.push({
          version: file.replace('.json', ''),
          created: stat.mtime.toISOString(),
          size: Math.round(stat.size / 1024), // KB
          type: isBackup ? 'backup' : 'version'
        });
      }
    }
    
    return versions.sort((a, b) => 
      new Date(b.created).getTime() - new Date(a.created).getTime()
    );
  }
  
  /**
   * Clean old versions (keep last N)
   */
  async cleanOldVersions(keepLast: number = 10): Promise<number> {
    const versions = await this.listVersions();
    const toDelete = versions
      .filter(v => v.type === 'version')
      .slice(keepLast);
    
    let deleted = 0;
    for (const version of toDelete) {
      const path = path.join(this.versionsDir, `${version.version}.json`);
      await fs.unlink(path);
      deleted++;
    }
    
    if (deleted > 0) {
      console.log(`🧹 Cleaned ${deleted} old versions`);
    }
    
    return deleted;
  }
  
  /**
   * Get version diff summary
   */
  async getVersionDiff(v1: string, v2: string): Promise<{
    filesAdded: number;
    filesRemoved: number;
    filesChanged: number;
  }> {
    const path1 = path.join(this.versionsDir, `${v1}.json`);
    const path2 = path.join(this.versionsDir, `${v2}.json`);
    
    const index1 = JSON.parse(await fs.readFile(path1, 'utf8'));
    const index2 = JSON.parse(await fs.readFile(path2, 'utf8'));
    
    const files1 = new Set(Object.values(index1.chapters).flat().map(f => f.path));
    const files2 = new Set(Object.values(index2.chapters).flat().map(f => f.path));
    
    const added = [...files2].filter(f => !files1.has(f)).length;
    const removed = [...files1].filter(f => !files2.has(f)).length;
    const changed = [...files1].filter(f => {
      if (!files2.has(f)) return false;
      const f1 = Object.values(index1.chapters).flat().find(x => x.path === f);
      const f2 = Object.values(index2.chapters).flat().find(x => x.path === f);
      return f1?.sha !== f2?.sha;
    }).length;
    
    return { filesAdded: added, filesRemoved: removed, filesChanged: changed };
  }
  
  /**
   * Health check
   */
  async healthCheck(): Promise<{
    ok: boolean;
    currentVersion: string | null;
    totalVersions: number;
    lastUpdate: string | null;
    errors: string[];
  }> {
    const errors = [];
    
    try {
      const current = await this.getCurrentVersion();
      const versions = await this.listVersions();
      const currentStat = await fs.stat(this.currentLink);
      
      return {
        ok: errors.length === 0,
        currentVersion: current,
        totalVersions: versions.filter(v => v.type === 'version').length,
        lastUpdate: currentStat.mtime.toISOString(),
        errors
      };
    } catch (error) {
      errors.push(error.message);
      return {
        ok: false,
        currentVersion: null,
        totalVersions: 0,
        lastUpdate: null,
        errors
      };
    }
  }
  
  /**
   * Log version action
   */
  private async logVersion(version: string, action: string): Promise<void> {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} - Version: ${version} - Action: ${action}\n`;
    
    await fs.mkdir(path.dirname(this.versionLog), { recursive: true });
    await fs.appendFile(this.versionLog, logEntry);
  }
}

// Export singleton
export const versionManager = new BrainVersionManager();