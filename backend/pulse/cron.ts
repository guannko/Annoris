#!/usr/bin/env node
import { tick } from './engine';

console.log('🎯 Pulse Engine Started');
console.log('⏰ Ticking every minute...');

// Initial tick
tick();

// Run every minute
setInterval(() => {
  tick();
}, 60_000);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Pulse Engine shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Pulse Engine interrupted');
  process.exit(0);
});