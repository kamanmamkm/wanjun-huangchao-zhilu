/**
 * 用戶資料：練習／小遊戲累積經驗升等級；身份需試煉解鎖。
 */
import { migrateIdentityId, STARTING_IDENTITY_ID } from "./data/identities.js";
import { normalizeHeroName } from "./data/characters.js";
import { syncIdentityToLevel } from "./data/levelStage.js";
import { normalizeFormYear } from "./data/formYear.js";

const USERS_KEY = "huangchao_users_v1";
const SESSION_KEY = "huangchao_session_v1";
const IDENTITY_SCHEMA = 2; // 取消奴隸／婢女後：0=庶民…7=帝王

function readUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function blankProgress() {
  return {
    identityId: STARTING_IDENTITY_ID,
    chapters: {},
    mastery: {},
    skills: {},
    wrongNotes: [],
    remedials: {},
    trials: {},
    pendingReviews: [],
    cuoshi: {},
    finale: { segments: {} },
    chronicle: { promotions: [], restored: [], quotes: [] },
    recent: [],
    assignments: [],
  };
}

function remapIdentityRefs(u, mapFn) {
  const p = u.progress;
  if (!p) return;
  if (p.chronicle?.promotions) {
    p.chronicle.promotions = p.chronicle.promotions.map((pr) => ({
      ...pr,
      to: mapFn(pr.to),
      from: pr.from != null ? mapFn(pr.from) : pr.from,
    }));
  }
  // 舊「脫籍考核」進度作廢；其他試煉 id 不變
  if (p.trials?.trial_to_commoner) delete p.trials.trial_to_commoner;
}

/** 遷移身份階梯＋補齊 progress */
export function migrateUser(u) {
  if (!u) return u;
  if (!u.progress || typeof u.identityId !== "number") {
    const p = blankProgress();
    u.identityId = STARTING_IDENTITY_ID;
    u.progress = p;
    u.stats = u.stats || { correct: 0, wrong: 0, games: 0 };
    u.answered = u.answered || {};
    u.streak = u.streak || 0;
    u.xp = u.xp || 0;
    u.identitySchema = IDENTITY_SCHEMA;
    syncIdentityToLevel(u);
    return u;
  }

  if (u.identitySchema !== IDENTITY_SCHEMA) {
    const oldId = u.identityId;
    u.identityId = migrateIdentityId(oldId);
    remapIdentityRefs(u, migrateIdentityId);
    u.identitySchema = IDENTITY_SCHEMA;
  }

  if (typeof u.identityId !== "number" || u.identityId < 0) {
    u.identityId = STARTING_IDENTITY_ID;
  }
  // 已取消歷史人物原型：統一為男女樣貌殼
  u.characterId = u.gender === "female" ? "hero_female" : "hero_male";
  if (!String(u.heroName || "").trim()) {
    u.heroName = u.heroName || "";
  }
  const fy = normalizeFormYear(u.formYear);
  if (fy) u.formYear = fy;
  else if (u.formYear) delete u.formYear;
  syncIdentityToLevel(u);
  return u;
}

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

export function setSession(username) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username }));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function registerUser({ username, password, gender, characterId, heroName, formYear }) {
  const name = String(username || "").trim();
  if (!name || name.length < 2) throw new Error("帳號至少兩個字");
  if (!password || String(password).length < 3) throw new Error("密碼至少三個字");
  const year = normalizeFormYear(formYear);
  if (!year) throw new Error("請選擇年級（中一／中二／中三）");
  const hero = normalizeHeroName(heroName);
  const users = readUsers();
  if (users[name]) throw new Error("此帳號已被使用");
  const g = gender === "female" ? "female" : "male";
  users[name] = {
    username: name,
    password: String(password),
    gender: g,
    characterId: g === "female" ? "hero_female" : "hero_male",
    heroName: hero,
    formYear: year,
    xp: 0,
    streak: 0,
    answered: {},
    identityId: STARTING_IDENTITY_ID,
    progress: blankProgress(),
    createdAt: Date.now(),
    stats: { correct: 0, wrong: 0, games: 0 },
    identitySchema: IDENTITY_SCHEMA,
  };
  writeUsers(users);
  setSession(name);
  return users[name];
}

export function loginUser(username, password) {
  const users = readUsers();
  const name = String(username || "").trim();
  let u = users[name];
  if (!u || u.password !== String(password)) throw new Error("帳號或密碼錯誤");
  u = migrateUser(u);
  users[name] = u;
  writeUsers(users);
  setSession(u.username);
  return u;
}

export function getCurrentUser() {
  const s = getSession();
  if (!s?.username) return null;
  const users = readUsers();
  let u = users[s.username];
  if (!u) return null;
  u = migrateUser(u);
  // 等級帶補升／遷移後一律寫回，確保形象即時生效
  users[s.username] = u;
  writeUsers(users);
  return u;
}

export function updateUser(mutator) {
  const s = getSession();
  if (!s?.username) return null;
  const users = readUsers();
  let u = users[s.username];
  if (!u) return null;
  u = migrateUser(u);
  mutator(u);
  users[s.username] = u;
  writeUsers(users);
  return u;
}

export function addXp(amount, meta = {}) {
  return updateUser((u) => {
    u.xp = Math.max(0, (u.xp || 0) + amount);
    if (meta.correct) {
      u.stats.correct = (u.stats.correct || 0) + 1;
      u.streak = (u.streak || 0) + 1;
    }
    if (meta.wrong) {
      u.stats.wrong = (u.stats.wrong || 0) + 1;
      u.streak = 0;
    }
    if (meta.game) u.stats.games = (u.stats.games || 0) + 1;
    if (meta.qid) {
      u.answered = u.answered || {};
      u.answered[meta.qid] = true;
    }
    if (meta.qid || meta.qText) {
      u.quizLog = u.quizLog || [];
      u.quizLog.unshift({
        at: Date.now(),
        qid: meta.qid || "",
        qText: String(meta.qText || "").slice(0, 160),
        correct: !!meta.correct && !meta.wrong,
        grade: meta.grade || "",
        topic: meta.topic || "",
        source: meta.source || (meta.game ? "遊戲" : "練習"),
      });
      u.quizLog = u.quizLog.slice(0, 250);
    }
  });
}

export function pushRecent(text) {
  return updateUser((u) => {
    u.progress = u.progress || blankProgress();
    u.progress.recent = [text, ...(u.progress.recent || [])].slice(0, 8);
  });
}
