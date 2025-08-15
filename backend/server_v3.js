// backend/server_v3.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { Octokit } = require('@octokit/rest');

const app = express();
const PORT = process.env.PORT || 8080;

// --- helpers ---
const val = (s) => (s || '').trim().replace(/^"+|"+$/g, '');
const isTrue = (s) => /^(true|1|yes)$/i.test(val(s));
const int  = (s, d) => {
  const n = parseInt(val(s), 10);
  return Number.isFinite(n) ? n : d;
};
const tzOff = int(process.env.TIMEZONE_OFFSET, 3);
const ts = () => {
  const d = new Date(Date.now() + tzOff * 3600 * 1000);
  return { iso: new Date().toISOString(), local: d.toISOString().replace('T',' ').slice(0,19) + ` UTC+${tzOff}` };
};

// --- Pulse (writes to GitHub repo) ---
async function upsertJSON({octokit, owner, repo, path, content, message}) {
  let sha;
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    if (!Array.isArray(data)) sha = data.sha;
  } catch (e) {
    if (e.status && e.status !== 404) throw e;
  }
  await octokit.repos.createOrUpdateFileContents({
    owner, repo, path, sha,
    message,
    content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64')
  });
}

function startPulse() {
  if (!isTrue(process.env.PULSE_ENABLED)) {
    console.log('🔕 Pulse disabled (set PULSE_ENABLED=true).');
    return () => {};
  }

  const token  = val(process.env.GITHUB_TOKEN);
  const target = val(process.env.GITHUB_REPO_EYES || 'guannko/offerspsp.com');
  const path   = val(process.env.PULSE_PATH || 'autosaves/HEARTBEAT.json');
  const everyS = int(process.env.PULSE_INTERVAL_SEC, 300);

  if (!token) {
    console.warn('⚠️ Pulse: GITHUB_TOKEN missing → pulse not started.');
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
      timezone_offset: tzOff,
    };
    try {
      await upsertJSON({
        octokit, owner, repo, path,
        content: payload,
        message: `pulse: ${payload.updated_at_utc} (${reason})`
      });
      console.log(`💓 Pulse → ${owner}/${repo}/${path} @ ${payload.updated_at_local}`);
    } catch (e) {
      console.error('Pulse error:', e.message);
    }
  };

  console.log(`🔁 Pulse worker started — every ${everyS} sec → ${path}`);
  tick('startup').catch(()=>{});
  const id = setInterval(() => tick().catch(()=>{}), everyS * 1000);
  return () => clearInterval(id);
}

// --- app ---
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'annoris-autosave',
    timestamp: new Date().toISOString(),
    pulse: isTrue(process.env.PULSE_ENABLED) ? 'enabled' : 'disabled'
  });
});

app.post('/autosave', (req, res) => {
  const token = (req.headers.authorization || (req.body && req.body.token) || '').trim();
  if (val(token) !== val(process.env.AUTH_TOKEN)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  console.log('Autosave received:', req.body);
  res.json({ success: true });
});

app.get('/', (_req, res) => {
  res.json({ service: 'Annoris Autosave Service', version: '3.2', endpoints: ['/health','/autosave'] });
});

app.listen(PORT, () => {
  console.log(`Server v3.2 on :${PORT}`);
  startPulse();
});
