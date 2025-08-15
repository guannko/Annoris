// backend/memory/load-latest.ts
// GPT Solution: Reliable autosave loader with triple fallback
import fetch from "node-fetch";

const GH = "https://api.github.com/repos";
const token = process.env.GITHUB_TOKEN!;
const H = { 
  Authorization: `Bearer ${token}`, 
  Accept: "application/vnd.github+json" 
};

async function getJSON(url: string) {
  const r = await fetch(url, { headers: H }); 
  if (!r.ok) throw new Error(await r.text()); 
  return r.json();
}

// Primary: Load by LATEST.json pointer
async function loadByPointer() {
  const repo = process.env.EYES_REPO || "guannko/offerspsp.com";
  const ptr = await getJSON(`${GH}/${repo}/contents/autosaves/LATEST.json`);
  const raw = await fetch(ptr.download_url); 
  const latest = JSON.parse(await raw.text());
  
  // Now fetch the actual autosave file
  const file = await getJSON(`${GH}/${latest.repo}/contents/${latest.path}`);
  const content = await fetch(file.download_url);
  return content.text();
}

// Fallback: Find latest by pattern
async function loadLatestIn(repo: string, folder = "") {
  const list = await getJSON(`${GH}/${repo}/contents/${folder}`);
  const files = list.filter((f: any) => 
    /^jean-claude-autosave-\d{8}[-T]\d{4}\.md$/.test(f.name)
  );
  
  if (!files.length) throw new Error("no autosaves found");
  
  // Sort by filename (YYYYMMDD-HHMM or YYYYMMDDTHHMM)
  files.sort((a: any, b: any) => b.name.localeCompare(a.name));
  
  const raw = await fetch(files[0].download_url);
  return raw.text();
}

// Main loader with triple fallback
export async function loadLatestAutosave() {
  console.log("🔍 Loading latest autosave...");
  
  try { 
    console.log("📍 Trying LATEST.json pointer...");
    const content = await loadByPointer();
    console.log("✅ Loaded from pointer!");
    return content;
  } catch(e) { 
    console.log("⚠️ Pointer failed, trying Annoris...");
  }
  
  try { 
    const content = await loadLatestIn(
      process.env.BRAIN_REPO || "guannko/Annoris"
    );
    console.log("✅ Loaded from Annoris!");
    return content;
  } catch(e) { 
    console.log("⚠️ Annoris failed, trying offerspsp.com...");
  }
  
  const content = await loadLatestIn(
    process.env.EYES_REPO || "guannko/offerspsp.com"
  );
  console.log("✅ Loaded from offerspsp.com!");
  return content;
}

// Update pointer after saving new autosave
export async function updateLatestPointer(
  autosaveRepo: string,
  autosavePath: string,
  autosaveSha: string
) {
  const eyesRepo = process.env.EYES_REPO || "guannko/offerspsp.com";
  const pointerPath = "autosaves/LATEST.json";
  
  // Get current pointer SHA if exists
  let currentSha: string | undefined;
  try {
    const current = await getJSON(`${GH}/${eyesRepo}/contents/${pointerPath}`);
    currentSha = current.sha;
  } catch {
    // File doesn't exist yet
  }
  
  const pointerContent = JSON.stringify({
    repo: autosaveRepo,
    path: autosavePath,
    sha: autosaveSha,
    updated_at: new Date().toISOString()
  }, null, 2);
  
  const body = {
    message: "Update LATEST.json pointer to newest autosave",
    content: Buffer.from(pointerContent).toString("base64"),
    ...(currentSha && { sha: currentSha })
  };
  
  const response = await fetch(
    `${GH}/${eyesRepo}/contents/${pointerPath}`,
    {
      method: "PUT",
      headers: { ...H, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to update pointer: ${await response.text()}`);
  }
  
  console.log("✅ Updated LATEST.json pointer!");
}