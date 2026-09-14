/**
 * 老師頁（本機）：指派課題、睇學生進度、常見錯誤、短答覆核
 * 無後端——同一瀏覽器內的帳號可視為班內學生。
 */
import { chapterList, CHAPTERS } from "./data/chapters.js?v=rad49";
import { identityDisplayName, getIdentity } from "./data/identities.js";
import { getCharacter, heroDisplayName } from "./data/characters.js";
import { levelFromXp } from "./data/levels.js";
import { QUESTIONS } from "./data/questions.js";
import { FORM_YEARS } from "./data/formYear.js";

const TEACHER_KEY = "rps_teacher_v1";
const USERS_KEY = "huangchao_users_v1";
export const TEACHER_PIN = "wanjun"; // 課堂簡易密碼，可於設定更改

export function readTeacher() {
  try {
    return (
      JSON.parse(localStorage.getItem(TEACHER_KEY) || "null") || {
        unlocked: false,
        assignments: [],
        reviews: [], // { id, username, trialId, q, answer, status: pending|ok|need }
      }
    );
  } catch {
    return { unlocked: false, assignments: [], reviews: [] };
  }
}

export function writeTeacher(data) {
  localStorage.setItem(TEACHER_KEY, JSON.stringify(data));
}

export function unlockTeacher(pin) {
  const t = readTeacher();
  if (String(pin).trim() !== TEACHER_PIN && String(pin).trim() !== t.customPin) {
    throw new Error("老師密碼不正確（預設：wanjun）");
  }
  t.unlocked = true;
  writeTeacher(t);
  return t;
}

export function lockTeacher() {
  const t = readTeacher();
  t.unlocked = false;
  writeTeacher(t);
}

function readAllUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  } catch {
    return {};
  }
}

export function listStudents() {
  const users = readAllUsers();
  return Object.values(users)
    .map((u) => {
      const idn = getIdentity(u.identityId || 0);
      const lv = levelFromXp(u.xp || 0);
      const notes = u.progress?.wrongNotes || [];
      const openNotes = notes.filter((n) => n.status !== "mastered");
      const chapters = u.progress?.chapters || {};
      const ch1 = chapters.ch1_escape;
      const attempts = collectAttempts(u);
      return {
        username: u.username,
        heroName: heroDisplayName(u, getCharacter(u.gender, u.characterId)),
        gender: u.gender,
        characterId: u.characterId,
        xp: u.xp || 0,
        level: lv.level,
        identityId: u.identityId || 0,
        identityName: identityDisplayName(idn, u.gender),
        correct: u.stats?.correct || 0,
        wrong: u.stats?.wrong || 0,
        games: u.stats?.games || 0,
        openNotes: openNotes.length,
        ch1Done: !!ch1?.done,
        ch1Stages: Object.keys(ch1?.stages || {}).length,
        skillWeak: weakestSkills(u.progress?.skills || {}),
        formYear: u.formYear || "—",
        attemptCount: attempts.length,
        attempts,
        createdAt: u.createdAt || 0,
      };
    })
    .sort((a, b) => b.level - a.level || (b.xp || 0) - (a.xp || 0));
}

function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function findQuestion(qid) {
  const id = String(qid || "");
  if (!id) return null;
  for (const mode of ["mc", "fill", "match"]) {
    const hit = (QUESTIONS[mode] || []).find((q) => q.id === id || id.startsWith(`${q.id}-`));
    if (hit) return hit;
  }
  return null;
}

function collectAttempts(u) {
  const log = Array.isArray(u.quizLog) ? [...u.quizLog] : [];
  if (log.length) {
    return log.map((e) => {
      const found = findQuestion(e.qid);
      return {
        at: e.at || 0,
        qid: e.qid || "",
        qText: e.qText || found?.q || e.qid || "—",
        correct: !!e.correct,
        grade: e.grade || found?.grade || "",
        topic: e.topic || found?.topic || "",
        source: e.source || "練習",
      };
    });
  }
  const items = [];
  Object.keys(u.answered || {}).forEach((qid) => {
    const found = findQuestion(qid);
    items.push({
      at: 0,
      qid,
      qText: found?.q || (found?.pairs ? `配對：${found.topic}` : qid),
      correct: true,
      grade: found?.grade || "",
      topic: found?.topic || "",
      source: "已答題目",
    });
  });
  (u.progress?.wrongNotes || []).forEach((n) => {
    items.push({
      at: n.at || 0,
      qid: n.qid || "",
      qText: n.qText || n.qid || "—",
      correct: false,
      grade: "",
      topic: n.tag || "",
      source: "錯題札記",
    });
  });
  items.sort((a, b) => (b.at || 0) - (a.at || 0));
  return items;
}

function fmtTime(at) {
  if (!at) return "—";
  try {
    return new Date(at).toLocaleString("zh-HK", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

function weakestSkills(skills) {
  const entries = Object.entries(skills);
  if (!entries.length) return "—";
  entries.sort((a, b) => a[1] - b[1]);
  const [k, v] = entries[0];
  const map = { timeline: "時序", cause: "因果", source: "史料", argue: "論證", recall: "基礎" };
  return `${map[k] || k} ${Math.round(v * 100)}%`;
}

export function commonErrors() {
  const users = readAllUsers();
  const bag = {};
  Object.values(users).forEach((u) => {
    (u.progress?.wrongNotes || []).forEach((n) => {
      if (n.status === "mastered") return;
      const key = n.tag || "其他";
      bag[key] = bag[key] || { tag: key, count: 0, samples: [] };
      bag[key].count++;
      if (bag[key].samples.length < 3) bag[key].samples.push(n.qText);
    });
  });
  return Object.values(bag).sort((a, b) => b.count - a.count);
}

export function assignChapter(chapterId) {
  const t = readTeacher();
  const ch = CHAPTERS[chapterId];
  if (!ch) throw new Error("找不到章節");
  t.assignments = t.assignments || [];
  t.assignments.unshift({
    id: `as-${Date.now()}`,
    chapterId,
    title: ch.title,
    at: Date.now(),
  });
  t.assignments = t.assignments.slice(0, 20);
  writeTeacher(t);
  // 同步到每位學生的指派列表
  const users = readAllUsers();
  Object.values(users).forEach((u) => {
    u.progress = u.progress || {};
    u.progress.assignments = u.progress.assignments || [];
    u.progress.assignments.unshift({ chapterId, title: ch.title, at: Date.now() });
    u.progress.assignments = u.progress.assignments.slice(0, 10);
  });
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return t;
}

export function collectPendingReviews() {
  const users = readAllUsers();
  const list = [];
  Object.values(users).forEach((u) => {
    (u.progress?.pendingReviews || []).forEach((r) => {
      if (r.status === "pending") list.push({ ...r, username: u.username });
    });
  });
  return list.sort((a, b) => (b.at || 0) - (a.at || 0));
}

export function reviewAnswer(username, reviewId, status) {
  const users = readAllUsers();
  const u = users[username];
  if (!u) throw new Error("找不到學生");
  const item = (u.progress?.pendingReviews || []).find((r) => r.id === reviewId);
  if (!item) throw new Error("找不到短答");
  item.status = status; // ok | need
  item.reviewedAt = Date.now();
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return item;
}

export function renderTeacherPage(state = {}) {
  const t = readTeacher();
  if (!t.unlocked) {
    return `
    <section class="panel-paper teacher-view">
      <h2>老師後台</h2>
      <p class="lead">查看本機全部學生帳號、等級，以及每人答過的題目。資料只存在此瀏覽器（電腦室／共用機適用）。</p>
      <label>老師密碼
        <input id="teacher-pin" type="password" placeholder="預設 wanjun" />
      </label>
      <button type="button" class="btn" id="teacher-unlock">進入老師後台</button>
    </section>`;
  }

  const filter = state.teacherFilter || "全部";
  const all = listStudents();
  const students = filter === "全部" ? all : all.filter((s) => s.formYear === filter);
  const selectedName = state.teacherUser;
  const selected = students.find((s) => s.username === selectedName) || all.find((s) => s.username === selectedName);
  const errors = commonErrors();
  const reviews = collectPendingReviews();
  const chapters = chapterList();

  const detail = selected
    ? `
    <div class="teacher-detail">
      <div class="row-actions" style="justify-content:space-between;align-items:center">
        <h3 style="margin:0">${esc(selected.heroName)} · ${esc(selected.username)}</h3>
        <button type="button" class="btn ghost" id="teacher-detail-close">關閉詳情</button>
      </div>
      <p class="lead">${esc(selected.formYear)} · ${esc(selected.identityName)} · Lv.${selected.level} · XP ${selected.xp} · 答對 ${selected.correct}／答錯 ${selected.wrong} · 遊戲 ${selected.games}</p>
      <p class="muted">弱項：${esc(selected.skillWeak)}　未修錯題：${selected.openNotes}　第一章：${selected.ch1Done ? "完成" : `${selected.ch1Stages} 關`}</p>
      <h4>答題紀錄（${selected.attempts.length}）</h4>
      <div class="teacher-table-wrap">
        <table class="teacher-table">
          <thead>
            <tr><th>時間</th><th>對錯</th><th>年級／課題</th><th>題目</th><th>來源</th></tr>
          </thead>
          <tbody>
            ${
              selected.attempts
                .map(
                  (a) => `
              <tr>
                <td>${esc(fmtTime(a.at))}</td>
                <td class="${a.correct ? "ok" : "no"}">${a.correct ? "✓ 對" : "✗ 錯"}</td>
                <td>${esc([a.grade, a.topic].filter(Boolean).join(" · ") || "—")}</td>
                <td>${esc(a.qText)}</td>
                <td>${esc(a.source)}</td>
              </tr>`
                )
                .join("") || `<tr><td colspan="5">尚未有答題紀錄（學生答題後會即時出現）</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </div>`
    : `<p class="muted">點選上表一位學生，可睇晒佢答過咩題同而家 Lv。</p>`;

  return `
  <section class="panel-paper teacher-view">
    <div class="row-actions" style="justify-content:space-between">
      <h2 style="margin:0">老師後台</h2>
      <button type="button" class="btn ghost" id="teacher-lock">鎖定</button>
    </div>
    <p class="muted">同一瀏覽器內的註冊帳號會出現在下方。密碼預設 <code>wanjun</code>。</p>

    <h3 class="section-title"><span>學生帳號（${students.length}／${all.length}）</span></h3>
    <div class="toolbar">
      ${["全部", ...FORM_YEARS]
        .map(
          (g) =>
            `<button type="button" class="chip ${filter === g ? "active" : ""}" data-teacher-filter="${g}">${g}</button>`
        )
        .join("")}
    </div>
    <div class="teacher-table-wrap">
      <table class="teacher-table">
        <thead>
          <tr>
            <th>班號</th><th>角色名</th><th>年級</th><th>身份</th><th>等級</th><th>XP</th><th>答對/錯</th><th>答題數</th>
          </tr>
        </thead>
        <tbody>
          ${
            students
              .map(
                (s) => `
            <tr class="teacher-row ${selected?.username === s.username ? "is-selected" : ""}" data-teacher-user="${esc(s.username)}" style="cursor:pointer">
              <td>${esc(s.username)}</td>
              <td>${esc(s.heroName || "—")}</td>
              <td>${esc(s.formYear || "—")}</td>
              <td>${esc(s.identityName)}</td>
              <td>Lv.${s.level}</td>
              <td>${s.xp}</td>
              <td>${s.correct}/${s.wrong}</td>
              <td>${s.attemptCount}</td>
            </tr>`
              )
              .join("") || `<tr><td colspan="8">尚未有學生帳號</td></tr>`
          }
        </tbody>
      </table>
    </div>
    ${detail}

    <h3 class="section-title"><span>指派課題</span></h3>
    <div class="row-actions">
      ${chapters
        .map(
          (c) =>
            `<button type="button" class="chip" data-assign="${c.id}">指派：${c.title}</button>`
        )
        .join("")}
    </div>
    <p class="muted">最近指派：${(t.assignments || [])
      .slice(0, 3)
      .map((a) => a.title)
      .join("、") || "尚無"}</p>

    <h3 class="section-title"><span>常見錯誤</span></h3>
    <div class="note-grid">
      ${
        errors
          .map(
            (e) => `
        <article class="note-card">
          <h3>${esc(e.tag)}（${e.count}）</h3>
          <ul>${e.samples.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
        </article>`
          )
          .join("") || "<p>暫無錯題數據</p>"
      }
    </div>

    <h3 class="section-title"><span>短答覆核</span></h3>
    <p class="lead">晉升／終章論證題可留待老師覆核。</p>
    <div class="review-list">
      ${
        reviews
          .map(
            (r) => `
        <article class="note-card" data-review-user="${esc(r.username)}" data-review-id="${esc(r.id)}">
          <p><strong>${esc(r.username)}</strong> · ${esc(r.trialTitle || r.trialId)}</p>
          <p>${esc(r.q)}</p>
          <p class="story-box">${esc(r.answer)}</p>
          <div class="row-actions">
            <button type="button" class="btn" data-review-ok>通過</button>
            <button type="button" class="btn ghost" data-review-need>需加強</button>
          </div>
        </article>`
          )
          .join("") || "<p>暫無待覆核短答。</p>"
      }
    </div>
  </section>`;
}

export function bindTeacher(ctx) {
  const { render, toast, state } = ctx;
  document.getElementById("teacher-unlock")?.addEventListener("click", () => {
    try {
      unlockTeacher(document.getElementById("teacher-pin")?.value || "");
      toast("已進入老師後台");
      render();
    } catch (e) {
      toast(e.message);
    }
  });
  document.getElementById("teacher-lock")?.addEventListener("click", () => {
    lockTeacher();
    if (state) state.teacherUser = null;
    render();
  });
  document.querySelectorAll("[data-teacher-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (state) state.teacherFilter = btn.dataset.teacherFilter;
      render();
    });
  });
  document.querySelectorAll("[data-teacher-user]").forEach((row) => {
    row.addEventListener("click", () => {
      if (state) state.teacherUser = row.dataset.teacherUser;
      render();
    });
  });
  document.getElementById("teacher-detail-close")?.addEventListener("click", () => {
    if (state) state.teacherUser = null;
    render();
  });
  document.querySelectorAll("[data-assign]").forEach((btn) => {
    btn.addEventListener("click", () => {
      try {
        assignChapter(btn.dataset.assign);
        toast(`已指派：${CHAPTERS[btn.dataset.assign]?.title || ""}`);
        render();
      } catch (e) {
        toast(e.message);
      }
    });
  });
  document.querySelectorAll("[data-review-user]").forEach((card) => {
    const user = card.dataset.reviewUser;
    const id = card.dataset.reviewId;
    card.querySelector("[data-review-ok]")?.addEventListener("click", () => {
      reviewAnswer(user, id, "ok");
      toast("已標示通過");
      render();
    });
    card.querySelector("[data-review-need]")?.addEventListener("click", () => {
      reviewAnswer(user, id, "need");
      toast("已標示需加強");
      render();
    });
  });
}
