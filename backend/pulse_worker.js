// backend/pulse_worker.js
const { Octokit } = require("@octokit/rest");

function ts() {
  const off = parseInt(process.env.TIMEZONE_OFFSET || "3", 10);
  const d = new Date(Date.now() + off * 3600 * 1000);
  return {
    iso: new Date().toISOString(),
    local: d.toISOString().replace("T", " ").slice(0, 19) + ` UTC+${off}`,
    off,
  };
}

async function upsertJSON({ octokit, owner, repo, path, content, message }) {
  let sha;
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    if (!Array.isArray(data)) sha = data.sha;
  } catch (e) {
    if (e.status && e.status !== 404) throw e;
  }
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    sha,
    message,
    content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64"),
  });
}

function startPulse() {
  if (process.env.PULSE_ENABLED !== "true") {
    console.log("🔕 Pulse disabled (set PULSE_ENABLED=true).");
    return () => {};
  }

  const token = process.env.GITHUB_TOKEN;
  const target = process.env.GITHUB_REPO_EYES || "guannko/offerspsp.com";
  const path = process.env.PULSE_PATH || "autosaves/HEARTBEAT.json";
  const every = parseInt(process.env.PULSE_INTERVAL_SEC || "300", 10);

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
      timezone_offset: t.off,
    };
    try {
      await upsertJSON({
        octokit,
        owner,
        repo,
        path,
        content: payload,
        message: `pulse: ${payload.updated_at_utc} (${reason})`,
      });
      console.log(`💓 Pulse → ${owner}/${repo}/${path} @ ${payload.updated_at_local}`);
    } catch (e) {
      console.error("Pulse error:", e.message);
    }
  };

  // стартуем сразу и ставим интервал
  tick("startup").catch(() => {});
  const id = setInterval(() => tick().catch(() => {}), every * 1000);
  return () => clearInterval(id);
}

module.exports = { startPulse };
