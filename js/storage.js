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
    createdAt: Date.now(),
    stats: { correct: 0, wrong: 0, games: 0 },
  };
  writeUsers(users);
  setSession(name);
  return users[name];
}

export function loginUser(username, password) {
  const users = readUsers();
  const u = users[String(username || "").trim()];
  if (!u || u.password !== String(password)) throw new Error("帳號或密碼錯誤");
  setSession(u.username);
  return u;
}

export function getCurrentUser() {
  const s = getSession();
  if (!s?.username) return null;
  return readUsers()[s.username] || null;
}

export function updateUser(mutator) {
  const s = getSession();
  if (!s?.username) return null;
  const users = readUsers();
  const u = users[s.username];
  if (!u) return null;
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
