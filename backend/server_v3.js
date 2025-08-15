const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { startPulse } = require('./pulse_worker');

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
    pulse: process.env.PULSE_ENABLED === 'true' ? 'enabled' : 'disabled'
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
    version: '3.2',
    endpoints: ['/health', '/autosave'],
    pulse: process.env.PULSE_ENABLED === 'true' ? 'beating 💓' : 'stopped'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server v3.2 running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  
  // Start the pulse! 💓
  const stopPulse = startPulse();
  console.log(`💓 Pulse Engine: ${process.env.PULSE_ENABLED === 'true' ? 'BEATING!' : 'DISABLED'}`);
});