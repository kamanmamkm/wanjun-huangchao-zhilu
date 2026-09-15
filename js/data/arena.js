/**
 * 科舉擬榜：虛擬同窗，專同玩家較本週史績（唔冒充本班實名）。
 */
import { isoDay } from "./flavor.js";

export const ARENA_RIVALS = [
  { id: "ar_chen", name: "陳墨書", vibe: "晨讀不輟" },
  { id: "ar_lin", name: "林小舟", vibe: "時序最強" },
  { id: "ar_wu", name: "吳青簡", vibe: "最愛辨錯" },
  { id: "ar_zhao", name: "趙拾遺", vibe: "史料細讀" },
  { id: "ar_han", name: "韓未央", vibe: "連捷常客" },
];

const RIVAL_BASE = {
  ar_chen: 24,
  ar_lin: 48,
  ar_wu: 72,
  ar_zhao: 96,
  ar_han: 128,
};

export function weekId(d = new Date()) {
  const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (dt.getDay() + 6) % 7;
  dt.setDate(dt.getDate() - dow);
  return isoDay(dt);
}

function hashStr(s) {
  let n = 2166136261;
  for (const ch of String(s)) {
    n ^= ch.charCodeAt(0);
    n = Math.imul(n, 16777619);
  }
  return n >>> 0;
}

export function rivalWeekScore(id, week) {
  return (RIVAL_BASE[id] || 40) + (hashStr(`${week}|${id}`) % 17);
}
