import { Router } from 'express';
import fetch from 'node-fetch';
import { captureEvent } from '../memory/capture';

const r = Router();
const repo = process.env.GITHUB_REPO!;
const base = `https://api.github.com/repos/${repo}/contents`;

async function putFile(path: string, content: string, message: string) {
  const res = await fetch(`${base}/${encodeURIComponent(path)}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify({
      message,
      content: Buffer.from(content, 'utf8').toString('base64'),
      committer: {
        name: process.env.GIT_AUTHOR_NAME,
        email: process.env.GIT_AUTHOR_EMAIL,
      },
    }),
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
  return res.json();
}

r.post('/autosave', async (req, res) => {
  try {
    const { text, meta, userId = 'boris' } = (req.body ?? {}) as {
      text?: string; meta?: any; userId?: string;
    };
    if (!text) return res.status(400).json({ error: 'text required' });

    // 1) БД
    await captureEvent({ userId, source: 'autosave', bucket: 'left', text, meta });

    // 2) GitHub
    const ts = new Date().toISOString().replace(/[:]/g, '').slice(0, 15); // YYYYMMDDTHHMM
    const filename = `jean-claude-autosave-${ts}.md`;
    const path = `${process.env.GITHUB_PATH}/${filename}`;
    await putFile(path, text, `autosave: ${filename}`);

    res.json({ ok: true, repo, path, filename });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default r;
