import { getCharacter, heroDisplayName } from "./data/characters.js?v=rad48";
import { QUESTIONS } from "./data/questions.js?v=rad48";
import { XP_REWARDS, outfitOf } from "./data/ranks.js?v=rad48";
import { levelFromXp } from "./data/levels.js?v=rad48";
import { DIALOGUES } from "./data/dialogues.js?v=rad48";
import { TIMELINE_SETS, WORDWALL_ROUNDS } from "./data/games.js?v=rad48";
import { VIDEOS } from "./data/videos.js?v=rad48";
import { renderAvatar } from "./avatar.js?v=rad48";
import {
  CARD_TYPES,
  createBattle,
  startPlayCard,
  useSkillOnQuiz,
  resolvePlayerQuiz,
  resolveEnemyTurn,
  resolveGuardQuiz,
  hearts,
} from "./data/shizhan.js?v=rad48";
import {
  getCurrentUser,
  registerUser,
  loginUser,
  clearSession,
  addXp,
  updateUser,
  pushRecent,
} from "./storage.js?v=rad48";
import {
  userSnapshot,
  buildPromotionOrder,
  recordAttempt,
  makeAttemptId,
  hasAttempt,
  completeStage,
  isStageCompleted,
  masteryFromScore,
  IDENTITY_DISCLAIMER,
  identityDisplayName,
  getIdentity,
} from "./progress.js?v=rad48";
import { renderWheelPage, bindWheel } from "./wheel.js?v=rad48";
import {
  renderJourneyHome,
  renderScroll,
  renderChapterDetail,
  renderPromote,
  renderNotes,
  renderChronicle,
  renderCuoshi,
  renderGrowthScroll,
  bindJourney,
} from "./journey.js?v=rad48";
import { renderTeacherPage, bindTeacher } from "./teacher.js?v=rad48";
import { renderPromoteReveal, renderLevelUpReveal, renderRelicReveal } from "./heroStage.js?v=rad48";
import { getStageVisual } from "./data/stageVisuals.js?v=rad48";
import { flavorLine } from "./data/flavor.js?v=rad48";
import {
  FORM_YEARS,
  normalizeFormYear,
  formYearHint,
  filterByFormYear,
  normalizeClassId,
  formYearFromClassId,
  classIdHint,
} from "./data/formYear.js?v=rad48";
import { pickRandomHeroName, isPooledHeroName, HERO_NAME_COUNT } from "./data/heroNames.js?v=rad48";

const app = document.getElementById("app");
let toastTimer = null;
let levelUpTimer = null;
let state = {
  view: "home",
  authMode: "login",
  gender: "male",
  heroName: "",
  heroNameFromPool: true,
  username: "",
  formYear: "",
  match: { selectedLeft: null, selectedRight: null, solved: new Set() },
  flip: { cards: [], flipped: [], matched: new Set(), lock: false },
  timeline: { setId: TIMELINE_SETS[0].id },
  timelineFromStage: null,
  stageInteract: null,
  dialogue: { id: DIALOGUES[0].id, step: 0, replied: false, good: 0 },
  shizhan: null,
  scrollChapter: "ch1_escape",
  scrollStage: null,
  stageQuiz: null,
  bossStep: 0,
  trial: null,
  cuoshi: null,
  promoteReveal: null,
  levelUpReveal: null,
  relicReveal: null,
  flavorOpen: false,
  heroNameEdit: false,
  teacherUser: null,
  teacherFilter: "全部",
  guestPlay: { active: false, index: 0, done: false, locked: false, score: 0, pick: null, qs: [] },
  wheelBusy: false,
  wheelAngle: 0,
};

function toast(msg) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 經驗獎勵只加 XP，唔改掌握度／答題紀錄。 */
function reward(amount, meta = {}) {
  const before = getCurrentUser();
  const prevLv = before ? levelFromXp(before.xp).level : 1;
  let bonus = Number(amount) || 0;
  if (meta.repeat && bonus > 0) bonus = Math.max(1, Math.round(bonus * XP_REWARDS.repeatScale));
  if (meta.streakBonus && bonus > 0) bonus += XP_REWARDS.streakBonus;
  addXp(bonus);
  const after = getCurrentUser();
  const nextLv = after ? levelFromXp(after.xp).level : prevLv;
  const idBefore = before?.identityId ?? 0;
  const idAfter = after?.identityId ?? 0;
  if (idAfter > idBefore && !state.promoteReveal) {
    state.promoteReveal = { fromId: idBefore, toId: idAfter };
  }
  if (nextLv > prevLv) {
    if (state.promoteReveal) {
      toast(`角色升至 Lv.${nextLv}！+${bonus} 經驗`);
    } else {
      state.levelUpReveal = { fromLv: prevLv, toLv: nextLv };
    }
  } else if (meta.repeat && bonus) toast(`+${bonus} 經驗（複習減幅）`);
  else if (bonus) toast(`+${bonus} 經驗`);
  if (!meta.keepView) render();
  else {
    refreshTopbarOnly();
    mountLevelUpReveal();
  }
}

/** 答題入口：先寫紀錄（唯一 ID），再發經驗。 */
function submitAnswer(amount, meta = {}) {
  const recordId = String(meta.recordId || makeAttemptId());
  const before = getCurrentUser();
  if (!before) return { ok: false, duplicate: false, reason: "no-user" };
  if (hasAttempt(before, recordId)) return { ok: false, duplicate: true, recordId };
  const repeat = !!(meta.qid && before.answered?.[meta.qid]);
  const correct = !!meta.correct && !meta.wrong;
  const streakBonus = correct && (before.streak || 0) >= 3;
  let recorded = { ok: false, duplicate: false, recordId };
  updateUser((u) => {
    recorded = recordAttempt(u, { ...meta, recordId });
  });
  if (!recorded.ok) return recorded;
  reward(amount, { keepView: meta.keepView, repeat, streakBonus });
  if (meta.nudge !== false) nudgeCompanion(correct);
  return recorded;
}

function interactFrom(game) {
  const s = state.stageInteract;
  if (s?.game === game) return s;
  if (game === "timeline" && state.timelineFromStage) return { ...state.timelineFromStage, game: "timeline" };
  return null;
}

function finishInteractStage(from, { mastered, correct, total }) {
  if (!from) return { already: true };
  const already = isStageCompleted(getCurrentUser()?.progress?.chapters?.[from.cid]?.stages?.[from.sid]);
  if (!already) {
    let dropped = null;
    updateUser((u) => {
      dropped = completeStage(u, from.cid, from.sid, {
        mastered: !!mastered,
        firstCorrect: correct,
        firstTotal: total,
        correct,
        total,
      });
    });
    pushRecent(`完成互動關：${from.title || from.sid}`);
    addXp(XP_REWARDS.chapterBonus);
    queueRelic(dropped);
  }
  return { already };
}

function previewLevelRequested() {
  try {
    return new URLSearchParams(location.search).get("preview") === "levelup";
  } catch {
    return false;
  }
}

function applyLevelUpPreview() {
  if (!previewLevelRequested() || state.promoteReveal) return;
  const user = getCurrentUser();
  const lv = user ? levelFromXp(user.xp) : { level: 3, maxLevel: 60 };
  const cap = lv.maxLevel || 60;
  const toLv = Math.min((lv.level || 1) + 1, cap);
  const fromLv = Math.max(1, toLv - 1);
  state.levelUpReveal = { fromLv, toLv };
}

function dismissLevelUpReveal() {
  clearTimeout(levelUpTimer);
  levelUpTimer = null;
  state.levelUpReveal = null;
  document.getElementById("levelup-reveal")?.remove();
  mountRelicReveal();
}

function mountLevelUpReveal() {
  if (!state.levelUpReveal || state.promoteReveal) return;
  if (document.getElementById("levelup-reveal")) return;
  const { fromLv, toLv } = state.levelUpReveal;
  app.insertAdjacentHTML("beforeend", renderLevelUpReveal({ fromLv, toLv }));
  const overlay = document.getElementById("levelup-reveal");
  if (!overlay) return;
  overlay.addEventListener("click", dismissLevelUpReveal);
}

function nudgeCompanion(ok) {
  const u = getCurrentUser();
  const streak = u?.streak || 0;
  const line = flavorLine({ ok, streak });
  const wrap = document.querySelector(".study-companion");
  const bubble = wrap?.querySelector(".study-bubble p");
  if (bubble) bubble.textContent = line;
  if (!wrap) return;
  wrap.classList.toggle("is-speaking", true);
  let pill = wrap.querySelector(".combo-pill");
  if (ok && streak >= 3) {
    if (!pill) {
      pill = document.createElement("span");
      pill.className = "combo-pill";
      wrap.appendChild(pill);
    }
    pill.textContent = `連捷 ${streak}`;
  } else if (pill) {
    pill.remove();
  }
}

function queueRelic(relic) {
  if (!relic) return;
  state.relicReveal = relic;
  if (!state.promoteReveal && !state.levelUpReveal) mountRelicReveal();
}

function dismissRelicReveal() {
  state.relicReveal = null;
  document.getElementById("relic-reveal")?.remove();
}

function mountRelicReveal() {
  if (!state.relicReveal || state.promoteReveal || state.levelUpReveal) return;
  if (document.getElementById("relic-reveal")) return;
  app.insertAdjacentHTML("beforeend", renderRelicReveal(state.relicReveal));
  document.getElementById("relic-continue")?.addEventListener("click", dismissRelicReveal);
  document.getElementById("relic-reveal")?.addEventListener("click", (e) => {
    if (e.target.id === "relic-reveal") dismissRelicReveal();
  });
}

function refreshTopbarOnly() {
  const user = getCurrentUser();
  if (!user) return;
  const char = getCharacter(user.gender, user.characterId);
  const snap = userSnapshot(user);
  const badge = app.querySelector(".player-badge");
  if (!badge) return;
  badge.innerHTML = `
    <div class="avatar-ring">${renderAvatar(char, snap.stageId ?? snap.identity.id, "sm", { gender: user.gender })}</div>
    <div class="player-meta">
      <strong>${heroDisplayName(user, char)} · ${snap.identityName}</strong>
      <span>${user.username}　${user.formYear || ""}　Lv.${snap.level.level}　XP ${user.xp}　史績 ${snap.score}</span>
      <div class="xp-bar"><i style="width:${snap.level.progress}%"></i></div>
    </div>`;
}

function journeyCtx() {
  return {
    state,
    render,
    toast,
    reward,
    submitAnswer,
    nudgeCompanion,
    queueRelic,
    getUser: getCurrentUser,
    getCharacter: () => {
      const u = getCurrentUser();
      return u ? getCharacter(u.gender, u.characterId) : null;
    },
  };
}

function render() {
  clearTimeout(levelUpTimer);
  levelUpTimer = null;
  applyLevelUpPreview();
  const user = getCurrentUser();
  if (!user) {
    document.body.className = "";
    app.innerHTML = renderAuth();
    bindAuth();
    if (state.levelUpReveal) mountLevelUpReveal();
    return;
  }
  if (!normalizeFormYear(user.formYear)) {
    document.body.className = "";
    app.innerHTML = renderFormYearGate(user);
    bindFormYearGate();
    if (state.levelUpReveal) mountLevelUpReveal();
    return;
  }
  const snap = userSnapshot(user);
  const id = snap.stageId ?? user.identityId ?? 0;
  const courtViews = ["promote"];
  const isCourt =
    courtViews.includes(state.view) ||
    (state.view === "chapter" &&
      !!state.scrollStage &&
      /boss|試煉/i.test(String(state.scrollStage)));
  document.body.className = `stage-visual-${id}${isCourt ? " theme-court" : ""}`;
  app.innerHTML = renderShell(user);
  bindShell(user);
  if (state.promoteReveal) {
    const { fromId, toId } = state.promoteReveal;
    const char = getCharacter(user.gender, user.characterId);
    const quote = getStageVisual(toId).quote;
    app.insertAdjacentHTML(
      "beforeend",
      renderPromoteReveal({ char, fromId, toId, gender: user.gender, quote })
    );
    const close = () => {
      state.promoteReveal = null;
      toast(`晉升成功：${identityDisplayName(getIdentity(toId), user.gender)}`);
      render();
    };
    document.getElementById("reveal-continue")?.addEventListener("click", close);
    document.getElementById("reveal-skip")?.addEventListener("click", close);
    document.getElementById("reveal-reduce-motion")?.addEventListener("click", () => {
      document.body.classList.add("reduce-motion");
      toast("已減少動態");
    });
  } else if (state.levelUpReveal) {
    mountLevelUpReveal();
  } else if (state.relicReveal) {
    mountRelicReveal();
  }
}

/* ========== Auth ========== */
function guestTryQuestions() {
  if (state.guestPlay.qs?.length) return state.guestPlay.qs;
  const pool = (QUESTIONS.mc || []).filter((q) => q.grade === "中一");
  const src = pool.length ? pool : QUESTIONS.mc || [];
  return src.slice(0, 3);
}

function startGuestPlay() {
  const pool = (QUESTIONS.mc || []).filter((q) => q.grade === "中一");
  const src = pool.length ? pool : QUESTIONS.mc || [];
  state.guestPlay = {
    active: true,
    index: 0,
    done: false,
    locked: false,
    score: 0,
    pick: null,
    qs: shuffle(src).slice(0, 3),
  };
  render();
}

function renderAuth() {
  if (state.authMode === "register" && !String(state.heroName || "").trim()) {
    state.heroName = pickRandomHeroName(state.gender);
    state.heroNameFromPool = true;
  }
  const gp = state.guestPlay;
  const tryQs = guestTryQuestions();
  const q = tryQs[gp.index] || tryQs[0];

  let authBody = "";
  if (gp.active && !gp.done && q) {
    const locked = !!gp.locked;
    const pick = gp.pick;
    const last = gp.index >= tryQs.length - 1;
    const fbText =
      pick === q.answer
        ? `正確！${q.explain || ""}`
        : `未正確。正解：${q.options[q.answer]}。${q.explain || ""}`;
    authBody = `
      <div class="guest-play">
        <p class="eyebrow">試玩 ${gp.index + 1}／${tryQs.length}</p>
        <h2>先答 3 題選擇題，感受史識之路</h2>
        <div class="question-box" id="guest-qbox">
          <div class="q-meta">${q.grade} · ${q.topic}</div>
          <div class="q-text">${q.q}</div>
          <div class="options">
            ${q.options
              .map((o, i) => {
                let cls = "option";
                if (locked && i === q.answer) cls += " correct";
                else if (locked && i === pick) cls += " wrong";
                return `<button type="button" class="${cls}" data-guest-mc="${i}" ${locked ? "disabled" : ""}>${String.fromCharCode(65 + i)}. ${o}</button>`;
              })
              .join("")}
          </div>
          <div class="feedback ${locked ? "" : "hidden"}" id="guest-feedback">${locked ? fbText : ""}</div>
        </div>
        ${
          locked
            ? `<button type="button" class="btn btn-wide" id="guest-next" style="margin-top:.85rem">${last ? "完成試玩" : "明白，下一題"}</button>`
            : ""
        }
        <button type="button" class="btn ghost btn-wide" id="guest-skip" style="margin-top:.55rem">返回登入</button>
      </div>`;
  } else {
    const invite = gp.done
      ? `<div class="guest-invite">
          <p class="lead">試玩完成！答對 ${gp.score}／${gp.qs?.length || 3} 題。建立角色，答題就可以解鎖新造型。</p>
        </div>`
      : "";
    authBody = `
      ${invite}
      <div class="auth-tabs">
        <button type="button" data-auth="login" class="${state.authMode === "login" ? "active" : ""}">登入</button>
        <button type="button" data-auth="register" class="${state.authMode === "register" ? "active" : ""}">註冊角色</button>
      </div>
      <form id="auth-form" class="form-grid">
        <label>${state.authMode === "register" ? "班別＋學號" : "帳號"}
          <input name="username" id="class-id-input" required autocomplete="username"
            autocapitalize="characters" spellcheck="false"
            maxlength="${state.authMode === "register" ? 4 : 20}"
            placeholder="例如：1A10"
            value="${escapeAttr(state.username)}" />
        </label>
        ${
          state.authMode === "register"
            ? `<p class="muted" style="margin:0;font-size:.88rem">${classIdHint()}</p>`
            : ""
        }
        <label>密碼<input name="password" type="password" required autocomplete="current-password" placeholder="至少三個字" /></label>
        ${
          state.authMode === "register"
            ? `
        <label>角色名
          <div class="name-roll">
            <input name="heroName" id="hero-name-input" required maxlength="8" autocomplete="nickname"
              value="${escapeAttr(state.heroName)}" placeholder="古風姓＋名" />
            <button type="button" class="btn ghost" id="reroll-hero-name">換一個</button>
          </div>
        </label>
        <p class="muted" style="margin:0;font-size:.88rem">系統隨機派古風姓名（共 ${HERO_NAME_COUNT} 組）。不喜歡可換，或自行改字。</p>
        <label>年級
          <select name="formYear" id="form-year-select" required>
            <option value="" ${!state.formYear ? "selected" : ""}>— 請選擇 —</option>
            ${FORM_YEARS.map(
              (y) =>
                `<option value="${y}" ${state.formYear === y ? "selected" : ""}>${y}${
                  y === "中一" ? "（只做中一題）" : y === "中二" ? "（中一＋中二）" : "（中一＋中二＋中三）"
                }</option>`
            ).join("")}
          </select>
        </label>
        <label>性別
          <select name="gender" id="gender-select">
            <option value="male" ${state.gender === "male" ? "selected" : ""}>男（開局：庶民 · Lv.1 起步）</option>
            <option value="female" ${state.gender === "female" ? "selected" : ""}>女（開局：庶民 · Lv.1 起步）</option>
          </select>
        </label>
        <p class="muted" style="margin:0;font-size:.88rem">年級喺註冊時決定，之後登入會沿用。</p>`
            : ""
        }
        <p class="form-error" id="auth-error"></p>
        <button class="btn btn-wide" type="submit">${state.authMode === "login" ? "⚔️ 進入任平生" : "🏯 創角出發"}</button>
      </form>
      <button type="button" class="btn ghost btn-wide" id="guest-try-btn" style="margin-top:.7rem">${gp.done ? "再試 3 題" : "試玩 3 題選擇題"}</button>`;
  }

  return `
  <section class="hero-screen">
    <div class="brand-block">
      <p class="eyebrow">萬鈞伯裘中史科成長遊戲</p>
      <h1>任平生</h1>
      <p class="subtitle">歷千年風雨，成就我人生。</p>
      <div class="tags">
        <span class="tag">答題解鎖新造型</span>
        <span class="tag">挑戰被改亂嘅歷史</span>
        <span class="tag">建立你嘅成長史冊</span>
      </div>
    </div>
    <div class="auth-panel">
      ${authBody}
    </div>
  </section>`;
}

function escapeAttr(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function renderFormYearGate(user) {
  return `
  <section class="hero-screen">
    <div class="auth-panel" style="margin:auto">
      <h2>請選擇年級</h2>
      <p class="lead">舊帳號尚未設定年級。請揀一次，之後登入會沿用。</p>
      <form id="form-year-gate" class="form-grid">
        <label>年級
          <select name="formYear" required>
            <option value="">— 請選擇 —</option>
            ${FORM_YEARS.map((y) => `<option value="${y}">${y}</option>`).join("")}
          </select>
        </label>
        <p class="form-error" id="auth-error"></p>
        <button class="btn btn-wide" type="submit">確認進入</button>
      </form>
      <p class="muted">帳號：${user.username}</p>
    </div>
  </section>`;
}

function bindFormYearGate() {
  app.querySelector("#form-year-gate")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const year = normalizeFormYear(fd.get("formYear"));
    const err = app.querySelector("#auth-error");
    if (!year) {
      if (err) err.textContent = "請選擇年級";
      return;
    }
    updateUser((u) => {
      u.formYear = year;
    });
    toast(formYearHint(year));
    render();
  });
}

function rememberAuthDraft() {
  const hero = app.querySelector("#hero-name-input");
  if (hero) state.heroName = hero.value;
  const year = app.querySelector("#form-year-select");
  if (year) state.formYear = year.value;
  const user = app.querySelector("#class-id-input");
  if (user) state.username = user.value.toUpperCase();
}

function bindAuth() {
  app.querySelectorAll("[data-auth]").forEach((btn) => {
    btn.addEventListener("click", () => {
      rememberAuthDraft();
      state.authMode = btn.dataset.auth;
      render();
    });
  });
  const gender = app.querySelector("#gender-select");
  if (gender) {
    gender.addEventListener("change", (e) => {
      rememberAuthDraft();
      const prev = state.gender;
      state.gender = e.target.value;
      if (state.heroNameFromPool || isPooledHeroName(state.heroName, prev)) {
        state.heroName = pickRandomHeroName(state.gender);
        state.heroNameFromPool = true;
      }
      render();
    });
  }
  app.querySelector("#reroll-hero-name")?.addEventListener("click", () => {
    const next = pickRandomHeroName(state.gender, state.heroName);
    state.heroName = next;
    state.heroNameFromPool = true;
    const input = app.querySelector("#hero-name-input");
    if (input) input.value = next;
  });
  app.querySelector("#form-year-select")?.addEventListener("change", (e) => {
    state.formYear = e.target.value;
  });
  const classInput = app.querySelector("#class-id-input");
  if (classInput) {
    classInput.addEventListener("input", (e) => {
      const start = e.target.selectionStart;
      const next = String(e.target.value || "")
        .toUpperCase()
        .replace(/[^0-9A-Z]/g, "");
      e.target.value = next;
      state.username = next;
      if (typeof start === "number") e.target.setSelectionRange(start, start);
      if (state.authMode === "register") {
        const year = formYearFromClassId(next);
        if (year) {
          state.formYear = year;
          const sel = app.querySelector("#form-year-select");
          if (sel) sel.value = year;
        }
      }
    });
  }
  app.querySelector("#hero-name-input")?.addEventListener("input", (e) => {
    state.heroName = e.target.value;
    state.heroNameFromPool = isPooledHeroName(e.target.value, state.gender);
    const strong = app.querySelector(".hero-caption strong");
    if (strong) strong.textContent = String(e.target.value).trim() || "行者";
  });
  app.querySelector("#auth-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const err = app.querySelector("#auth-error");
    try {
      if (state.authMode === "login") {
        loginUser(fd.get("username"), fd.get("password"));
      } else {
        const classId = normalizeClassId(fd.get("username")) || String(fd.get("username") || "");
        registerUser({
          username: classId,
          password: fd.get("password"),
          gender: state.gender,
          heroName: fd.get("heroName"),
          formYear: fd.get("formYear") || formYearFromClassId(classId),
        });
        state.heroName = "";
        state.username = "";
        state.formYear = normalizeFormYear(fd.get("formYear")) || formYearFromClassId(classId) || "";
      }
      state.timeline = { setId: TIMELINE_SETS[0].id };
      state.view = "home";
      render();
      const year = getCurrentUser()?.formYear || "";
      toast(year ? `歡迎踏上任平生——${year}` : "歡迎踏上任平生");
    } catch (ex) {
      err.textContent = ex.message;
    }
  });
  app.querySelector("#guest-try-btn")?.addEventListener("click", () => {
    startGuestPlay();
  });
  app.querySelector("#guest-skip")?.addEventListener("click", () => {
    state.guestPlay = { ...state.guestPlay, active: false, locked: false, pick: null };
    render();
  });
  app.querySelectorAll("[data-guest-mc]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (state.guestPlay.locked) return;
      const tryQs = guestTryQuestions();
      const q = tryQs[state.guestPlay.index];
      if (!q) return;
      const i = Number(btn.dataset.guestMc);
      state.guestPlay.pick = i;
      state.guestPlay.locked = true;
      if (i === q.answer) state.guestPlay.score += 1;
      render();
    });
  });
  app.querySelector("#guest-next")?.addEventListener("click", () => {
    const gp = state.guestPlay;
    const tryQs = guestTryQuestions();
    if (gp.index >= tryQs.length - 1) {
      state.guestPlay = { ...gp, active: false, done: true, locked: false, pick: null };
      state.authMode = "register";
      toast(`試玩完成：答對 ${gp.score}／${tryQs.length} 題`);
    } else {
      state.guestPlay = { ...gp, index: gp.index + 1, locked: false, pick: null };
    }
    render();
  });
}

/* ========== Shell ========== */
function renderShell(user) {
  if (state.view === "practice") state.view = "home";
  const char = getCharacter(user.gender, user.characterId);
  const snap = userSnapshot(user);
  const idn = snap.identity;
  const main =
    state.view === "home"
      ? renderJourneyHome(user, char, state)
      : state.view === "scroll"
        ? renderScroll(user)
        : state.view === "chapter"
          ? renderChapterDetail(user, state.scrollChapter, state.scrollStage)
          : state.view === "promote"
            ? renderPromote(user, char)
            : state.view === "notes"
              ? renderNotes(user)
              : state.view === "chronicle"
                ? renderChronicle(user, char)
                : state.view === "cuoshi"
                  ? renderCuoshi(user)
                  : state.view === "growth"
                    ? renderGrowthScroll(user, char, state.growthFocus)
                    : state.view === "wheel"
                      ? renderWheelPage(user)
                      : state.view === "teacher"
                        ? renderTeacherPage(state)
                        : state.view === "games"
                          ? renderGamesHub()
                          : state.view === "videos"
                            ? renderVideos()
                            : state.view === "profile"
                              ? renderProfile(user, char, snap)
                              : state.view === "wordwall"
                                ? renderWordwall()
                                : state.view === "timeline"
                                  ? renderTimeline()
                                  : state.view === "dialogue"
                                    ? renderDialogue()
                                    : state.view === "shizhan"
                                      ? renderShizhan(user, char, idn)
                                      : "";

  const topNav = null; // nav built below

  const navItems = [
    ["home", "行旅", "ico-home"],
    ["growth", "成長", "ico-growth"],
    ["scroll", "長卷", "ico-scroll"],
    ["promote", "晉升", "ico-seal"],
    ["cuoshi", "錯史", "ico-battle"],
    ["notes", "札記", "ico-note"],
    ["chronicle", "史冊", "ico-book"],
    ["wheel", "天機輪", "ico-wheel"],
    ["games", "遊戲", "ico-game"],
    ["teacher", "老師", "ico-teacher"],
  ];

  return `
  <div class="app-shell paper-shell">
    <header class="topbar">
      <div class="player-badge">
        <div class="avatar-ring">${renderAvatar(char, snap.stageId ?? idn.id, "sm", { gender: user.gender })}</div>
        <div class="player-meta">
          <strong>${heroDisplayName(user, char)} · ${snap.identityName}</strong>
          <span>${user.username}　${user.formYear || ""}　Lv.${snap.level.level}　XP ${user.xp}　史績 ${snap.score}</span>
          <div class="xp-bar"><i style="width:${snap.level.progress}%"></i></div>
        </div>
      </div>
      <div class="top-tools">
        <span class="brand-top">《任平生》</span>
        <button class="btn ghost" id="logout-btn" type="button">登出</button>
      </div>
    </header>
    <nav class="nav mobile-nav">
      ${navItems
        .map(([id, label, ico]) => {
          const active =
            state.view === id ||
            (id === "scroll" && state.view === "chapter") ||
            (id === "games" && ["wordwall", "timeline", "dialogue", "shizhan"].includes(state.view));
          return `<button type="button" data-nav="${id}" class="${active ? "active" : ""}"><span class="ico ${ico}" aria-hidden="true"></span>${label}</button>`;
        })
        .join("")}
    </nav>
    <main id="main">${main}</main>
  </div>`;
}

function bindShell(user) {
  const char = getCharacter(user.gender, user.characterId);
  app.querySelector("#logout-btn")?.addEventListener("click", () => {
    clearTimeout(levelUpTimer);
    levelUpTimer = null;
    state.levelUpReveal = null;
    clearSession();
    render();
  });
  app.querySelectorAll("[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.view = btn.dataset.nav;
      if (state.view === "scroll") {
        state.scrollStage = null;
      }
      render();
    });
  });
  app.querySelectorAll("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const dest = btn.dataset.goto === "practice" ? "home" : btn.dataset.goto;
      state.view = dest;
      if (state.view === "scroll") state.scrollStage = null;
      render();
    });
  });

  bindJourney(user, journeyCtx());
  if (state.view === "wheel") bindWheel(user, { toast, render, state });
  if (state.view === "teacher") bindTeacher({ render, toast, state });

  if (state.view === "wordwall") bindWordwall();
  if (state.view === "timeline") bindTimeline();
  if (state.view === "dialogue") bindDialogue();
  if (state.view === "shizhan") bindShizhan(user, char);
}

function renderHome(user, char) {
  return renderJourneyHome(user, char, state);
}

function renderProfile(user, char, snap) {
  const order = buildPromotionOrder(user);
  const name = heroDisplayName(user, char);
  return `
  <section class="panel-paper profile-panel">
    <div class="profile-hero">
      ${renderAvatar(char, snap.stageId ?? snap.identity.id, "lg", { gender: user.gender })}
      <div>
        <h2>${name}</h2>
        <p class="lead">身份「${snap.identityName}」· ${user.formYear || ""} · Lv.${snap.level.level} · 衣裝「${snap.outfit}」。${snap.identity.desc}</p>
        <p class="muted">${formYearHint(user.formYear)}</p>
        <p class="muted">${IDENTITY_DISCLAIMER}</p>
      </div>
    </div>
    <div class="edict">
      <h4>晉升令摘要</h4>
      <ul class="edict-list">
        ${order.items
          .slice(0, 5)
          .map((i) => `<li class="${i.ok ? "ok" : "no"}"><span>${i.ok ? "✓" : "✗"}</span>${i.label}</li>`)
          .join("")}
      </ul>
      <button type="button" class="btn" data-goto="promote">前往晉升殿</button>
    </div>
    <div class="stat-row">
      <div class="stat">答對 ${user.stats?.correct || 0}</div>
      <div class="stat">答錯 ${user.stats?.wrong || 0}</div>
      <div class="stat">小遊戲 ${user.stats?.games || 0}</div>
      <div class="stat">總經驗 ${user.xp}</div>
    </div>
  </section>`;
}

/* ========== Games ========== */
function renderGamesHub() {
  return `
  <section class="panel panel-paper">
    <h2>趣味關卡</h2>
    <p class="lead">挑一關挑戰吧！破關可獲經驗。</p>
    <div class="quest-grid games-quest">
      <article class="quest-card tone-cinnabar" data-goto="cuoshi" style="--i:0">
        <div class="quest-icon"><span class="ico ico-battle" style="width:1.4em;height:1.4em"></span></div>
        <div class="quest-body"><h3>錯史之戰</h3><p>辨錯 → 修正 → 舉證，修復被改亂的史頁</p></div>
        <span class="quest-xp">多關</span>
      </article>
      <article class="quest-card tone-gold" data-goto="shizhan" style="--i:1">
        <div class="quest-icon"><span class="ico ico-seal" style="width:1.4em;height:1.4em"></span></div>
        <div class="quest-body"><h3>史戰風雲</h3><p>體力、出牌、答題攻防</p></div>
        <span class="quest-xp">+${XP_REWARDS.shizhanWin}</span>
      </article>
      <article class="quest-card tone-jade" data-goto="wordwall" style="--i:2">
        <div class="quest-icon"><span class="ico ico-game" style="width:1.4em;height:1.4em"></span></div>
        <div class="quest-body"><h3>機緣翻牌</h3><p>翻牌配對／問答</p></div>
        <span class="quest-xp">+${XP_REWARDS.wordwallRound}</span>
      </article>
      <article class="quest-card tone-indigo" data-goto="timeline" style="--i:3">
        <div class="quest-icon"><span class="ico ico-scroll" style="width:1.4em;height:1.4em"></span></div>
        <div class="quest-body"><h3>時光長河</h3><p>把事件放回正確年代（可再抽一局）</p></div>
        <span class="quest-xp">+${XP_REWARDS.timelineComplete}</span>
      </article>
      <article class="quest-card tone-cinnabar" data-goto="dialogue" style="--i:4">
        <div class="quest-icon"><span class="ico ico-note" style="width:1.4em;height:1.4em"></span></div>
        <div class="quest-body"><h3>古人問答</h3><p>與名君對話，考你史識</p></div>
        <span class="quest-xp">+${XP_REWARDS.dialogueGood}</span>
      </article>
    </div>
  </section>`;
}

/* ========== 史戰風雲（三國殺靈感·原創教學版） ========== */
function renderShizhan(user, char, rank) {
  if (!state.shizhan) {
    return `
    <section class="panel shizhan-panel">
      <h2>史戰風雲</h2>
      <p class="lead">靈感來自三國殺的<strong>體力、出牌、回合攻防</strong>——但這是原創中史科教學對戰：用史識決勝負，不是複刻官方遊戲。</p>
      <div class="shizhan-rules">
        <div><strong>⚔️ 問攻</strong> 答選擇題傷敵 1 點</div>
        <div><strong>📜 奇策</strong> 答難題傷敵 2 點</div>
        <div><strong>🌿 回春</strong> 答填充題回血 1 點</div>
        <div><strong>🛡️ 守禦</strong> 下回合可擋敵方攻擊</div>
      </div>
      <p class="lead">雙方各有 ${4} 點體力。打空對手體力即可獲勝（+${XP_REWARDS.shizhanWin} XP）。</p>
      <button type="button" class="btn" id="shizhan-start">以「${char?.name}」出戰</button>
      <button type="button" class="btn ghost" data-goto="games">返回大廳</button>
    </section>`;
  }

  let b = state.shizhan;
  if (b.phase === "enemy") {
    b = resolveEnemyTurn(b);
    state.shizhan = b;
  }

  const enemy = b.enemy;
  const enemyChar = { ...enemy, look: enemy.look };

  let center = "";
  if (b.phase === "end") {
    center = `
      <div class="shizhan-end">
        <h3>${b.winner === "player" ? "🏆 大獲全勝！" : "💀 再接再厲"}</h3>
        <p>${b.winner === "player" ? `擊敗 ${enemy.name}，史識立功。` : `${enemy.name} 技高一籌，溫習後再戰！`}</p>
        <button type="button" class="btn" id="shizhan-again">再戰一場</button>
        <button type="button" class="btn ghost" data-goto="games">返回大廳</button>
      </div>`;
  } else if (b.phase === "quiz" && b.quiz) {
    const q = b.quiz.question;
    const meta = CARD_TYPES[b.quiz.cardType];
    center = `
      <div class="shizhan-quiz">
        <div class="q-meta">${b.quiz.purpose === "guard" ? "守禦答題" : `打出【${meta.name}】`} · ${q.grade || ""} ${q.topic || ""}</div>
        <div class="q-text">${q.q}</div>
        ${
          b.quiz.mode === "mc"
            ? `<div class="options">${q.options
                .map((o, i) => `<button type="button" class="option" data-sz-ans="${i}">${String.fromCharCode(65 + i)}. ${o}</button>`)
                .join("")}</div>`
            : `<div class="fill-row"><input id="sz-fill" placeholder="輸入答案" /><button type="button" class="btn" id="sz-fill-go">提交</button></div>
               <p style="font-size:.85rem;opacity:.7">提示：${q.hint || "——"}</p>`
        }
        ${
          b.quiz.purpose === "play" &&
          b.skillReady &&
          (b.quiz.cardType === "attack" || b.quiz.cardType === "strategy")
            ? `<button type="button" class="btn gold" id="sz-skill" style="margin-top:.75rem">✨ 角色技：此擊傷害+1（本局一次）</button>`
            : b.quiz.skillBoost
              ? `<p class="lead" style="margin-top:.5rem">✨ 角色技已發動</p>`
              : ""
        }
      </div>`;
  } else {
    center = `
      <div class="shizhan-hand-wrap">
        <p class="lead" style="margin-bottom:.5rem">選擇一張牌打出（第 ${b.turn} 回合）${b.hasGuard ? " · 🛡️ 守勢中" : ""}</p>
        <div class="shizhan-hand">
          ${b.hand
            .map((c) => {
              const m = CARD_TYPES[c.type];
              return `<button type="button" class="sz-card" data-sz-card="${c.uid}" style="--c:${m.color}">
                <span class="sz-icon">${m.icon}</span>
                <strong>${m.name}</strong>
                <small>${m.desc}</small>
              </button>`;
            })
            .join("")}
        </div>
      </div>`;
  }

  return `
  <section class="panel shizhan-panel">
    <div class="shizhan-top">
      <h2>史戰風雲</h2>
      <button type="button" class="btn ghost" data-goto="games">離開</button>
    </div>
    <div class="shizhan-arena">
      <div class="sz-fighter enemy">
        ${renderAvatar(enemyChar, 3, "md")}
        <div>
          <strong>${enemy.name}</strong>
          <div class="sz-hp" title="體力">${hearts(b.enemyHp)}</div>
          <small>${enemy.era} · 對手</small>
        </div>
      </div>
      <div class="sz-vs">VS</div>
      <div class="sz-fighter me">
        ${renderAvatar(char, rank.id, "md")}
        <div>
          <strong>${heroDisplayName(user, char)}</strong>
          <div class="sz-hp">${hearts(b.playerHp)}</div>
          <small>你${b.skillReady ? " · 技可用" : ""}</small>
        </div>
      </div>
    </div>
    ${center}
    <div class="shizhan-log">
      ${b.log
        .slice(-6)
        .map((l) => `<div>${l}</div>`)
        .join("")}
    </div>
  </section>`;
}

function bindShizhan(user, char) {
  app.querySelector("#shizhan-start")?.addEventListener("click", () => {
    state.shizhan = createBattle(char, user.formYear);
    render();
  });
  app.querySelector("#shizhan-again")?.addEventListener("click", () => {
    state.shizhan = createBattle(char, user.formYear);
    render();
  });
  app.querySelectorAll("[data-sz-card]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.shizhan = startPlayCard(state.shizhan, btn.dataset.szCard);
      render();
    });
  });
  app.querySelector("#sz-skill")?.addEventListener("click", () => {
    state.shizhan = useSkillOnQuiz(state.shizhan);
    render();
  });
  app.querySelectorAll("[data-sz-ans]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const b = state.shizhan;
      if (!b?.quiz) return;
      const ans = btn.dataset.szAns;
      if (b.quiz.purpose === "guard") {
        state.shizhan = resolveGuardQuiz(b, ans);
      } else {
        state.shizhan = resolvePlayerQuiz(b, ans);
      }
      finishShizhanIfEnded(user);
      render();
    });
  });
  app.querySelector("#sz-fill-go")?.addEventListener("click", () => {
    const input = app.querySelector("#sz-fill");
    state.shizhan = resolvePlayerQuiz(state.shizhan, input?.value || "");
    finishShizhanIfEnded(user);
    render();
  });
}

function finishShizhanIfEnded(user) {
  const b = state.shizhan;
  if (!b || b.phase !== "end" || b._xpGiven) return;
  b._xpGiven = true;
  if (b.winner === "player") {
    reward(XP_REWARDS.shizhanWin, { keepView: false });
  } else {
    reward(XP_REWARDS.shizhanLose, { keepView: false });
  }
}

function renderWordwall() {
  const round = WORDWALL_ROUNDS[state.flip.roundIndex || 0] || WORDWALL_ROUNDS[0];
  if (round.type === "flip") {
    if (!state.flip.cards.length || state.flip.roundId !== round.id) {
      const cards = shuffle(
        round.pairs.flatMap(([a, b], i) => [
          { id: `${i}a`, pair: i, text: a },
          { id: `${i}b`, pair: i, text: b },
        ])
      );
      state.flip = { cards, flipped: [], matched: new Set(), lock: false, roundId: round.id, roundIndex: state.flip.roundIndex || 0 };
    }
    return `
    <section class="panel">
      <h2>Wordwall 風 · ${round.title}</h2>
      <p class="lead">翻開兩張卡，配對正確即可消去。全部完成獲經驗。</p>
      <div class="toolbar">
        ${WORDWALL_ROUNDS.map(
          (r, i) =>
            `<button type="button" class="chip ${(state.flip.roundIndex || 0) === i ? "active" : ""}" data-ww="${i}">${r.title}</button>`
        ).join("")}
      </div>
      <div class="flip-grid" id="flip-grid">
        ${state.flip.cards
          .map((c, idx) => {
            const show = state.flip.flipped.includes(idx) || state.flip.matched.has(c.pair);
            return `<button type="button" class="flip-card ${show ? "revealed" : ""} ${state.flip.matched.has(c.pair) ? "matched" : ""}" data-flip="${idx}"><span>${show ? c.text : "史"}</span></button>`;
          })
          .join("")}
      </div>
    </section>`;
  }

  // quiz type
  const qi = state.flip.quizIndex || 0;
  const qq = round.questions[qi];
  return `
  <section class="panel">
    <h2>Wordwall 風 · ${round.title}</h2>
    <p class="lead">限時不必緊張——答對得分。題目 ${qi + 1}/${round.questions.length}</p>
    <div class="toolbar">
      ${WORDWALL_ROUNDS.map(
        (r, i) =>
          `<button type="button" class="chip ${(state.flip.roundIndex || 0) === i ? "active" : ""}" data-ww="${i}">${r.title}</button>`
      ).join("")}
    </div>
    <div class="question-box">
      <div class="q-text">${qq.q}</div>
      <div class="options">
        ${qq.options.map((o, i) => `<button type="button" class="option" data-wq="${i}">${o}</button>`).join("")}
      </div>
    </div>
  </section>`;
}

function bindWordwall() {
  app.querySelectorAll("[data-ww]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.flip = { cards: [], flipped: [], matched: new Set(), lock: false, roundIndex: Number(btn.dataset.ww), quizIndex: 0 };
      render();
    });
  });

  const round = WORDWALL_ROUNDS[state.flip.roundIndex || 0];
  if (round.type === "flip") {
    app.querySelectorAll("[data-flip]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (state.flip.lock) return;
        const idx = Number(btn.dataset.flip);
        const card = state.flip.cards[idx];
        if (state.flip.matched.has(card.pair) || state.flip.flipped.includes(idx)) return;
        state.flip.flipped.push(idx);
        render();
        if (state.flip.flipped.length === 2) {
          state.flip.lock = true;
          const [i1, i2] = state.flip.flipped;
          const c1 = state.flip.cards[i1];
          const c2 = state.flip.cards[i2];
          setTimeout(() => {
            if (c1.pair === c2.pair) {
              state.flip.matched.add(c1.pair);
              if (state.flip.matched.size === round.pairs.length) {
                submitAnswer(XP_REWARDS.wordwallRound, {
                  recordId: makeAttemptId(),
                  correct: true,
                  game: true,
                  qid: `ww-${round.id}`,
                  qText: round.title,
                  source: "遊戲",
                  keepView: true,
                });
              }
            } else {
              submitAnswer(0, {
                recordId: makeAttemptId(),
                wrong: true,
                game: true,
                qid: `ww-${round.id}-miss`,
                qText: round.title,
                source: "遊戲",
                keepView: true,
              });
            }
            state.flip.flipped = [];
            state.flip.lock = false;
            render();
          }, 550);
        }
      });
    });
  } else {
    app.querySelectorAll("[data-wq]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.wq);
        const qi = state.flip.quizIndex || 0;
        const qq = round.questions[qi];
        if (i === qq.a) {
          submitAnswer(Math.round(XP_REWARDS.wordwallRound / round.questions.length) + 2, {
            recordId: makeAttemptId(),
            correct: true,
            game: true,
            qid: `wwq-${round.id}-${qi}`,
            qText: qq.q,
            source: "遊戲",
            keepView: true,
          });
        } else {
          toast(`正解：${qq.options[qq.a]}`);
          submitAnswer(0, {
            recordId: makeAttemptId(),
            wrong: true,
            game: true,
            qid: `wwq-${round.id}-${qi}`,
            qText: qq.q,
            source: "遊戲",
            keepView: true,
          });
        }
        if (qi + 1 < round.questions.length) {
          state.flip.quizIndex = qi + 1;
        } else {
          state.flip.quizIndex = 0;
          toast("本輪問答完成！");
        }
        render();
      });
    });
  }
}

function dealTimelineRound(set) {
  const n = Math.min(set.pick || 5, set.items.length);
  const picked = shuffle([...set.items]).slice(0, n);
  picked.sort((a, b) => a.year - b.year);
  return {
    items: picked,
    labels: shuffle(picked.map((i) => i.label)),
  };
}

function renderTimeline() {
  const year = getCurrentUser()?.formYear;
  const sets = filterByFormYear(TIMELINE_SETS, year);
  const pool = sets.length ? sets : TIMELINE_SETS;
  let set = pool.find((t) => t.id === state.timeline.setId) || pool[0];
  if (!pool.some((t) => t.id === set.id)) set = pool[0];
  if (state.timeline.setId !== set.id) {
    state.timeline.setId = set.id;
    state.timeline.shuffleId = null;
    state.timeline.roundItems = null;
  }
  // 每套題池較大：每次開局／重洗抽不同子集，減少重複感
  if (state.timeline.shuffleId !== set.id || !state.timeline.roundItems?.length) {
    const deal = dealTimelineRound(set);
    state.timeline.shuffleId = set.id;
    state.timeline.roundItems = deal.items;
    state.timeline.labels = deal.labels;
  }
  const round = state.timeline.roundItems;
  return `
  <section class="panel">
    <h2>人物／事件時間線</h2>
    <p class="lead">${set.title}（${set.grade}）——本題抽 ${round.length}／${set.items.length} 件事件。全部配對正確即過關。${formYearHint(year)}</p>
    <div class="toolbar">
      ${pool
        .map(
          (t) =>
            `<button type="button" class="chip ${state.timeline.setId === t.id ? "active" : ""}" data-tl="${t.id}">${t.title}</button>`
        )
        .join("")}
      <button class="btn ghost" type="button" id="tl-reshuffle">再抽一局</button>
    </div>
    <div class="timeline-list" id="tl-list">
      ${round
        .map((item) => {
          const y = item.year;
          return `
          <div class="timeline-slot">
            <div class="year">${y < 0 ? `前${Math.abs(y)}` : y}</div>
            <select data-year="${y}" data-expect="${item.label}">
              <option value="">— 選擇事件 —</option>
              ${state.timeline.labels.map((l) => `<option value="${l}">${l}</option>`).join("")}
            </select>
          </div>`;
        })
        .join("")}
    </div>
    <div style="margin-top:1rem;display:flex;gap:.6rem;flex-wrap:wrap">
      <button class="btn" type="button" id="tl-check">核對時間線</button>
      ${
        state.stageInteract?.game === "timeline" || state.timelineFromStage
          ? `<button class="btn ghost" type="button" id="tl-back-stage">返回本關</button>`
          : `<button class="btn ghost" type="button" data-goto="games">返回大廳</button>`
      }
    </div>
    <div class="feedback hidden" id="feedback"></div>
  </section>`;
}

function bindTimeline() {
  app.querySelectorAll("[data-tl]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.timeline.setId = btn.dataset.tl;
      state.timeline.shuffleId = null;
      state.timeline.roundItems = null;
      render();
    });
  });
  app.querySelector("#tl-reshuffle")?.addEventListener("click", () => {
    state.timeline.shuffleId = null;
    state.timeline.roundItems = null;
    toast("已換一組新事件");
    render();
  });
  app.querySelector("#tl-back-stage")?.addEventListener("click", () => {
    const from = interactFrom("timeline");
    state.view = "chapter";
    if (from) {
      state.scrollChapter = from.cid;
      state.scrollStage = from.sid;
    }
    render();
  });
  app.querySelector("#tl-check")?.addEventListener("click", () => {
    const selects = [...app.querySelectorAll("select[data-expect]")];
    let ok = 0;
    selects.forEach((s) => {
      if (s.value === s.dataset.expect) {
        ok++;
        s.style.borderColor = "var(--jade)";
      } else {
        s.style.borderColor = "var(--cinnabar)";
      }
    });
    const fb = app.querySelector("#feedback");
    fb.classList.remove("hidden");
    fb.textContent = `正確 ${ok}/${selects.length}`;
    if (ok === selects.length && selects.length) {
      submitAnswer(XP_REWARDS.timelineComplete, {
        recordId: makeAttemptId(),
        correct: true,
        game: true,
        skill: "timeline",
        qid: `tl-${state.timeline.setId || "set"}`,
        qText: "時序長廊",
        source: "遊戲",
        keepView: true,
      });
      const from = interactFrom("timeline");
      if (from) {
        const { already } = finishInteractStage(from, {
          mastered: true,
          correct: selects.length,
          total: selects.length,
        });
        toast(already ? "全對！本關早已完成" : "全對！本關已記入長卷");
      } else {
        toast("全對！可按「再抽一局」繼續練");
      }
    } else {
      submitAnswer(0, {
        recordId: makeAttemptId(),
        wrong: true,
        game: true,
        skill: "timeline",
        qid: `tl-${state.timeline.setId || "set"}`,
        qText: "時序長廊",
        source: "遊戲",
        keepView: true,
      });
      toast("尚未全對，再檢查一下");
    }
  });
}

function renderDialogue() {
  const d = DIALOGUES.find((x) => x.id === state.dialogue.id) || DIALOGUES[0];
  const step = d.steps[state.dialogue.step];
  return `
  <section class="panel">
    <h2>與古人對話</h2>
    <p class="lead">選擇最符合史實或合理史觀的回應。${
      state.stageInteract?.game === "dialogue" ? "完成與一位古人的整段對話即過關。" : ""
    }</p>
    <div class="toolbar">
      ${DIALOGUES.map(
        (x) =>
          `<button type="button" class="chip ${state.dialogue.id === x.id ? "active" : ""}" data-dlg="${x.id}">${x.character}</button>`
      ).join("")}
    </div>
    <div class="dialogue-stage">
      <div class="npc">
        <div class="face">${d.avatar}</div>
        <div class="bubble"><strong>${d.character}</strong>（${d.era}）<br>${state.dialogue.step === 0 && !state.dialogue.replied ? d.intro : step.prompt}</div>
      </div>
      ${
        state.dialogue.replied
          ? `<div class="npc"><div class="face">🧑</div><div class="bubble">${state.dialogue.lastChoice}</div></div>
             <div class="npc"><div class="face">${d.avatar}</div><div class="bubble">${state.dialogue.lastReply}</div></div>
             <button class="btn" type="button" id="dlg-next">${
               state.dialogue.step + 1 < d.steps.length
                 ? "繼續對話"
                 : state.stageInteract?.game === "dialogue"
                   ? "完成本關對話"
                   : "完成並換人"
             }</button>`
          : `<div class="options">${step.choices
              .map(
                (c, i) =>
                  `<button type="button" class="option" data-choice="${i}">${c.text}</button>`
              )
              .join("")}</div>`
      }
    </div>
    ${
      state.stageInteract?.game === "dialogue"
        ? `<div style="margin-top:1rem"><button class="btn ghost" type="button" id="dlg-back-stage">返回本關</button></div>`
        : ""
    }
  </section>`;
}

function bindDialogue() {
  app.querySelectorAll("[data-dlg]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.dialogue = { id: btn.dataset.dlg, step: 0, replied: false, good: 0 };
      render();
    });
  });
  app.querySelectorAll("[data-choice]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const d = DIALOGUES.find((x) => x.id === state.dialogue.id);
      const step = d.steps[state.dialogue.step];
      const choice = step.choices[Number(btn.dataset.choice)];
      state.dialogue.replied = true;
      state.dialogue.lastChoice = choice.text;
      state.dialogue.lastReply = choice.reply;
      if (choice.good) {
        state.dialogue.good = (state.dialogue.good || 0) + 1;
        submitAnswer(XP_REWARDS.dialogueGood, {
          recordId: makeAttemptId(),
          correct: true,
          game: true,
          qid: `dlg-${d.id}-${state.dialogue.step}`,
          qText: choice.text,
          source: "遊戲",
          keepView: true,
        });
      } else {
        submitAnswer(0, {
          recordId: makeAttemptId(),
          wrong: true,
          game: true,
          qid: `dlg-${d.id}-${state.dialogue.step}`,
          qText: choice.text,
          source: "遊戲",
          keepView: true,
        });
        toast("此回應較欠妥，聽聽古人怎麼說");
      }
      render();
    });
  });
  app.querySelector("#dlg-back-stage")?.addEventListener("click", () => {
    const from = interactFrom("dialogue");
    state.view = "chapter";
    if (from) {
      state.scrollChapter = from.cid;
      state.scrollStage = from.sid;
    }
    render();
  });
  app.querySelector("#dlg-next")?.addEventListener("click", () => {
    const d = DIALOGUES.find((x) => x.id === state.dialogue.id);
    if (state.dialogue.step + 1 < d.steps.length) {
      state.dialogue.step += 1;
      state.dialogue.replied = false;
    } else {
      const from = interactFrom("dialogue");
      if (from) {
        const total = d.steps.length;
        const correct = Math.min(state.dialogue.good || 0, total);
        const { already } = finishInteractStage(from, {
          mastered: masteryFromScore(correct, total),
          correct,
          total,
        });
        toast(already ? "對話完成！" : "對話完成！本關已記入長卷");
        state.view = "chapter";
        state.scrollChapter = from.cid;
        state.scrollStage = from.sid;
      } else {
        const idx = DIALOGUES.findIndex((x) => x.id === d.id);
        const next = DIALOGUES[(idx + 1) % DIALOGUES.length];
        state.dialogue = { id: next.id, step: 0, replied: false, good: 0 };
        toast("對話完成！");
      }
    }
    render();
  });
}

function renderVideos() {
  const year = getCurrentUser()?.formYear;
  const list = filterByFormYear(VIDEOS, year);
  return `
  <section class="panel">
    <h2>影片學習區</h2>
    <p class="lead">${formYearHint(year)}。老師可在 <code>js/data/videos.js</code> 新增或替換 YouTube 影片 ID。</p>
    <div class="video-grid">
      ${list.map(
        (v) => `
        <article class="video-card">
          <iframe src="https://www.youtube.com/embed/${v.youtubeId}" title="${v.title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>
          <div class="body">
            <h3>${v.title}</h3>
            <p>${v.grade} · ${v.topic}<br>${v.desc}</p>
          </div>
        </article>`
      ).join("") || "<p>本年級暫無影片。</p>"}
    </div>
  </section>`;
}

const GOLD_PRESS_SEL = "button, .btn, .option, .chip, .stage-card, .chapter-card, .growth-av";
document.addEventListener("pointerdown", (e) => {
  if (e.button != null && e.button !== 0) return;
  const el = e.target.closest?.(GOLD_PRESS_SEL);
  if (!el || el.disabled || el.classList.contains("locked") || el.getAttribute("aria-disabled") === "true") {
    return;
  }
  el.classList.remove("is-gold-flash");
  void el.offsetWidth;
  el.classList.add("is-gold-flash");
  window.setTimeout(() => el.classList.remove("is-gold-flash"), 720);
});

render();
