// backend/pulse_worker.js
const { Octokit } = require('@octokit/rest');

// env helpers (нормализация значений из Railway)
const envRaw = (k, d='') => (process.env[k] ?? d).trim().replace(/^['"]|['"]$/g, '');
const envBool = (k) => /^(true|1|yes|on)$/i.test(envRaw(k, ''));
const envInt  = (k, d) => {
  const n = parseInt(envRaw(k, String(d)), 10);
  return Number.isFinite(n) ? n : d;
};

function ts() {
  const offset = envInt('TIMEZONE_OFFSET', 3);
  const d = new Date(Date.now() + offset * 3600 * 1000);
  return {
    iso: new Date().toISOString(),
    local: d.toISOString().replace('T',' ').slice(0,19) + ` UTC+${offset}`
  };
}

async function upsertFile({octokit, owner, repo, path, content, message}) {
  try {
    let sha;
    try {
      const { data } = await octokit.repos.getContent({ owner, repo, path });
      if (!Array.isArray(data)) sha = data.sha;
    } catch (e) {
      if (e.status !== 404) throw e; // если не 404 — пробрасываем
    }

    await octokit.repos.createOrUpdateFileContents({
      owner, repo, path, sha,
      message,
      content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64')
    });
    return true;
  } catch (e) {
    console.error('Pulse upsert error:', e.message);
    return false;
  }
}

function startPulse() {
  if (!envBool('PULSE_ENABLED')) {
    console.log('🔕 Pulse disabled (set PULSE_ENABLED=true).');
    return () => {};
  }

  const intervalSec = envInt('PULSE_INTERVAL_SEC', 300);
  const token  = envRaw('GITHUB_TOKEN');
  const target = envRaw('GITHUB_REPO_EYES', 'guannko/offerspsp.com');
  const path   = envRaw('PULSE_PATH', 'autosaves/HEARTBEAT.json');

  if (!token) {
    console.warn('⚠️ Pulse: GITHUB_TOKEN missing. Pulse disabled.');
    return () => {};
  }

  const [owner, repo] = target.split('/');
  const octokit = new Octokit({ auth: token });

  const tick = async (reason = 'interval') => {
    const t = ts();
    const payload = {
      ok: true,
      service: 'annoris-autosave',
      reason,
      updated_at_utc: t.iso,
      updated_at_local: t.local,
      timezone_offset: envInt('TIMEZONE_OFFSET', 3),
      env: {
        annoris: envRaw('GITHUB_REPO_ANNORIS', 'guannko/Annoris'),
        eyes: target
      }
    };
    const ok = await upsertFile({
      octokit, owner, repo, path,
      content: payload,
      message: `pulse: ${payload.updated_at_utc} (${reason})`
    });
    if (ok) console.log(`💓 Pulse → ${owner}/${repo}/${path} @ ${payload.updated_at_local}`);
  };

  // немедленный пульс + интервал
  tick('startup').catch(()=>{});
  const id = setInterval(() => tick().catch(()=>{}), intervalSec * 1000);

  return () => clearInterval(id);
}

module.exports = { startPulse };
