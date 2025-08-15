// backend/routes/autosave_v2.ts
import { Router } from "express";
import fetch from "node-fetch";
import { captureEvent } from "../memory/capture";
import { auth } from "../middleware/auth";

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

    res.json({
      ok: true,
      file: { repo: ANNORIS_REPO, path: autosavePath, sha: autosaveSha },
      pointer: { repo: EYES_REPO, path: EYES_POINTER_PATH, updated: true },
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error("autosave_v2 error:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

r.get("/autosave/health", (_req, res) => {
  res.json({
    ok: true,
    service: "autosave_v2",
    env: { ANNORIS_REPO, ANNORIS_PATH, EYES_REPO, EYES_POINTER_PATH, hasToken: !!GH_TOKEN },
    timestamp: new Date().toISOString(),
  });
});

export default r;