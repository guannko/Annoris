import { getRedis } from "../lib/redis";
type Flag = "hybridSearch"|"indexBlueGreen"|"pulseDynamicRate";
const DEFAULTS: Record<Flag, boolean> = {
  hybridSearch: true,
  indexBlueGreen: true,
  pulseDynamicRate: true
};
export async function isEnabled(flag: Flag) {
  const r = await getRedis();
  const v = await r?.get(`ff:${flag}`);
  return v === null || v === undefined ? DEFAULTS[flag] : v === "1";
}
export async function setFlag(flag: Flag, on: boolean) {
  const r = await getRedis(); if (!r) return;
  await r.set(`ff:${flag}`, on ? "1":"0");
}