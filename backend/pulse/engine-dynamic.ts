import { getRedis } from "../lib/redis";
import { isEnabled } from "../lib/featureFlags";
import { captureEvent } from "../memory/capture";

const QUIET = [{start:"22:30", end:"06:30"}];

function inQuiet(now = new Date()) {
  const hhmm = now.toTimeString().slice(0,5);
  const [s,e] = QUIET[0];
  return (hhmm >= s) || (hhmm < e);
}

export async function tickPulse() {
  const r = await getRedis();
  const now = new Date();
  if (inQuiet(now)) return;

  const dyn = await isEnabled("pulseDynamicRate");
  const minute = Number((await r?.get("metrics:latency:p95")) ?? 400);
  const rate = dyn ? (minute > 900 ? 0.5 : minute > 600 ? 1 : 3) : 1;

  const key = `pulse:minute:${now.toISOString().slice(0,16)}`;
  const cnt = await r?.incr(key); await r?.expire(key, 120);
  if ((cnt ?? 0) > rate) return;

  await captureEvent({
    userId: "system",
    source: "pulse",
    bucket: "right",
    text: "heartbeat:morning-reflect"
  });
}