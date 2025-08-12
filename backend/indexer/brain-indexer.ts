import fs from 'fs/promises';
import path from 'path';
import glob from 'glob';
import crypto from 'crypto';

type Item = { 
  path: string; 
  title: string; 
  tags: string[]; 
  updated_at: string; 
  sha: string; 
  visibility: 'public' | 'private' | 'intimate' 
};

type Index = { 
  version: string; 
  generated_at: string; 
  chapters: Record<string, Item[]> 
};

function sha(s: string) {
  return crypto.createHash('sha1').update(s).digest('hex');
}

export async function buildIndex(root = '../offerspsp.com'): Promise<Index> {
  const files = glob.sync('**/*.md', { cwd: root, nodir: true });
  const chapters: Record<string, Item[]> = { 
    Autosaves: [], 
    Protocols: [], 
    Projects: [], 
    Archive: [] 
  };

  for (const f of files) {
    const full = path.join(root, f);
    const stat = await fs.stat(full);
    const name = path.basename(f);
    const content = await fs.readFile(full, 'utf8');

    const item: Item = {
      path: f,
      title: (content.match(/^#\s+(.+)$/m)?.[1] ?? name).slice(0, 140),
      tags: detectTags(f, content),
      updated_at: stat.mtime.toISOString(),
      sha: sha(f + stat.mtimeMs + content.slice(0, 512)),
      visibility: detectVisibility(content)
    };

    const bucket =
      f.includes('autosave') ? 'Autosaves' :
      f.includes('protocol') || f.includes('userPreferences') ? 'Protocols' :
      f.includes('projects') ? 'Projects' : 'Archive';

    chapters[bucket].push(item);
  }

  // Sort by date descending
  Object.keys(chapters).forEach(key => {
    chapters[key].sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  });

  return { 
    version: '2.0', 
    generated_at: new Date().toISOString(), 
    chapters 
  };
}

function detectTags(fp: string, s: string): string[] {
  const t = new Set<string>();
  if (fp.includes('aiex')) t.add('AIex');
  if (fp.includes('offerspsp')) t.add('OffersPSP');
  if (fp.includes('iskra')) t.add('ISKRA');
  if (/cerebellum|diamond|embedd/i.test(s)) t.add('Memory');
  if (/pulse|impulse|circadian/i.test(s)) t.add('Pulse');
  if (/redis|cache/i.test(s)) t.add('Cache');
  if (/ukrain|борис/i.test(s)) t.add('UA');
  if (/cursor|gpt|grok/i.test(s)) t.add('AI-Team');
  return [...t];
}

function detectVisibility(s: string): 'public' | 'private' | 'intimate' {
  if (/visibility:\s*intimate/i.test(s)) return 'intimate';
  if (/visibility:\s*private/i.test(s)) return 'private';
  return 'public';
}