/**
 * 老師頁（本機）：指派課題、睇學生進度、常見錯誤、短答覆核
 * 無後端——同一瀏覽器內的帳號可視為班內學生。
 */
import { chapterList, CHAPTERS } from "./data/chapters.js";
import { identityDisplayName, getIdentity } from "./data/identities.js";
import { getCharacter, heroDisplayName } from "./data/characters.js";
import { levelFromXp } from "./data/levels.js";

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
  return Object.values(users).map((u) => {
    const idn = getIdentity(u.identityId || 0);
    const lv = levelFromXp(u.xp || 0);
    const notes = u.progress?.wrongNotes || [];
    const openNotes = notes.filter((n) => n.status !== "mastered");
    const chapters = u.progress?.chapters || {};
    const ch1 = chapters.ch1_escape;
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
      openNotes: openNotes.length,
      ch1Done: !!ch1?.done,
      ch1Stages: Object.keys(ch1?.stages || {}).length,
      skillWeak: weakestSkills(u.progress?.skills || {}),
      formYear: u.formYear || "—",
    };
  });
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

export function renderTeacherPage() {
  const t = readTeacher();
  if (!t.unlocked) {
    return `
    <section class="panel-paper teacher-view">
      <h2>老師頁</h2>
      <p class="lead">本機課堂工具：指派課題、睇進度、常見錯誤、覆核短答。資料只存在此瀏覽器。</p>
      <label>老師密碼
        <input id="teacher-pin" type="password" placeholder="預設 wanjun" />
      </label>
      <button type="button" class="btn" id="teacher-unlock">進入老師頁</button>
    </section>`;
  }

  const students = listStudents();
  const errors = commonErrors();
  const reviews = collectPendingReviews();
  const chapters = chapterList();

  return `
  <section class="panel-paper teacher-view">
    <div class="row-actions" style="justify-content:space-between">
      <h2 style="margin:0">老師頁</h2>
      <button type="button" class="btn ghost" id="teacher-lock">鎖定老師頁</button>
    </div>
    <p class="muted">同一瀏覽器內的註冊帳號會出現在下方（適合電腦室／共用機示範）。</p>

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

    <h3 class="section-title"><span>完成進度（${students.length} 人）</span></h3>
    <div class="teacher-table-wrap">
      <table class="teacher-table">
        <thead>
          <tr>
            <th>帳號</th><th>角色名</th><th>年級</th><th>身份</th><th>等級</th><th>答對/錯</th><th>第一章</th><th>弱項</th><th>未修錯題</th>
          </tr>
        </thead>
        <tbody>
          ${
            students
              .map(
                (s) => `
            <tr>
              <td>${s.username}</td>
              <td>${s.heroName || "—"}</td>
              <td>${s.formYear || "—"}</td>
              <td>${s.identityName}</td>
              <td>Lv.${s.level}</td>
              <td>${s.correct}/${s.wrong}</td>
              <td>${s.ch1Done ? "完成" : `${s.ch1Stages} 關`}</td>
              <td>${s.skillWeak}</td>
              <td>${s.openNotes}</td>
            </tr>`
              )
              .join("") || `<tr><td colspan="9">尚未有學生帳號</td></tr>`
          }
        </tbody>
      </table>
    </div>

    <h3 class="section-title"><span>常見錯誤</span></h3>
    <div class="note-grid">
      ${
        errors
          .map(
            (e) => `
        <article class="note-card">
          <h3>${e.tag}（${e.count}）</h3>
          <ul>${e.samples.map((s) => `<li>${s}</li>`).join("")}</ul>
        </article>`
          )
          .join("") || "<p>暫無錯題數據</p>"
      }
    </div>

    <h3 class="section-title"><span>短答覆核</span></h3>
    <p class="lead">晉升／終章論證題可留待老師覆核（史實準確、證據相關、解釋合理）。</p>
    <div class="review-list">
      ${
        reviews
          .map(
            (r) => `
        <article class="note-card" data-review-user="${r.username}" data-review-id="${r.id}">
          <p><strong>${r.username}</strong> · ${r.trialTitle || r.trialId}</p>
          <p>${r.q}</p>
          <p class="story-box">${r.answer}</p>
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
  const { render, toast } = ctx;
  document.getElementById("teacher-unlock")?.addEventListener("click", () => {
    try {
      unlockTeacher(document.getElementById("teacher-pin")?.value || "");
      toast("已進入老師頁");
      render();
    } catch (e) {
      toast(e.message);
    }
  });
  document.getElementById("teacher-lock")?.addEventListener("click", () => {
    lockTeacher();
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
