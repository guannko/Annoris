const express = require('express');
const cors = require('cors');
require('dotenv').config();
// ВРЕМЕННО ОТКЛЮЧАЕМ PULSE
// const { startPulse } = require('./pulse_worker');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'annoris-autosave',
    timestamp: new Date().toISOString(),
    pulse: 'temporarily disabled'
  });
});

// Autosave endpoint 
app.post('/autosave', (req, res) => {
  const token = req.headers.authorization || req.body.token;
  
  if (token !== process.env.AUTH_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  console.log('Autosave received:', req.body);
  res.json({ success: true, message: 'Autosave processed' });
});

// Root
app.get('/', (req, res) => {
  res.json({ 
    service: 'Annoris Autosave Service',
    version: '3.0-hotfix',
    endpoints: ['/health', '/autosave'],
    pulse: 'temporarily disabled - missing dependencies'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server v3.0-hotfix running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log('⚠️ Pulse temporarily disabled - need to add @octokit/rest');
  
  // PULSE ОТКЛЮЧЕН ПОКА
  // const stopPulse = startPulse();
});