/**
 * 全班史績榜＋同一學號雲端存檔（Google Apps Script）。
 */
import { getCloudUrl } from "./data/cloud.js?v=rad80";
import { userSnapshot, ensureArena } from "./progress.js?v=rad83";
import { getCharacter, heroDisplayName } from "./data/characters.js?v=rad50";
import {
  findLocalUser,
  upsertLocalUser,
  registerUser,
  setSession,
  migrateUser,
} from "./storage.js?v=rad80";

let upsertTimer = null;
let cloudFeatures = [];

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
    }, 16000);
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

export function cloudHasSave() {
  return cloudFeatures.includes("keep") || cloudFeatures.includes("save");
}

export async function pullCloudBoard() {
  const data = await cloudGet({ action: "list" });
  if (!data?.ok || !Array.isArray(data.rows)) throw new Error("list-bad");
  cloudFeatures = Array.isArray(data.features) ? data.features : [];
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
  scheduleCloudSync(user);
}

const CHUNK = 850;

export async function passwordFingerprint(username, password) {
  const raw = `${String(username || "").toUpperCase()}\n${String(password || "")}\nrenpingsheng-v1`;
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
    return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("").slice(0, 40);
  } catch {
    let h = 2166136261;
    for (let i = 0; i < raw.length; i++) {
      h ^= raw.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return `f${(h >>> 0).toString(16)}`;
  }
}

function utf8b64(text) {
  return btoa(unescape(encodeURIComponent(text)));
}

function b64utf8(b64) {
  return decodeURIComponent(escape(atob(b64)));
}

async function gzipB64(text) {
  const cs = new CompressionStream("gzip");
  const ab = await new Response(new Blob([text]).stream().pipeThrough(cs)).arrayBuffer();
  const bytes = new Uint8Array(ab);
  let s = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    s += String.fromCharCode.apply(null, bytes.subarray(i, i + step));
  }
  return btoa(s);
}

async function gunzipB64(b64) {
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  const ds = new DecompressionStream("gzip");
  return new Response(new Blob([bytes]).stream().pipeThrough(ds)).text();
}

export function packSave(user) {
  const p = user.progress || {};
  const answered = Object.keys(user.answered || {}).filter((k) => user.answered[k]);
  const notes = (p.wrongNotes || []).slice(0, 24).map((n) => ({
    qid: n.qid || "",
    qText: String(n.qText || "").slice(0, 80),
    topic: n.topic || "",
    skill: n.skill || "",
    status: n.status || "",
    at: n.at || 0,
  }));
  return {
    v: 1,
    at: Number(user.savedAt) || Date.now(),
    u: String(user.username || "").toUpperCase(),
    n: user.heroName || "",
    g: user.gender === "female" ? "female" : "male",
    y: user.formYear || "",
    xp: Number(user.xp) || 0,
    st: Number(user.streak) || 0,
    id: Number(user.identityId) || 0,
    sch: user.identitySchema || 2,
    createdAt: user.createdAt || Date.now(),
    stats: {
      correct: Number(user.stats?.correct) || 0,
      wrong: Number(user.stats?.wrong) || 0,
      games: Number(user.stats?.games) || 0,
    },
    ans: answered,
    aids: (user.attemptIds || []).slice(0, 120),
    p: {
      identityId: p.identityId,
      chapters: p.chapters || {},
      mastery: p.mastery || {},
      skills: p.skills || {},
      wrongNotes: notes,
      remedials: p.remedials || {},
      trials: p.trials || {},
      pendingReviews: (p.pendingReviews || []).slice(0, 12),
      cuoshi: p.cuoshi || {},
      finale: p.finale || { segments: {} },
      chronicle: {
        promotions: (p.chronicle?.promotions || []).slice(-20),
        restored: (p.chronicle?.restored || []).slice(-20),
        quotes: (p.chronicle?.quotes || []).slice(-12),
      },
      recent: (p.recent || []).slice(0, 8),
      assignments: (p.assignments || []).slice(0, 10),
      relics: p.relics || [],
      flavor: p.flavor || {},
      score: Number(p.score) || 0,
      charms: p.charms || {},
      visit: p.visit || { day: "", streak: 0 },
      homeRun: p.homeRun || null,
      arena: p.arena || {},
      wheel: p.wheel || {},
    },
  };
}

export function unpackSave(packed) {
  if (!packed || packed.v !== 1) throw new Error("bad-save");
  const ans = {};
  (packed.ans || []).forEach((k) => {
    if (k) ans[k] = true;
  });
  const g = packed.g === "female" ? "female" : "male";
  return {
    username: String(packed.u || "").toUpperCase(),
    heroName: packed.n || "",
    gender: g,
    characterId: g === "female" ? "hero_female" : "hero_male",
    formYear: packed.y || "",
    xp: packed.xp || 0,
    streak: packed.st || 0,
    identityId: packed.id || 0,
    identitySchema: packed.sch || 2,
    createdAt: packed.createdAt || Date.now(),
    savedAt: packed.at || Date.now(),
    stats: packed.stats || { correct: 0, wrong: 0, games: 0 },
    answered: ans,
    attemptIds: packed.aids || [],
    quizLog: [],
    progress: packed.p || {},
  };
}

async function encodeBlob(jsonStr) {
  try {
    if (typeof CompressionStream === "function") {
      return `z${await gzipB64(jsonStr)}`;
    }
  } catch {
    /* fall through */
  }
  return `j${utf8b64(jsonStr)}`;
}

async function decodeBlob(blob) {
  const s = String(blob || "");
  if (!s) throw new Error("empty-save");
  if (s[0] === "z") {
    const text = await gunzipB64(s.slice(1));
    return JSON.parse(text);
  }
  if (s[0] === "j") return JSON.parse(b64utf8(s.slice(1)));
  return JSON.parse(s);
}

export function isFreshEmpty(user) {
  if (!user) return true;
  if ((Number(user.xp) || 0) > 0) return false;
  if ((Number(user.progress?.score) || 0) > 0) return false;
  if (Object.keys(user.answered || {}).length) return false;
  const ch = user.progress?.chapters || {};
  for (const c of Object.values(ch)) {
    const stages = c?.stages || {};
    if (Object.values(stages).some((st) => st?.completed || st?.done || st?.mastered)) return false;
  }
  return true;
}

function shouldPreferCloud(local, cloud) {
  if (!cloud) return false;
  if (isFreshEmpty(local) && !isFreshEmpty(cloud)) return true;
  if (!isFreshEmpty(local) && isFreshEmpty(cloud)) return false;
  return (Number(cloud.savedAt) || 0) > (Number(local.savedAt) || 0);
}

function applyCloudUser(cloudUser, password) {
  const u = migrateUser({
    ...cloudUser,
    password: String(password),
  });
  return upsertLocalUser(u);
}

async function tryPostSave(body) {
  const base = getCloudUrl();
  if (!base) return null;
  try {
    const res = await fetch(base, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
      redirect: "follow",
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.ok && data.saved) return data;
  } catch {
    /* POST 常被轉址食掉，改分段 GET */
  }
  return null;
}

export async function pushCloudSave(user) {
  if (!getCloudUrl() || !user?.username) return null;
  const board = payloadFromUser(user);
  const packed = packSave(user);
  const blob = await encodeBlob(JSON.stringify(packed));
  const ph = await passwordFingerprint(board.u, user.password);
  const payload = {
    action: "keep",
    u: board.u,
    ph,
    at: packed.at,
    blob,
    n: board.n,
    y: board.y,
    idn: board.idn,
    lv: board.lv,
    xp: board.xp,
    score: board.score,
    week: board.week,
    streak: board.streak,
  };
  const posted = await tryPostSave(payload);
  if (posted) return posted;
  const k = Math.max(1, Math.ceil(blob.length / CHUNK));
  let last = null;
  for (let i = 0; i < k; i++) {
    last = await cloudGet({
      action: "keep",
      u: board.u,
      ph,
      at: packed.at,
      i,
      k,
      c: blob.slice(i * CHUNK, (i + 1) * CHUNK),
      n: board.n,
      y: board.y,
      idn: board.idn,
      lv: board.lv,
      xp: board.xp,
      score: board.score,
      week: board.week,
      streak: board.streak,
    });
    if (!last?.ok) throw new Error(last?.error || "save-fail");
  }
  return last;
}

export async function pullCloudSave(username, password) {
  const u = String(username || "")
    .trim()
    .toUpperCase();
  const ph = await passwordFingerprint(u, password);
  const data = await cloudGet({ action: "recall", u, ph });
  if (data?.error === "unknown") throw new Error("unknown");
  if (data?.error === "auth") throw new Error("auth");
  if (data?.error === "missing" || !data?.ok || !data.blob) throw new Error("missing");
  const packed = await decodeBlob(data.blob);
  const user = unpackSave(packed);
  user.savedAt = Number(data.at) || user.savedAt;
  return { user, at: user.savedAt };
}

export function scheduleCloudSync(user, { immediate } = {}) {
  if (!getCloudUrl() || !user?.username) return;
  clearTimeout(upsertTimer);
  const run = () => {
    const latest = findLocalUser(user.username) || user;
    pushCloudSave(latest)
      .catch(() => upsertCloudUser(latest))
      .catch(() => {});
  };
  if (immediate) run();
  else upsertTimer = setTimeout(run, 1100);
}

export async function loginWithCloud(username, password) {
  const local = findLocalUser(username);
  const localOk = !!(local && local.password === String(password));
  let cloudUser = null;
  let cloudErr = "";
  if (getCloudUrl()) {
    try {
      const pulled = await pullCloudSave(username, password);
      cloudUser = pulled?.user || null;
    } catch (ex) {
      cloudErr = ex.message || "fail";
    }
  }
  if (localOk) {
    if (cloudUser && shouldPreferCloud(local, cloudUser)) {
      const merged = applyCloudUser(cloudUser, password);
      setSession(merged.username);
      return { user: merged, from: "cloud", replaced: true };
    }
    setSession(local.username);
    scheduleCloudSync(local);
    return { user: local, from: "local" };
  }
  if (cloudUser) {
    const merged = applyCloudUser(cloudUser, password);
    setSession(merged.username);
    return { user: merged, from: "cloud" };
  }
  if (cloudErr === "auth") throw new Error("帳號或密碼錯誤");
  if (getCloudUrl() && (cloudErr === "missing" || cloudErr === "unknown")) {
    try {
      const probe = await cloudGet({
        action: "has",
        u: String(username || "")
          .trim()
          .toUpperCase(),
      });
      if (probe?.error === "unknown") {
        /* 舊腳本未支援存檔 */
      } else if (probe?.exists && !probe.save) {
        throw new Error("此學號已上榜。請先喺學校部機登入一次，等進度上傳，屋企就可以接。");
      } else if (probe?.exists) {
        throw new Error("帳號或密碼錯誤");
      }
    } catch (ex) {
      if (/學號|密碼/.test(ex.message || "")) throw ex;
    }
  }
  throw new Error("帳號或密碼錯誤");
}

export async function registerWithCloud(fields) {
  const name = String(fields.username || "")
    .trim()
    .toUpperCase();
  if (findLocalUser(name)) throw new Error("此學號已被使用");
  if (getCloudUrl()) {
    try {
      const probe = await cloudGet({ action: "has", u: name });
      if (probe?.error !== "unknown" && probe?.exists) {
        throw new Error("此學號已有雲端存檔，請改用登入");
      }
    } catch (ex) {
      if (/雲端存檔/.test(ex.message || "")) throw ex;
    }
  }
  const user = registerUser(fields);
  scheduleCloudSync(user);
  return user;
}

export function cloudRankOf(rows, user) {
  if (!user || !Array.isArray(rows)) return 0;
  const me = String(user.username || "").toUpperCase();
  const year = user.formYear || "";
  const list = year ? rows.filter((r) => !r.formYear || r.formYear === year) : rows;
  const i = list.findIndex((r) => String(r.username || "").toUpperCase() === me);
  return i < 0 ? 0 : i + 1;
}
