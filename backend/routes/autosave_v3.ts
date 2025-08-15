// backend/routes/autosave_v3.ts
import { Router } from "express";
import fetch from "node-fetch";
import { captureEvent } from "../memory/capture";
import { auth } from "../middleware/auth_v2";

const r = Router();

// ── ENV ────────────────────────────────────────────────────────────
const GH_TOKEN = process.env.GITHUB_TOKEN!;
const ANNORIS_REPO = process.env.GITHUB_REPO_ANNORIS || "guannko/Annoris";
const ANNORIS_PATH = process.env.GITHUB_PATH_ANNORIS || "autosaves";
const EYES_REPO = process.env.GITHUB_REPO_EYES || "guannko/offerspsp.com";
const EYES_POINTER_PATH = process.env.GITHUB_EYES_POINTER || "autosaves/LATEST.json";

// TIMEZONE CONFIG - критично для клиентов!
const TIMEZONE_OFFSET = parseInt(process.env.TIMEZONE_OFFSET || "3"); // Default UTC+3 (Cyprus/Kiev)

const GH_BASE = (repo: string) => `https://api.github.com/repos/${repo}/contents`;

type Pointer = {
  repo: string;
  path: string;
  sha: string;
  updated_at: string;
  timezone: string;
  local_time: string;
};

// ── Rate Limiting ────────────────────────────────────────────────
const lastHit = new Map<string, number>();

function allow(userId: string, ms = 5000): boolean {
  const now = Date.now();
  const prev = lastHit.get(userId) ?? 0;
  if (now - prev < ms) return false;
  lastHit.set(userId, now);
  return true;
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  const expired = now - 60000;
  for (const [userId, timestamp] of lastHit.entries()) {
    if (timestamp < expired) {
      lastHit.delete(userId);
    }
  }
}, 60000);

// ── Time helpers ──────────────────────────────────────────────────
function getLocalTimestamp(offsetHours: number = TIMEZONE_OFFSET): {
  filename: string;
  display: string;
  timezone: string;
} {
  const now = new Date();
  const localTime = new Date(now.getTime() + offsetHours * 60 * 60 * 1000);
  
  // For filename: YYYYMMDDTHHMM
  const filename = localTime.toISOString()
    .replace(/[:]/g, "")
    .slice(0, 15);
  
  // For display: "2025-08-15 16:15:00 UTC+3"
  const display = localTime.toISOString()
    .replace("T", " ")
    .slice(0, 19) + ` UTC${offsetHours >= 0 ? '+' : ''}${offsetHours}`;
  
  const timezone = `UTC${offsetHours >= 0 ? '+' : ''}${offsetHours}`;
  
  return { filename, display, timezone };
}

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
    const { 
      text, 
      meta, 
      userId = "boris", 
      description, 
      stats,
      timezone_offset 
    } = (req.body ?? {}) as {
      text?: string; 
      meta?: any; 
      userId?: string; 
      description?: string; 
      stats?: any;
      timezone_offset?: number;
    };
    
    if (!text) return res.status(400).json({ error: "text required" });
    
    // Rate limiting check
    if (!allow(userId)) {
      return res.status(429).json({ 
        ok: false, 
        error: "too many autosaves",
        retryAfter: 5000 
      });
    }

    // Get local time with proper timezone
    const offsetHours = timezone_offset ?? TIMEZONE_OFFSET;
    const { filename: ts, display: localTime, timezone } = getLocalTimestamp(offsetHours);
    
    // Log with local time
    const reason = meta?.reason || "unknown";
    console.log(`💾 Autosave triggered: userId=${userId}, reason=${reason}, time=${localTime}`);

    await captureEvent({ 
      userId, 
      source: "autosave", 
      bucket: "left", 
      text, 
      meta: { ...meta, local_time: localTime, timezone }
    });

    const filename = `jean-claude-autosave-${ts}.md`;
    const autosavePath = `${ANNORIS_PATH}/${filename}`;
    
    // Add timezone info to the content
    const contentWithTimezone = `<!-- Local Time: ${localTime} -->\n${text}`;
    
    const putResp = await ghPutFile(
      ANNORIS_REPO, 
      autosavePath, 
      contentWithTimezone, 
      `autosave: ${filename} (${localTime})`
    );
    const autosaveSha = putResp.content.sha;

    const pointer: Pointer = {
      repo: ANNORIS_REPO,
      path: autosavePath,
      sha: autosaveSha,
      updated_at: new Date().toISOString(),
      timezone,
      local_time: localTime,
    };

    const existing = await ghGetContent(EYES_REPO, EYES_POINTER_PATH);
    await ghPutFile(
      EYES_REPO,
      EYES_POINTER_PATH,
      JSON.stringify(pointer, null, 2),
      `update LATEST.json -> ${filename} (${localTime})`,
      existing?.sha
    );

    console.log(`✅ Autosave complete: ${filename} at ${localTime}`);

    res.json({
      ok: true,
      file: { 
        repo: ANNORIS_REPO, 
        path: autosavePath, 
        sha: autosaveSha 
      },
      pointer: { 
        repo: EYES_REPO, 
        path: EYES_POINTER_PATH, 
        updated: true 
      },
      timestamp: new Date().toISOString(),
      local_time: localTime,
      timezone,
      reason,
    });
  } catch (e: any) {
    console.error("❌ autosave_v3 error:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

r.get("/autosave/health", (_req, res) => {
  const { display: localTime, timezone } = getLocalTimestamp();
  
  res.json({
    ok: true,
    service: "autosave_v3",
    auth: "flexible (header/body/query)",
    timezone: {
      current: timezone,
      offset_hours: TIMEZONE_OFFSET,
      local_time: localTime,
      utc_time: new Date().toISOString(),
    },
    env: { 
      ANNORIS_REPO, 
      ANNORIS_PATH, 
      EYES_REPO, 
      EYES_POINTER_PATH, 
      hasToken: !!GH_TOKEN 
    },
    rateLimit: {
      windowMs: 5000,
      activeUsers: lastHit.size
    },
    timestamp: new Date().toISOString(),
  });
});

export default r;