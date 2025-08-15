// backend/server_v3.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { startPulse } = require('./pulse_worker');

// --- env helpers (устраняют проблемы с кавычками в Railway) ---
const envRaw = (k, d='') => (process.env[k] ?? d).trim().replace(/^['"]|['"]$/g, '');
const envBool = (k) => /^(true|1|yes|on)$/i.test(envRaw(k, ''));
const envInt  = (k, d) => {
  const n = parseInt(envRaw(k, String(d)), 10);
  return Number.isFinite(n) ? n : d;
};

const app = express();
const PORT = envInt('PORT', 3000);

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'annoris-autosave',
    timestamp: new Date().toISOString(),
    pulse: envBool('PULSE_ENABLED') ? 'enabled' : 'disabled'
  });
});

// Autosave endpoint
app.post('/autosave', (req, res) => {
  const token = req.headers.authorization || req.body?.token;
  if (token !== envRaw('AUTH_TOKEN')) return res.status(401).json({ error: 'Unauthorized' });
  console.log('Autosave received:', req.body);
  res.json({ success: true, message: 'Autosave processed' });
});

// Root
app.get('/', (_req, res) => {
  res.json({
    service: 'Annoris Autosave Service',
    version: '3.2',
    endpoints: ['/health', '/autosave'],
    pulse: envBool('PULSE_ENABLED') ? 'beating' : 'stopped'
  });
});

// Start
app.listen(PORT, () => {
  console.log(`Server v3.2 on :${PORT}`);
  startPulse(); // поднимем пульс
});
