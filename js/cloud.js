/**
 * 全班史績榜：讀寫 Google Apps Script 網頁應用程式。
 */
import { getCloudUrl } from "./data/cloud.js?v=rad74";
import { userSnapshot, ensureArena } from "./progress.js?v=rad73";
import { getCharacter, heroDisplayName } from "./data/characters.js?v=rad50";

let upsertTimer = null;

function qs(params) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v == null || v === "") return;
    p.set(k, String(v));
  });
  return p.toString();
}

function jsonp(url) {
  return new Promise((resolve, reject) => {
    const cb = `rpsCloudCb${Math.random().toString(36).slice(2, 10)}`;
    const script = document.createElement("script");
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("timeout"));
    }, 14000);
    function cleanup() {
      clearTimeout(timer);
      script.remove();
      try {
        delete window[cb];
      } catch {
        window[cb] = undefined;
      }
    }
    window[cb] = (data) => {
      cleanup();
      resolve(data);
    };
    script.onerror = () => {
      cleanup();
      reject(new Error("jsonp"));
    };
    script.src = `${url}${url.includes("?") ? "&" : "?"}callback=${encodeURIComponent(cb)}`;
    document.head.appendChild(script);
  });
}

async function cloudGet(params) {
  const base = getCloudUrl();
  if (!base) throw new Error("no-cloud");
  const url = `${base}?${qs(params)}`;
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow" });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === "object") return data;
    }
  } catch {
    /* CORS／轉址失敗時改用 JSONP */
  }
  const data = await jsonp(url);
  if (!data || typeof data !== "object") throw new Error("bad-json");
  return data;
}

export async function pullCloudBoard() {
  const data = await cloudGet({ action: "list" });
  if (!data?.ok || !Array.isArray(data.rows)) throw new Error("list-bad");
  return data.rows;
}

export function payloadFromUser(user) {
  const snap = userSnapshot(user);
  const arena = ensureArena(user);
  const char = getCharacter(user.gender, user.characterId);
  return {
    action: "upsert",
    u: String(user.username || "").toUpperCase(),
    n: heroDisplayName(user, char),
    y: user.formYear || "",
    idn: snap.identityName || "",
    lv: snap.level.level,
    xp: user.xp || 0,
    score: snap.score || 0,
    week: arena.weekScore || 0,
    streak: Number(user.streak) || 0,
  };
}

export async function upsertCloudUser(user) {
  if (!getCloudUrl() || !user?.username) return null;
  const data = await cloudGet(payloadFromUser(user));
  if (!data?.ok) throw new Error(data?.error || "upsert-fail");
  return data;
}

export function scheduleCloudUpsert(user) {
  if (!getCloudUrl() || !user?.username) return;
  clearTimeout(upsertTimer);
  upsertTimer = setTimeout(() => {
    upsertCloudUser(user).catch(() => {});
  }, 900);
}

export function cloudRankOf(rows, user) {
  if (!user || !Array.isArray(rows)) return 0;
  const me = String(user.username || "").toUpperCase();
  const year = user.formYear || "";
  const list = year ? rows.filter((r) => !r.formYear || r.formYear === year) : rows;
  const i = list.findIndex((r) => String(r.username || "").toUpperCase() === me);
  return i < 0 ? 0 : i + 1;
}
