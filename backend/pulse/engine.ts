import fs from 'fs/promises';
import path from 'path';
import { search } from '../rag/search';

export type Pulse = { 
  key: string; 
  when: 'morning' | 'day' | 'evening' | 'night'; 
  rate: number; 
  action: 'reflect' | 'check-in' | 'organize' | 'ping'; 
};

export const defaultPulses: Pulse[] = [
  { key: 'morning-reflect', when: 'morning', rate: 3, action: 'reflect' },
  { key: 'evening-check', when: 'evening', rate: 2, action: 'check-in' },
  { key: 'night-organize', when: 'night', rate: 1, action: 'organize' }
];

/**
 * Get current time slot
 */
function slotOf(d: Date): 'morning' | 'day' | 'evening' | 'night' {
  const h = d.getHours();
  if (h < 6) return 'night';
  if (h < 12) return 'morning';
  if (h < 18) return 'day';
  return 'evening';
}

/**
 * Main pulse tick - runs every minute
 */
export async function tick(now = new Date()) {
  const slot = slotOf(now);
  console.log(`⏰ Pulse tick at ${now.toISOString()} - slot: ${slot}`);
  
  for (const p of defaultPulses.filter(p => p.when === slot)) {
    // Random chance based on rate
    if (Math.random() < p.rate / 10) {
      await runPulse(p);
    }
  }
}

/**
 * Run specific pulse action
 */
async function runPulse(p: Pulse) {
  console.log(`🎯 Running pulse: ${p.key}`);
  
  if (p.action === 'reflect') await morningReflect();
  if (p.action === 'check-in') await eveningCheck();
  if (p.action === 'organize') await nightOrganize();
  if (p.action === 'ping') await pingUser();
}

/**
 * Morning reflection - what changed yesterday?
 */
async function morningReflect() {
  try {
    const indexPath = path.join(process.cwd(), 'brain-system', 'brain-index.json');
    const idx = JSON.parse(await fs.readFile(indexPath, 'utf8'));
    
    // Search for recent changes
    const hits = await search('autosave yesterday recent changes', idx, 3);
    
    const summary = hits.map(h => h.title).join(' | ');
    await log('reflect', `Morning reflection: ${summary}`);
    
    // TODO: Send to Telegram/Discord
    console.log('☀️ Morning Reflection:', summary);
    
  } catch (error) {
    console.error('❌ Morning reflect failed:', error);
  }
}

/**
 * Evening check-in
 */
async function eveningCheck() {
  try {
    const indexPath = path.join(process.cwd(), 'brain-system', 'brain-index.json');
    const idx = JSON.parse(await fs.readFile(indexPath, 'utf8'));
    
    // Check active projects
    const hits = await search('ISKRA OffersPSP active development', idx, 2);
    
    const projects = hits.map(h => h.title).join(', ');
    await log('check-in', `Evening check: ${projects}`);
    
    console.log('🌆 Evening Check:', projects);
    
  } catch (error) {
    console.error('❌ Evening check failed:', error);
  }
}

/**
 * Night organization - clean up and prepare
 */
async function nightOrganize() {
  try {
    const indexPath = path.join(process.cwd(), 'brain-system', 'brain-index.json');
    const idx = JSON.parse(await fs.readFile(indexPath, 'utf8'));
    
    // Find protocols and memory files
    const hits = await search('protocol memory system update', idx, 3);
    
    const files = hits.map(h => h.path).join(', ');
    await log('organize', `Night organize: ${files}`);
    
    console.log('🌙 Night Organize:', files);
    
  } catch (error) {
    console.error('❌ Night organize failed:', error);
  }
}

/**
 * Ping user with status
 */
async function pingUser() {
  console.log('📱 Ping user - system alive!');
  await log('ping', 'System heartbeat');
}

/**
 * Log pulse activity
 */
async function log(kind: string, note: string) {
  const timestamp = new Date().toISOString();
  console.log(`[PULSE] ${timestamp} - ${kind}: ${note}`);
  
  // TODO: Write to database or file
  const logPath = path.join(process.cwd(), 'brain-system', 'pulse.log');
  try {
    await fs.appendFile(logPath, `${timestamp} - ${kind}: ${note}\n`);
  } catch (error) {
    // Silent fail for logging
  }
}

export default { tick, defaultPulses, runPulse };