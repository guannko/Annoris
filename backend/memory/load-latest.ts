// backend/memory/load-latest.ts
// GPT Final Version: Simple loader that always uses LATEST.json pointer
import fetch from "node-fetch";

const GH_TOKEN = process.env.GITHUB_TOKEN!;
const EYES_REPO = process.env.GITHUB_REPO_EYES || "guannko/offerspsp.com";
const EYES_POINTER_PATH = process.env.GITHUB_EYES_POINTER || "autosaves/LATEST.json";

async function ghJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${GH_TOKEN}` } });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

export async function loadLatestAutosave(): Promise<string> {
  console.log("📍 Loading latest autosave via LATEST.json pointer...");
  
  // 1) читаем pointer
  const ptrMeta = await ghJson<{ download_url: string }>(
    `https://api.github.com/repos/${EYES_REPO}/contents/${encodeURIComponent(EYES_POINTER_PATH)}`
  );
  const pointer = await (await fetch(ptrMeta.download_url)).json() as {
    repo: string; 
    path: string;
    sha: string;
    updated_at: string;
  };
  
  console.log(`✅ Pointer found: ${pointer.repo}/${pointer.path}`);
  console.log(`📅 Last updated: ${pointer.updated_at}`);

  // 2) скачиваем файл по указателю
  const meta = await ghJson<{ download_url: string }>(
    `https://api.github.com/repos/${pointer.repo}/contents/${encodeURIComponent(pointer.path)}`
  );
  const raw = await fetch(meta.download_url);
  const content = await raw.text();
  
  console.log(`✅ Loaded ${content.length} bytes from autosave!`);
  return content;
}

// Helper для обновления pointer после сохранения (если нужно вызвать отдельно)
export async function updatePointer(
  autosaveRepo: string,
  autosavePath: string,
  autosaveSha: string
): Promise<void> {
  const pointer = {
    repo: autosaveRepo,
    path: autosavePath,
    sha: autosaveSha,
    updated_at: new Date().toISOString()
  };
  
  // Get current pointer SHA if exists
  let currentSha: string | undefined;
  try {
    const current = await ghJson<{ sha: string }>(
      `https://api.github.com/repos/${EYES_REPO}/contents/${encodeURIComponent(EYES_POINTER_PATH)}`
    );
    currentSha = current.sha;
  } catch {
    // File doesn't exist yet
  }
  
  const body = {
    message: `Update LATEST.json pointer to ${autosavePath}`,
    content: Buffer.from(JSON.stringify(pointer, null, 2)).toString("base64"),
    ...(currentSha && { sha: currentSha })
  };
  
  const response = await fetch(
    `https://api.github.com/repos/${EYES_REPO}/contents/${encodeURIComponent(EYES_POINTER_PATH)}`,
    {
      method: "PUT",
      headers: { 
        Authorization: `Bearer ${GH_TOKEN}`,
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(body)
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to update pointer: ${await response.text()}`);
  }
  
  console.log("✅ Updated LATEST.json pointer!");
}