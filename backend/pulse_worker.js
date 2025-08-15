const fs = require("fs");
const path = require("path");

const intervalSec = parseInt(process.env.PULSE_INTERVAL_SEC || "300", 10);
const pulsePath = process.env.PULSE_PATH || "autosaves/HEARTBEAT.json";
const tzOffset = parseInt(process.env.TIMEZONE_OFFSET || "0", 10);

function writePulse() {
  const now = new Date(Date.now() + tzOffset * 3600 * 1000);
  const data = {
    status: "ok",
    service: "annoris-autosave",
    timestamp: now.toISOString(),
  };

  const fullPath = path.join(__dirname, "..", pulsePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
  console.log(`💓 Pulse updated: ${fullPath}`);
}

console.log(
  `⏱ Pulse worker started — writing every ${intervalSec} seconds → ${pulsePath}`
);
writePulse();
setInterval(writePulse, intervalSec * 1000);
