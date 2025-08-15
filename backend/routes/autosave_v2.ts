// backend/routes/autosave_v2.ts
import { Router } from "express";
import fetch from "node-fetch";
import { captureEvent } from "../memory/capture";
import { auth } from "../middleware/auth_v2"; // Using v2 with beacon support

const r = Router();

// ── ENV ────────────────────────────────────────────────────────────
const GH_TOKEN = process.env.GITHUB_TOKEN!;
const ANNORIS_REPO = process.env.GITHUB_REPO_ANNORIS || "guannko/Annoris";
const ANNORIS_PATH = process.env.GITHUB_PATH_ANNORIS || "autosaves";
const EYES_REPO = process.env.GITHUB_REPO_EYES || "guannko/offerspsp.com";
const EYES_POINTER_PATH = process.env.GITHUB_EYES_POINTER || "autosaves/LATEST.json";

const GH_BASE = (repo: string) => `https://api.github.com/repos/${repo}/contents`;

type Pointer = {
  repo: string;
  path: string;
  sha: string;
  updated_at: string;
};

// ── Rate Limiting ────────────────────────────────────────────────
const lastHit = new Map<string, number>(); // key=userId

function allow(userId: string, ms = 5000): boolean {
  const now = Date.now();
  const prev = lastHit.get(userId) ?? 0;
  if (now - prev < ms) return false;
  lastHit.set(userId, now); 
  return true;
}

// Clean up old entries periodically (prevent memory leak)
setInterval(() => {
  const now = Date.now();
  const expired = now - 60000; // Clear entries older than 1 minute
  for (const [userId, timestamp] of lastHit.entries()) {
    if (timestamp < expired) {
      lastHit.delete(userId);
    }
  }
}, 60000); // Run cleanup every minute

// ── GitHub helpers ────────────────────────────────────────────────
async function ghPutFile(repo: string, path: string, contentUtf8: string, message: string, sha?: string) {
  const url = `${GH_BASE(repo)}/${encodeURIComponent(path)}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: "application/vnd.github+json",
    },
    body: JSON.stringify({
      message,
      content: Buffer.from(contentUtf8, "utf8").toString("base64"),
      sha,
      committer: {
        name: process.env.GIT_AUTHOR_NAME || "Iskra",
        email: process.env.GIT_AUTHOR_EMAIL || "iskra@offerspsp.com",
      },
    }),
  });
  if (!res.ok) throw new Error(`GitHub PUT ${repo}/${path}: ${res.status} ${await res.text()}`);
  return res.json() as Promise<{ content: { sha: string } }>;
}

async function ghGetContent(repo: string, path: string) {
  const url = `${GH_BASE(repo)}/${encodeURIComponent(path)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: "application/vnd.github+json" },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub GET ${repo}/${path}: ${res.status} ${await res.text()}`);
  return res.json() as Promise<{ sha: string; download_url: string }>;
}

// ── Route ─────────────────────────────────────────────────────────
r.post("/autosave", auth, async (req, res) => {
  try {
    const { text, meta, userId = "boris", description, stats } = (req.body ?? {}) as {
      text?: string; meta?: any; userId?: string; description?: string; stats?: any;
    };
    
    if (!text) return res.status(400).json({ error: "text required" });
    
    // Rate limiting check (improved function name)
    if (!allow(userId)) {
      return res.status(429).json({ 
        ok: false, 
        error: "too many autosaves",
        retryAfter: 5000 
      });
    }

    // Log the save reason if provided
    const reason = meta?.reason || "unknown";
    console.log(`💾 Autosave triggered: userId=${userId}, reason=${reason}`);

    await captureEvent({ userId, source: "autosave", bucket: "left", text, meta });

    const ts = new Date().toISOString().replace(/[:]/g, "").slice(0, 15); // YYYYMMDDTHHMM
    const filename = `jean-claude-autosave-${ts}.md`;
    const autosavePath = `${ANNORIS_PATH}/${filename}`;
    const putResp = await ghPutFile(ANNORIS_REPO, autosavePath, text, `autosave: ${filename}`);
    const autosaveSha = putResp.content.sha;

    const pointer: Pointer = {
      repo: ANNORIS_REPO,
      path: autosavePath,
      sha: autosaveSha,
      updated_at: new Date().toISOString(),
    };

    const existing = await ghGetContent(EYES_REPO, EYES_POINTER_PATH);
    await ghPutFile(
      EYES_REPO,
      EYES_POINTER_PATH,
      JSON.stringify(pointer, null, 2),
      `update LATEST.json -> ${filename}`,
      existing?.sha
    );

    console.log(`✅ Autosave complete: ${filename}`);

    res.json({
      ok: true,
      file: { repo: ANNORIS_REPO, path: autosavePath, sha: autosaveSha },
      pointer: { repo: EYES_REPO, path: EYES_POINTER_PATH, updated: true },
      timestamp: new Date().toISOString(),
      reason,
    });
  } catch (e: any) {
    console.error("❌ autosave_v2 error:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

r.get("/autosave/health", (_req, res) => {
  res.json({
    ok: true,
    service: "autosave_v2",
    auth: "flexible (header/body/query)",
    env: { ANNORIS_REPO, ANNORIS_PATH, EYES_REPO, EYES_POINTER_PATH, hasToken: !!GH_TOKEN },
    rateLimit: {
      windowMs: 5000,
      activeUsers: lastHit.size
    },
    timestamp: new Date().toISOString(),
  });
});

export default r;