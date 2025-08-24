import { Pool } from 'pg';
import { isEnabled } from '../lib/featureFlags';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function pulseTick() {
  const isDynamic = await isEnabled('pulseDynamicRate');
  const minute = new Date().getMinutes();
  
  // Dynamic rate based on load
  const rate = isDynamic ? (
    minute > 900 ? 0.5 :  // high load = slow down
    minute > 600 ? 1 :     // medium load = normal
    3                      // low load = speed up
  ) : 1;
  
  const pulses = await pool.query(
    `SELECT * FROM pulse_schedule 
     WHERE enabled = true 
     AND EXTRACT(MINUTE FROM NOW()) % $1 = 0`,
    [Math.round(1 / rate)]
  );
  
  for (const pulse of pulses.rows) {
    console.log(`Executing pulse: ${pulse.name}`);
    // Execute pulse logic here
  }
}

setInterval(pulseTick, 60000); // Check every minute
