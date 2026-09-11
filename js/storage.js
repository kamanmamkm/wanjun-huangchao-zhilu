/**
 * 用戶資料：經驗升等級；身份靠考核晉升。
 * 舊帳號自動遷移，唔會因為舊 XP 直接登基。
 */
const USERS_KEY = "huangchao_users_v1";
const SESSION_KEY = "huangchao_session_v1";

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
    identityId: 0,
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

/** 舊用戶：xp 保留作等級；身份重置為 0（避免刷分即登基） */
export function migrateUser(u) {
  if (!u) return u;
  if (u.progress && typeof u.identityId === "number") return u;
  const p = blankProgress();
  // 若舊系統已有高 XP，可略增等級感，但身份仍由考核決定
  u.identityId = 0;
  u.progress = p;
  u.stats = u.stats || { correct: 0, wrong: 0, games: 0 };
  u.answered = u.answered || {};
  u.streak = u.streak || 0;
  u.xp = u.xp || 0;
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

export function registerUser({ username, password, gender, characterId }) {
  const name = String(username || "").trim();
  if (!name || name.length < 2) throw new Error("帳號至少兩個字");
  if (!password || String(password).length < 3) throw new Error("密碼至少三個字");
  const users = readUsers();
  if (users[name]) throw new Error("此帳號已被使用");
  users[name] = {
    username: name,
    password: String(password),
    gender,
    characterId,
    xp: 0,
    streak: 0,
    answered: {},
    identityId: 0,
    progress: blankProgress(),
    createdAt: Date.now(),
    stats: { correct: 0, wrong: 0, games: 0 },
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
  const migrated = migrateUser(u);
  if (migrated !== u || !u.progress) {
    users[s.username] = migrated;
    writeUsers(users);
  }
  return users[s.username];
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
  });
}

export function pushRecent(text) {
  return updateUser((u) => {
    u.progress = u.progress || blankProgress();
    u.progress.recent = [text, ...(u.progress.recent || [])].slice(0, 8);
  });
}
