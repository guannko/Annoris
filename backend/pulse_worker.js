// backend/pulse_worker.js
const { Octokit } = require("@octokit/rest");

function ts() {
  const offset = parseInt(process.env.TIMEZONE_OFFSET || "3", 10);
  const d = new Date(Date.now() + offset * 3600 * 1000);
  return {
    iso: new Date().toISOString(),
    local: d.toISOString().replace("T"," ").slice(0,19) + ` UTC+${offset}`
  };
}

async function upsertFile({octokit, owner, repo, path, content, message}) {
  try {
    // 1) get current SHA (if file exists)
    let sha;
    try {
      const { data } = await octokit.repos.getContent({ owner, repo, path });
      if (Array.isArray(data)) throw new Error("Expected file, got dir");
      sha = data.sha;
    } catch (e) {
      // not found → create new
      if (e.status !== 404) throw e;
    }

    // 2) create/update
    await octokit.repos.createOrUpdateFileContents({
      owner, repo, path, sha,
      message,
      content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64")
    });
    return true;
  } catch (e) {
    console.error("Pulse upsert error:", e.message);
    return false;
  }
}

function startPulse() {
  if (process.env.PULSE_ENABLED !== "true") {
    console.log("🔕 Pulse disabled (set PULSE_ENABLED=true to enable).");
    return () => {};
  }

  const intervalSec = parseInt(process.env.PULSE_INTERVAL_SEC || "300", 10);
  const token = process.env.GITHUB_TOKEN;
  const target = process.env.GITHUB_REPO_EYES || "guannko/offerspsp.com";
  const path = process.env.PULSE_PATH || "autosaves/HEARTBEAT.json";

  if (!token) {
    console.warn("⚠️ Pulse: GITHUB_TOKEN missing. Pulse disabled.");
    return () => {};
  }

  const [owner, repo] = target.split("/");
  const octokit = new Octokit({ auth: token });

  const tick = async (reason = "interval") => {
    const t = ts();
    const payload = {
      ok: true,
      service: "annoris-autosave",
      reason,
      updated_at_utc: t.iso,
      updated_at_local: t.local,
      timezone_offset: parseInt(process.env.TIMEZONE_OFFSET || "3", 10),
      env: {
        annoris: process.env.GITHUB_REPO_ANNORIS || "guannko/Annoris",
        eyes: target
      }
    };
    const ok = await upsertFile({
      octokit, owner, repo, path: path,
      content: payload,
      message: `pulse: ${payload.updated_at_utc} (${reason})`
    });
    if (ok) console.log(`💓 Pulse → ${owner}/${repo}/${path} @ ${payload.updated_at_local}`);
  };

  // immediate + schedule
  tick("startup").catch(()=>{});
  const id = setInterval(() => tick().catch(()=>{}), intervalSec * 1000);

  return () => clearInterval(id);
}

module.exports = { startPulse };