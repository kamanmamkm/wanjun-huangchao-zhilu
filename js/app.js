import { getCharacter, heroDisplayName } from "./data/characters.js?v=rad50";
import { QUESTIONS } from "./data/questions.js?v=rad50";
import { XP_REWARDS, outfitOf } from "./data/ranks.js?v=rad66";
import { levelFromXp } from "./data/levels.js?v=rad66";
import { DIALOGUES } from "./data/dialogues.js?v=rad62";
import { TIMELINE_SETS, WORDWALL_ROUNDS } from "./data/games.js?v=rad64";
import { CHARMS } from "./data/wheel.js?v=rad67";
import {
  getUnit,
  unitsOfGrade,
  UNIT_FLIPS,
  UNIT_TIMELINES,
  unitTimeline,
  unitFlip,
} from "./data/units.js?v=rad67";
import { VIDEOS } from "./data/videos.js?v=rad50";
import { renderAvatar } from "./avatar.js?v=rad50";
import {
  CARD_TYPES,
  createBattle,
  startPlayCard,
  useSkillOnQuiz,
  resolvePlayerQuiz,
  resolveEnemyTurn,
  resolveGuardQuiz,
  hearts,
} from "./data/shizhan.js?v=rad50";
import {
  getCurrentUser,
  registerUser,
  loginUser,
  clearSession,
  addXp,
  updateUser,
  pushRecent,
} from "./storage.js?v=rad71";
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
  touchDailyVisit,
  getHomeRun,
  setHomeRun,
  clearHomeRun,
  charmCount,
  consumeCharm,
} from "./progress.js?v=rad73";
import { renderWheelPage, bindWheel } from "./wheel.js?v=rad67";
import {
  renderJourneyHome,
  renderScroll,
  renderChapterDetail,
  renderNotes,
  renderChronicle,
  renderCuoshi,
  renderGrowthScroll,
  bindJourney,
  renderLeaderboardPage,
} from "./journey.js?v=rad78";
import { renderTeacherPage, bindTeacher } from "./teacher.js?v=rad78";
import { renderPromoteReveal, renderLevelUpReveal, renderRelicReveal } from "./heroStage.js?v=rad50";
import { getStageVisual } from "./data/stageVisuals.js?v=rad50";
import { flavorLine, isoDay } from "./data/flavor.js?v=rad70";
import {
  FORM_YEARS,
  normalizeFormYear,
  formYearHint,
  filterByFormYear,
  allowedGradeKeys,
  normalizeClassId,
  formYearFromClassId,
  classIdHint,
} from "./data/formYear.js?v=rad50";
import { pickRandomHeroName, isPooledHeroName, HERO_NAME_COUNT } from "./data/heroNames.js?v=rad50";
import { captureCloudFromLocation, getCloudUrl } from "./data/cloud.js?v=rad77";
import { pullCloudBoard, scheduleCloudUpsert, cloudRankOf, upsertCloudUser } from "./cloud.js?v=rad77";
import { isTeacherPortal } from "./data/portal.js?v=rad78";

captureCloudFromLocation();

const app = document.getElementById("app");
let toastTimer = null;
let levelUpTimer = null;
let state = {
  view: isTeacherPortal() ? "teacher" : "home",
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
  gamesYear: "",
  gamesUnit: null,
  gameFromUnit: false,
  unitRun: null,
  dialogue: { id: DIALOGUES[0].id, step: 0, replied: false, good: 0 },
  shizhan: null,
  scrollChapter: "ch1_escape",
  scrollStage: null,
  stageQuiz: null,
  bossStep: 0,
  bossPlay: null,
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
  cloudBoard: null,
  cloudError: "",
  cloudFetchedAt: 0,
  cloudFetching: false,
  cloudMyRank: 0,
  cloudPushed: false,
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
  if (recorded.overtook && !getCloudUrl()) {
    toast(recorded.lead ? "本週擬榜暫居榜首！" : `超前！本週擬榜第 ${recorded.rank}`);
  }
  scheduleCloudUpsert(getCurrentUser());
  if (getCloudUrl()) {
    setTimeout(() => {
      state.cloudFetchedAt = 0;
      ensureCloudBoard();
    }, 2200);
  }
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

function ensureCloudBoard() {
  if (!getCloudUrl()) return;
  if (state.cloudFetching) return;
  const age = Date.now() - (state.cloudFetchedAt || 0);
  if (state.cloudFetchedAt && age < 15000) return;
  state.cloudFetching = true;
  const prevRank = state.cloudMyRank || 0;
  const user = getCurrentUser();
  const push = state.cloudPushed ? Promise.resolve() : upsertCloudUser(user).catch(() => null);
  state.cloudPushed = true;
  push
    .then(() => pullCloudBoard())
    .then((rows) => {
      state.cloudBoard = rows;
      state.cloudError = "";
      state.cloudFetchedAt = Date.now();
      const nextRank = cloudRankOf(rows, getCurrentUser());
      if (prevRank && nextRank && nextRank < prevRank) {
        toast(`超前！本班第 ${nextRank}`);
      }
      state.cloudMyRank = nextRank;
    })
    .catch(() => {
      state.cloudError = "fail";
      state.cloudFetchedAt = Date.now();
      if (!Array.isArray(state.cloudBoard)) state.cloudBoard = [];
    })
    .finally(() => {
      state.cloudFetching = false;
      if (getCurrentUser() && (state.view === "home" || state.view === "teacher" || state.view === "board")) render();
    });
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
  let user = getCurrentUser();
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
  ensureCloudBoard();
  if (state.view === "home") {
    const day = isoDay();
    if (user.progress?.visit?.day !== day) {
      let visit = null;
      updateUser((u) => {
        visit = touchDailyVisit(u);
      });
      user = getCurrentUser() || user;
      if (visit?.granted) toast(`連歸 ${visit.streak} 日，獲錦囊·續燈`);
    }
  }
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
      ${isTeacherPortal() ? `<p class="muted">老師版 · 學生連結睇唔到後台</p>` : ""}
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
      state.view = isTeacherPortal() ? "teacher" : "home";
      state.cloudFetchedAt = 0;
      state.cloudBoard = null;
      state.cloudPushed = false;
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
  if (state.view === "practice" || state.view === "promote") state.view = "home";
  if (!isTeacherPortal() && state.view === "teacher") state.view = "home";
  const char = getCharacter(user.gender, user.characterId);
  const snap = userSnapshot(user);
  const idn = snap.identity;
  const main =
    state.view === "home"
      ? renderJourneyHome(user, char, state)
      : state.view === "board"
        ? renderLeaderboardPage(user, state)
        : state.view === "scroll"
        ? renderScroll(user)
        : state.view === "chapter"
          ? renderChapterDetail(user, state.scrollChapter, state.scrollStage)
          : state.view === "notes"
            ? renderNotes(user)
            : state.view === "chronicle"
                ? renderChronicle(user, char)
                : state.view === "cuoshi"
                  ? renderCuoshi(user, cuoshiHubOpts())
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
    ["board", "排行", "ico-board"],
    ["growth", "成長", "ico-growth"],
    ["scroll", "長卷", "ico-scroll"],
    ["chronicle", "史冊", "ico-book"],
    ["wheel", "天機輪", "ico-wheel"],
    ["games", "遊戲", "ico-game"],
    ...(isTeacherPortal() ? [["teacher", "老師", "ico-teacher"]] : []),
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
            (id === "home" && (state.view === "notes" || state.view === "promote")) ||
            (id === "games" &&
              ["cuoshi", "wordwall", "timeline", "dialogue", "shizhan"].includes(state.view));
          return `<button type="button" data-nav="${id}" class="${active ? "active" : ""}"><span class="ico ${ico}" aria-hidden="true"></span>${label}</button>`;
        })
        .join("")}
    </nav>
    <main id="main">${main}</main>
  </div>`;
}

function bindShellNav() {
  if (app.dataset.shellNav === "1") return;
  app.dataset.shellNav = "1";
  app.addEventListener("click", (e) => {
    const nav = e.target.closest("[data-nav]");
    if (nav) {
      if (nav.dataset.nav === "teacher" && !isTeacherPortal()) return;
      state.view = nav.dataset.nav;
      if (state.view === "scroll") state.scrollStage = null;
      if (state.view === "games") {
        persistHomeRun();
        state.gamesUnit = null;
        state.gameFromUnit = false;
        state.unitRun = null;
        state.cuoshi = null;
      }
      if (state.view === "cuoshi") state.cuoshi = null;
      render();
      return;
    }
    const yearBtn = e.target.closest("[data-games-year]");
    if (yearBtn) {
      if (yearBtn.disabled) return;
      state.view = "games";
      state.gamesYear = yearBtn.dataset.gamesYear;
      state.gamesUnit = null;
      state.gameFromUnit = false;
      state.unitRun = null;
      render();
      return;
    }
    const runBtn = e.target.closest("[data-unit-run]");
    if (runBtn) {
      startUnitRun(runBtn.dataset.unitRun);
      return;
    }
    if (e.target.closest("[data-run-abort]")) {
      const unitId = state.unitRun?.unitId || state.gamesUnit;
      state.unitRun = null;
      clearPersistedRun();
      state.view = "games";
      state.gamesUnit = unitId || null;
      render();
      return;
    }
    if (e.target.closest("[data-resume-run]")) {
      resumeHomeRun();
      return;
    }
    if (e.target.closest("[data-run-next]")) {
      advanceUnitRun();
      return;
    }
    const charmBtn = e.target.closest("[data-use-charm]");
    if (charmBtn) {
      useGameCharm(charmBtn.dataset.useCharm);
      return;
    }
    const unitBtn = e.target.closest("[data-games-unit]");
    if (unitBtn) {
      state.view = "games";
      state.gamesUnit = unitBtn.dataset.gamesUnit || null;
      state.gameFromUnit = false;
      state.unitRun = null;
      render();
      return;
    }
    const playBtn = e.target.closest("[data-unit-play]");
    if (playBtn) {
      openUnitPlay(playBtn.dataset.unitPlay, playBtn.dataset.playId || "");
      return;
    }
    const go = e.target.closest("[data-goto]");
    if (!go) return;
    const dest = go.dataset.goto === "practice" ? "home" : go.dataset.goto;
    state.view = dest;
    if (state.view === "scroll") state.scrollStage = null;
    if (dest === "games") {
      persistHomeRun();
      if (!go.dataset.keepUnit) {
        state.gamesUnit = null;
        state.gameFromUnit = false;
        state.unitRun = null;
      }
      state.cuoshi = null;
    }
    if (dest === "cuoshi") state.cuoshi = null;
    render();
  });
}

function currentGamesYear(user) {
  const y = normalizeFormYear(state.gamesYear) || normalizeFormYear(user?.formYear) || "中一";
  const allowed = allowedGradeKeys(user?.formYear);
  return allowed.includes(y) ? y : allowed[allowed.length - 1] || "中一";
}

function inUnitRun() {
  return state.unitRun?.phase === "play";
}

function runHudHtml() {
  const r = state.unitRun;
  if (!r || r.phase !== "play") return "";
  const unit = getUnit(r.unitId);
  const names = { timeline: "時光長河", flip: "機緣連線", cuoshi: "錯史之戰", dialogue: "古人問答" };
  const stepName = names[r.steps[r.step]] || "闖關";
  const lamps = [0, 1, 2]
    .map((i) => `<i class="run-lamp${i < r.lives ? " on" : ""}"></i>`)
    .join("");
  return `<div class="run-hud">
    <span class="run-era">${unit?.era || "闖關"}</span>
    <span>第 ${r.step + 1}／${r.steps.length} 關 · ${stepName}</span>
    <span class="run-lamps" title="燈火">${lamps}</span>
    <span>連擊 ${r.combo || 0}</span>
    ${charmUseButtons(["lamp"])}
  </div>`;
}

function unitRunSteps(unit) {
  const steps = [];
  if (unit?.timelineId) steps.push("timeline");
  if (unit?.flipId) steps.push("flip");
  if (unit?.cuoshi?.length) steps.push("cuoshi");
  else if (unit?.dialogues?.length) steps.push("dialogue");
  return steps;
}

function persistHomeRun() {
  const r = state.unitRun;
  if (r?.phase === "play") {
    updateUser((u) => setHomeRun(u, r));
  }
}

function clearPersistedRun() {
  updateUser((u) => clearHomeRun(u));
}

function resumeHomeRun() {
  const saved = getHomeRun(getCurrentUser());
  if (!saved) {
    toast("冇未完嘅闖關");
    return;
  }
  state.gamesUnit = saved.unitId;
  state.gameFromUnit = true;
  state.unitRun = { ...saved, combo: saved.combo || 0, phase: "play" };
  openUnitPlay(saved.steps[saved.step] || saved.steps[0], "", { keepRun: true });
}

function startUnitRun(unitId) {
  const unit = getUnit(unitId);
  const steps = unitRunSteps(unit);
  if (!steps.length) {
    toast("本單元暫無可闖關卡");
    return;
  }
  state.gamesUnit = unitId;
  state.gameFromUnit = true;
  state.unitRun = { unitId, lives: 3, combo: 0, step: 0, steps, phase: "play" };
  persistHomeRun();
  openUnitPlay(steps[0], "", { keepRun: true });
}

function burnRunLife(msg) {
  const r = state.unitRun;
  if (!r || r.phase !== "play") return false;
  r.lives = Math.max(0, r.lives - 1);
  r.combo = 0;
  if (r.lives <= 0) {
    r.phase = "fail";
    clearPersistedRun();
    toast(msg || "燈火盡熄");
    state.view = "games";
    render();
    return true;
  }
  persistHomeRun();
  toast(msg || `燈火少一盞，仲有 ${r.lives} 盞`);
  return false;
}

function advanceUnitRun() {
  const r = state.unitRun;
  if (!r || r.phase !== "play") return;
  r.step += 1;
  r.combo = 0;
  if (r.step >= r.steps.length) {
    r.phase = "win";
    clearPersistedRun();
    submitAnswer(XP_REWARDS.unitRunClear || 16, {
      recordId: makeAttemptId(),
      correct: true,
      game: true,
      qid: `run-${r.unitId}`,
      qText: "單元闖關",
      source: "遊戲",
      keepView: true,
    });
    state.view = "games";
    toast("本單元闖關成功！");
    render();
    return;
  }
  persistHomeRun();
  openUnitPlay(r.steps[r.step], "", { keepRun: true });
}

function unitBackButton() {
  if (inUnitRun()) {
    return `<button class="btn ghost" type="button" data-run-abort>放棄闖關</button>`;
  }
  if (!state.gameFromUnit || !state.gamesUnit) {
    return `<button class="btn ghost" type="button" data-goto="games">返回大廳</button>`;
  }
  return `<button class="btn ghost" type="button" data-games-unit="${state.gamesUnit}">返回本單元</button>`;
}

function charmUseButtons(ids) {
  const user = getCurrentUser();
  if (!user) return "";
  const btns = ids
    .map((id) => {
      const n = charmCount(user, id);
      const meta = CHARMS[id];
      if (!n || !meta) return "";
      return `<button type="button" class="btn ghost charm-use" data-use-charm="${id}">${meta.name}（${n}）</button>`;
    })
    .filter(Boolean)
    .join("");
  return btns ? `<div class="charm-use-row">${btns}</div>` : "";
}

function useGameCharm(id) {
  const user = getCurrentUser();
  if (!user) return;
  if (charmCount(user, id) < 1) {
    toast("未有呢張錦囊");
    return;
  }
  if (id === "lamp") {
    if (inUnitRun()) {
      if (state.unitRun.lives >= 3) {
        toast("燈火已滿，留待熄燈後再用");
        return;
      }
      let ok = false;
      updateUser((u) => {
        ok = consumeCharm(u, "lamp");
      });
      if (!ok) return;
      state.unitRun.lives += 1;
      persistHomeRun();
      toast("續燈：燈火＋1");
      render();
      return;
    }
    if (state.view === "shizhan" && state.shizhan && state.shizhan.phase !== "end") {
      const b = state.shizhan;
      if ((b.playerHp || 0) >= 4) {
        toast("體力已滿");
        return;
      }
      let ok = false;
      updateUser((u) => {
        ok = consumeCharm(u, "lamp");
      });
      if (!ok) return;
      b.playerHp = Math.min(4, (b.playerHp || 0) + 1);
      b.log = [...(b.log || []), "續燈錦囊：體力＋1"];
      toast("續燈：體力＋1");
      render();
      return;
    }
    toast("闖關熄燈或史戰受傷時再用");
    return;
  }
  if (id === "peek") {
    if (state.view === "timeline") {
      if (state.timeline.cleared) {
        toast("已經開船");
        return;
      }
      const order = state.timeline.order || [];
      const peeks = { ...(state.timeline.peeks || {}) };
      const item = order.find((it) => it && !peeks[it.id]);
      if (!item) {
        toast("本局已無未揭示之事");
        return;
      }
      let ok = false;
      updateUser((u) => {
        ok = consumeCharm(u, "peek");
      });
      if (!ok) return;
      peeks[item.id] = true;
      state.timeline.peeks = peeks;
      toast(`窺卷：${item.hint || formatEraYear(item.year)}`);
      render();
      return;
    }
    if (state.view === "cuoshi" && state.cuoshi?.id) {
      if (state.cuoshi.forceHint) {
        toast("本關已用過窺卷");
        return;
      }
      let ok = false;
      updateUser((u) => {
        ok = consumeCharm(u, "peek");
      });
      if (!ok) return;
      state.cuoshi.forceHint = true;
      toast("窺卷：睇埋辨錯方向");
      render();
      return;
    }
    toast("時光長河或錯史之戰先用得");
    return;
  }
  if (id === "silk") {
    if (state.view !== "wordwall") {
      toast("機緣連線先用得");
      return;
    }
    const f = state.flip;
    if (!f || f.won) {
      toast("本局已完");
      return;
    }
    let pair = -1;
    for (let i = 0; i < (f.pairCount || 0); i++) {
      if (!f.matched.has(i) && f.silkPair !== i) {
        pair = i;
        break;
      }
    }
    if (pair < 0) {
      toast("已無未配之對");
      return;
    }
    let ok = false;
    updateUser((u) => {
      ok = consumeCharm(u, "silk");
    });
    if (!ok) return;
    f.silkPair = pair;
    toast("絲引：金邊嗰對係一組");
    render();
    return;
  }
  toast("此錦囊未識用");
}

function cuoshiHubOpts() {
  if (!state.gameFromUnit) return { hud: runHudHtml(), inRun: inUnitRun(), charms: charmUseButtons(["peek"]) };
  const unit = getUnit(state.gamesUnit);
  return { ids: unit?.cuoshi || [], backUnit: state.gamesUnit, hud: runHudHtml(), inRun: inUnitRun(), charms: charmUseButtons(["peek"]) };
}

function flipRoundPool() {
  if (state.gameFromUnit) {
    const round = unitFlip(getUnit(state.gamesUnit));
    return round ? [round] : UNIT_FLIPS;
  }
  return WORDWALL_ROUNDS;
}

function timelineSetPool(formYear) {
  if (state.gameFromUnit) {
    const set = unitTimeline(getUnit(state.gamesUnit));
    return set ? [set] : UNIT_TIMELINES;
  }
  const sets = filterByFormYear(TIMELINE_SETS, formYear);
  return sets.length ? sets : TIMELINE_SETS;
}

function openUnitPlay(type, playId, opts = {}) {
  const unit = getUnit(state.gamesUnit);
  state.gameFromUnit = !!state.gamesUnit;
  if (!opts.keepRun) state.unitRun = null;
  if (type === "timeline") {
    const set = unitTimeline(unit);
    if (set) {
      state.timeline.setId = set.id;
      state.timeline.shuffleId = null;
      state.timeline.roundItems = null;
      state.timeline.cleared = false;
    }
    state.view = "timeline";
  } else if (type === "flip") {
    const round = unitFlip(unit);
    const idx = UNIT_FLIPS.findIndex((r) => r.id === round?.id);
    if (round) state.flip = dealFlipRound(round, idx < 0 ? 0 : idx);
    state.view = "wordwall";
  } else if (type === "cuoshi") {
    const first = unit?.cuoshi?.[0];
    state.cuoshi = opts.keepRun && first ? { id: first, phase: "spot", miss: [] } : null;
    state.view = "cuoshi";
  } else if (type === "dialogue") {
    const id = playId || unit?.dialogues?.[0] || DIALOGUES[0].id;
    state.dialogue = { id, step: 0, replied: false, good: 0 };
    state.view = "dialogue";
  } else if (type === "shizhan") {
    state.shizhan = null;
    state.view = "shizhan";
  }
  render();
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
  bindShellNav();

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
      <button type="button" class="btn" data-goto="home">返回行旅</button>
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
function renderRunResult() {
  const r = state.unitRun;
  const unit = getUnit(r?.unitId);
  const win = r?.phase === "win";
  const stars = win ? Math.max(1, r.lives || 1) : 0;
  const starHtml = [1, 2, 3]
    .map((n) => `<span class="run-star${n <= stars ? " on" : ""}">★</span>`)
    .join("");
  return `
  <section class="panel panel-paper run-result ${win ? "is-win" : "is-fail"}">
    <p class="eyebrow ink-gold">${unit?.grade || ""} · 單元${unit?.no || ""}</p>
    <h2>${win ? "闖關成功" : "燈火盡熄"}</h2>
    <p class="run-stars" aria-label="${stars} 星">${starHtml}</p>
    <p class="lead">${win ? `${unit?.era || ""}一路過關，史識立功。` : `${unit?.era || ""}尚未打通，重整旗鼓再闖。`}</p>
    <div class="row-actions">
      <button type="button" class="btn" data-unit-run="${r.unitId}">${win ? "再闖一回" : "再試一次"}</button>
      <button type="button" class="btn ghost" data-games-unit="${r.unitId}">自選遊戲</button>
      <button type="button" class="btn ghost" data-games-unit="">返回時代</button>
    </div>
  </section>`;
}

function renderGamesHub() {
  if (state.unitRun?.phase === "win" || state.unitRun?.phase === "fail") {
    return renderRunResult();
  }
  const user = getCurrentUser();
  const year = currentGamesYear(user);
  state.gamesYear = year;
  const allowed = allowedGradeKeys(user?.formYear);
  const unit = getUnit(state.gamesUnit);
  const yearTabs = FORM_YEARS.map((g) => {
    const open = allowed.includes(g);
    return `<button type="button" class="chip ${g === year ? "active" : ""}" data-games-year="${g}" ${open ? "" : "disabled"}>${g}${open ? "" : " · 未開放"}</button>`;
  }).join("");

  if (unit && unit.grade === year) {
    const games = [];
    if (unit.timelineId) {
      games.push({
        play: "timeline",
        tone: "tone-indigo",
        title: "時光長河",
        blurb: "拖牌排時序，開船過關",
        xp: `+${XP_REWARDS.timelineComplete}`,
        ico: "ico-scroll",
      });
    }
    if (unit.flipId) {
      games.push({
        play: "flip",
        tone: "tone-jade",
        title: "機緣連線",
        blurb: "左右各撳一張，配成一對",
        xp: `+${XP_REWARDS.wordwallRound}`,
        ico: "ico-game",
      });
    }
    if ((unit.cuoshi || []).length) {
      games.push({
        play: "cuoshi",
        tone: "tone-cinnabar",
        title: "錯史之戰",
        blurb: `搵出錯句，修復殘卷（${unit.cuoshi.length} 關）`,
        xp: "多關",
        ico: "ico-battle",
      });
    }
    if ((unit.dialogues || []).length) {
      games.push({
        play: "dialogue",
        tone: "tone-cinnabar",
        title: "古人問答",
        blurb: "同本單元人物過招",
        xp: `+${XP_REWARDS.dialogueGood}`,
        ico: "ico-note",
      });
    }
    const cards = games
      .map(
        (g, i) => `
      <article class="quest-card ${g.tone}" data-unit-play="${g.play}" style="--i:${i}">
        <div class="quest-icon"><span class="ico ${g.ico}" style="width:1.4em;height:1.4em"></span></div>
        <div class="quest-body"><h3>${g.title}</h3><p>${g.blurb}</p></div>
        <span class="quest-xp">${g.xp}</span>
      </article>`
      )
      .join("");
    const canRun = unitRunSteps(unit).length > 0;
    return `
    <section class="panel panel-paper">
      <p class="eyebrow ink-gold">${unit.grade} · 單元${unit.no}</p>
      <h2>${unit.era}</h2>
      <p class="lead">${unit.title}。三盞燈火連闖本單元。</p>
      <div class="toolbar">${yearTabs}</div>
      ${canRun ? `<div class="row-actions" style="margin-bottom:.85rem"><button type="button" class="btn" data-unit-run="${unit.id}">闖本單元</button></div>` : ""}
      <div class="quest-grid games-quest">${cards}</div>
      <div class="row-actions">
        <button type="button" class="btn ghost" data-games-unit="">返回${year}時代</button>
      </div>
    </section>`;
  }

  const units = unitsOfGrade(year);
  const unitCards = units
    .map(
      (u, i) => `
    <article class="unit-card" style="--i:${i}">
      <p class="eyebrow">單元 ${u.no}</p>
      <h3>${u.era}</h3>
      <p class="muted">${u.title}</p>
      <div class="unit-card-actions">
        <button type="button" class="btn" data-unit-run="${u.id}">闖關</button>
        <button type="button" class="btn ghost" data-games-unit="${u.id}">自選</button>
      </div>
    </article>`
    )
    .join("");
  return `
  <section class="panel panel-paper">
    <h2>趣味關卡</h2>
    <p class="lead">揀一個時代闖關：三盞燈火，連過長河同連線。${formYearHint(user?.formYear)}</p>
    <article class="quest-card tone-gold shizhan-feature" data-unit-play="shizhan">
      <div class="quest-icon"><span class="ico ico-seal" style="width:1.4em;height:1.4em"></span></div>
      <div class="quest-body"><h3>史戰風雲</h3><p>體力、出牌、答題攻防——本年綜合對戰</p></div>
      <span class="quest-xp">+${XP_REWARDS.shizhanWin}</span>
    </article>
    <div class="toolbar">${yearTabs}</div>
    <div class="unit-grid">${unitCards}</div>
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
    ${b.phase !== "end" ? charmUseButtons(["lamp"]) : ""}
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

function dealFlipRound(round, roundIndex) {
  const pool = round?.pairs || [];
  const n = Math.min(round?.pick || 4, pool.length);
  const chosen = shuffle(pool).slice(0, n);
  const left = shuffle(chosen.map((p, i) => ({ id: `l${i}`, pair: i, text: p.a })));
  const right = shuffle(chosen.map((p, i) => ({ id: `r${i}`, pair: i, text: p.b, note: p.note || "" })));
  return {
    left,
    right,
    pickL: null,
    pickR: null,
    matched: new Set(),
    lock: false,
    roundId: round.id,
    roundIndex: roundIndex ?? 0,
    pairCount: chosen.length,
    combo: 0,
    maxCombo: 0,
    lastNote: "",
    won: false,
    missL: [],
    missR: [],
    silkPair: null,
  };
}

function renderWordwall() {
  const pool = flipRoundPool();
  let round = pool.find((r) => r.id === state.flip.roundId) || pool[state.flip.roundIndex || 0] || pool[0];
  const idx = pool.findIndex((r) => r.id === round.id);
  if (!state.flip.left?.length || state.flip.roundId !== round.id) {
    state.flip = dealFlipRound(round, idx < 0 ? 0 : idx);
  }
  const f = state.flip;
  const done = f.matched.size === (f.pairCount || 0) && (f.pairCount || 0) > 0;
  const chips =
    pool.length > 1
      ? pool
          .map(
            (r, i) =>
              `<button type="button" class="chip ${f.roundId === r.id ? "active" : ""}" data-ww="${i}">${r.title}</button>`
          )
          .join("")
      : "";
  const col = (side, items, pick, miss) =>
    items
      .map((c, i) => {
        const ok = f.matched.has(c.pair);
        const picked = pick === i;
        const bad = (miss || []).includes(i);
        const silk = f.silkPair === c.pair;
        return `<button type="button" class="match-item side-${side}${picked ? " selected" : ""}${ok ? " done" : ""}${bad ? " is-miss" : ""}${silk ? " is-silk" : ""}" data-match-${side}="${i}" ${ok ? "disabled" : ""}>${c.text}</button>`;
      })
      .join("");
  return `
    <section class="panel">
      ${runHudHtml()}
      <h2>機緣連線 · ${round.title}</h2>
      <p class="lead">左邊人事、右邊史義，各撳一張配成一對。本題 ${f.pairCount} 對。</p>
      <p class="muted">已配 ${f.matched.size}／${f.pairCount}　連擊 ${f.combo || 0}${f.maxCombo ? `　最高 ${f.maxCombo}` : ""}</p>
      <div class="toolbar">
        ${chips}
        ${inUnitRun() ? "" : `<button class="btn ghost" type="button" id="ww-reshuffle">再抽一局</button>`}
        ${charmUseButtons(["silk"])}
      </div>
      <div class="match-board" id="flip-grid">
        <div class="match-col">${col("l", f.left, f.pickL, f.missL)}</div>
        <div class="match-col">${col("r", f.right, f.pickR, f.missR)}</div>
      </div>
      <p class="flip-note">${f.lastNote || "左右各揀一張，睇佢哋係咪同一條史線。"}</p>
      ${done ? `<p class="feedback">全對！${inUnitRun() ? "即將進入下一關。" : "可再抽一局繼續。"}</p>` : ""}
      <div class="row-actions">
        ${unitBackButton()}
      </div>
    </section>`;
}

function bindWordwall() {
  const pool = flipRoundPool();
  app.querySelectorAll("[data-ww]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.ww);
      state.flip = dealFlipRound(pool[i] || pool[0], i);
      render();
    });
  });
  app.querySelector("#ww-reshuffle")?.addEventListener("click", () => {
    const round = pool.find((r) => r.id === state.flip.roundId) || pool[0];
    const i = pool.findIndex((r) => r.id === round.id);
    state.flip = dealFlipRound(round, i < 0 ? 0 : i);
    render();
  });

  const round = pool.find((r) => r.id === state.flip.roundId) || pool[0];
  const pick = (side, idx) => {
    const f = state.flip;
    if (f.lock || f.won) return;
    const list = side === "l" ? f.left : f.right;
    const card = list[idx];
    if (!card || f.matched.has(card.pair)) return;
    if (side === "l") f.pickL = f.pickL === idx ? null : idx;
    else f.pickR = f.pickR === idx ? null : idx;
    f.missL = [];
    f.missR = [];
    if (f.pickL == null || f.pickR == null) {
      render();
      return;
    }
    const c1 = f.left[f.pickL];
    const c2 = f.right[f.pickR];
    if (c1.pair === c2.pair) {
      f.matched.add(c1.pair);
      f.combo = (f.combo || 0) + 1;
      f.maxCombo = Math.max(f.maxCombo || 0, f.combo);
      f.lastNote = c2.note || "配對正確。";
      f.pickL = null;
      f.pickR = null;
      if (inUnitRun()) state.unitRun.combo = f.combo;
      if (f.matched.size === f.pairCount) {
        f.won = true;
        submitAnswer(XP_REWARDS.wordwallRound, {
          recordId: makeAttemptId(),
          correct: true,
          game: true,
          qid: `ww-${round.id}`,
          qText: round.title,
          source: "遊戲",
          keepView: true,
        });
        if (inUnitRun()) {
          toast("連線全通！");
          render();
          setTimeout(() => {
            if (!inUnitRun() || state.view !== "wordwall") return;
            advanceUnitRun();
          }, preferReduceMotion() ? 0 : 700);
          return;
        }
        toast("全對！可按「再抽一局」繼續");
      } else {
        toast(f.combo > 1 ? `連擊 ×${f.combo}！${f.lastNote}` : f.lastNote);
      }
      render();
      return;
    }
    f.lock = true;
    f.combo = 0;
    if (inUnitRun()) state.unitRun.combo = 0;
    f.missL = [f.pickL];
    f.missR = [f.pickR];
    f.lastNote = "唔係一對，再試。";
    const dead = inUnitRun() ? burnRunLife("配錯一對，燈火少一盞") : false;
    if (dead) return;
    render();
    setTimeout(() => {
      if (state.view !== "wordwall") return;
      if (state.flip.roundId !== f.roundId) return;
      if (state.unitRun?.phase === "fail") return;
      state.flip.pickL = null;
      state.flip.pickR = null;
      state.flip.missL = [];
      state.flip.missR = [];
      state.flip.lock = false;
      render();
    }, preferReduceMotion() ? 0 : 480);
  };
  app.querySelectorAll("[data-match-l]").forEach((btn) => {
    btn.addEventListener("click", () => pick("l", Number(btn.dataset.matchL)));
  });
  app.querySelectorAll("[data-match-r]").forEach((btn) => {
    btn.addEventListener("click", () => pick("r", Number(btn.dataset.matchR)));
  });
}

function formatEraYear(y) {
  const n = Number(y);
  return n < 0 ? `前${Math.abs(n)}` : String(n);
}

function preferReduceMotion() {
  return (
    document.body.classList.contains("reduce-motion") ||
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
  );
}

function timelineOrderSorted(order) {
  if (!order?.length) return false;
  return order.every((it, i) => i === 0 || Number(it.year) > Number(order[i - 1].year));
}

function dealTimelineRound(set) {
  const n = Math.min(set.pick || 5, set.items.length);
  const picked = shuffle([...set.items]).slice(0, n);
  let order = shuffle([...picked]);
  if (timelineOrderSorted(order) && order.length > 1) {
    const tmp = order[0];
    order[0] = order[1];
    order[1] = tmp;
  }
  return { items: picked, order };
}

function resetTimelineDeal(set) {
  const deal = dealTimelineRound(set);
  state.timeline.shuffleId = set.id;
  state.timeline.roundItems = deal.items;
  state.timeline.order = deal.order;
  state.timeline.pick = null;
  state.timeline.marks = [];
  state.timeline.revealed = false;
  state.timeline.feedback = "";
  state.timeline.cleared = false;
  state.timeline.peeks = {};
}

function moveTimelineCard(from, to) {
  const order = [...(state.timeline.order || [])];
  if (from === to || from < 0 || to < 0 || from >= order.length || to >= order.length) return;
  const [moved] = order.splice(from, 1);
  order.splice(to, 0, moved);
  state.timeline.order = order;
  state.timeline.pick = null;
  state.timeline.marks = [];
}

function swapTimelineCards(a, b) {
  const order = [...(state.timeline.order || [])];
  if (a === b || a < 0 || b < 0 || a >= order.length || b >= order.length) return;
  const tmp = order[a];
  order[a] = order[b];
  order[b] = tmp;
  state.timeline.order = order;
  state.timeline.pick = null;
  state.timeline.marks = [];
}

function renderTimeline() {
  const year = getCurrentUser()?.formYear;
  const pool = timelineSetPool(year);
  let set = pool.find((t) => t.id === state.timeline.setId) || pool[0];
  if (!pool.some((t) => t.id === set.id)) set = pool[0];
  if (state.timeline.setId !== set.id) {
    state.timeline.setId = set.id;
    state.timeline.shuffleId = null;
    state.timeline.roundItems = null;
  }
  if (state.timeline.shuffleId !== set.id || !state.timeline.order?.length) {
    resetTimelineDeal(set);
  }
  const order = state.timeline.order;
  const reduce = preferReduceMotion();
  const revealed = !!state.timeline.revealed;
  const marks = state.timeline.marks || [];
  const pick = state.timeline.pick;
  const peeks = state.timeline.peeks || {};
  return `
  <section class="panel">
    ${runHudHtml()}
    <h2>時光長河</h2>
    <p class="lead">${set.title}（${set.grade}）——本題 ${order.length} 件。由上至下排成<strong>由早到晚</strong>，開船核對。${inUnitRun() ? "" : formYearHint(year)}</p>
    <p class="muted">${reduce ? "撳兩張牌可交換位置。" : "拖上拖落，或撳兩張牌交換。"}</p>
    <div class="toolbar">
      ${
        !inUnitRun() && pool.length > 1
          ? pool
              .map(
                (t) =>
                  `<button type="button" class="chip ${state.timeline.setId === t.id ? "active" : ""}" data-tl="${t.id}">${t.title}</button>`
              )
              .join("")
          : ""
      }
      ${inUnitRun() ? "" : `<button class="btn ghost" type="button" id="tl-reshuffle">再抽一局</button>`}
      ${charmUseButtons(["peek"])}
    </div>
    <div class="timeline-river" id="tl-list" role="list">
      ${order
        .map((item, i) => {
          const mark = marks[i] || "";
          const selected = pick === i ? " is-picked" : "";
          return `
          <div class="tl-card${selected}${mark === "ok" ? " is-ok" : ""}${mark === "bad" ? " is-bad" : ""}" role="button" aria-label="${item.label}" tabindex="0" data-tl-i="${i}" ${
            reduce ? "" : 'draggable="true"'
          }>
            <span class="tl-ord" aria-hidden="true">${i + 1}</span>
            <span class="tl-label">${item.label}</span>
            ${revealed ? `<span class="tl-year">${formatEraYear(item.year)}</span>` : peeks[item.id] ? `<span class="tl-year tl-hint">${item.hint || formatEraYear(item.year)}</span>` : ""}
          </div>`;
        })
        .join("")}
    </div>
    <div class="row-actions">
      <button class="btn" type="button" id="tl-check"${state.timeline.cleared ? " disabled" : ""}>${state.timeline.cleared ? "已開船" : "開船"}</button>
      ${
        state.stageInteract?.game === "timeline" || state.timelineFromStage
          ? `<button class="btn ghost" type="button" id="tl-back-stage">返回本關</button>`
          : unitBackButton()
      }
    </div>
    <div class="feedback ${state.timeline.feedback ? "" : "hidden"}" id="feedback">${state.timeline.feedback || ""}</div>
  </section>`;
}

function bindTimeline() {
  app.querySelectorAll("[data-tl]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.timeline.setId = btn.dataset.tl;
      state.timeline.shuffleId = null;
      state.timeline.roundItems = null;
      state.timeline.order = null;
      render();
    });
  });
  app.querySelector("#tl-reshuffle")?.addEventListener("click", () => {
    state.timeline.shuffleId = null;
    state.timeline.roundItems = null;
    state.timeline.order = null;
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

  const list = app.querySelector("#tl-list");
  const reduce = preferReduceMotion();
  let dragFrom = null;
  let didDrag = false;

  const onPick = (i) => {
    if (didDrag) {
      didDrag = false;
      return;
    }
    const cur = state.timeline.pick;
    if (cur == null || cur === i) {
      state.timeline.pick = cur === i ? null : i;
      render();
      return;
    }
    swapTimelineCards(cur, i);
    render();
  };

  list?.querySelectorAll("[data-tl-i]").forEach((card) => {
    const i = Number(card.dataset.tlI);
    card.addEventListener("click", () => onPick(i));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onPick(i);
      }
    });
    if (reduce) return;
    card.addEventListener("dragstart", (e) => {
      dragFrom = i;
      didDrag = false;
      card.classList.add("is-dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(i));
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("is-dragging");
    });
    card.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    });
    card.addEventListener("drop", (e) => {
      e.preventDefault();
      const from = dragFrom ?? Number(e.dataTransfer.getData("text/plain"));
      const to = Number(card.dataset.tlI);
      if (Number.isNaN(from) || from === to) return;
      didDrag = true;
      moveTimelineCard(from, to);
      dragFrom = null;
      render();
    });
  });

  app.querySelector("#tl-check")?.addEventListener("click", () => {
    const order = state.timeline.order || [];
    if (!order.length || state.timeline.cleared) return;
    const sorted = [...order].sort((a, b) => Number(a.year) - Number(b.year));
    const marks = order.map((it, i) => (it.id === sorted[i].id ? "ok" : "bad"));
    const ok = marks.filter((m) => m === "ok").length;
    const all = timelineOrderSorted(order);
    state.timeline.marks = all ? order.map(() => "ok") : marks;
    state.timeline.pick = null;
    if (all) {
      state.timeline.revealed = true;
      state.timeline.cleared = true;
      state.timeline.feedback = `時序全對 ${order.length}/${order.length}`;
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
          correct: order.length,
          total: order.length,
        });
        toast(already ? "全對！本關早已完成" : "全對！本關已記入長卷");
        render();
        return;
      }
      if (inUnitRun()) {
        toast("時序開通！");
        render();
        setTimeout(() => {
          if (!inUnitRun() || state.view !== "timeline") return;
          advanceUnitRun();
        }, preferReduceMotion() ? 0 : 700);
        return;
      }
      toast("全對！可按「再抽一局」繼續");
      render();
      return;
    }
    state.timeline.revealed = !inUnitRun();
    state.timeline.feedback = `時序正確 ${ok}/${order.length}　可再排`;
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
    if (inUnitRun()) {
      const dead = burnRunLife("時序未通，燈火少一盞");
      if (dead) return;
    } else {
      toast("尚未全對，再排一次");
    }
    render();
  });
}

function renderDialogue() {
  const unit = state.gameFromUnit ? getUnit(state.gamesUnit) : null;
  const people =
    unit?.dialogues?.length ? DIALOGUES.filter((x) => unit.dialogues.includes(x.id)) : DIALOGUES;
  const d = people.find((x) => x.id === state.dialogue.id) || people[0] || DIALOGUES[0];
  if (state.dialogue.id !== d.id) state.dialogue = { id: d.id, step: 0, replied: false, good: 0 };
  const step = d.steps[state.dialogue.step];
  return `
  <section class="panel">
    ${runHudHtml()}
    <h2>與古人對話</h2>
    <p class="lead">揀最合乎史實嘅回應，同古人過招。${
      state.stageInteract?.game === "dialogue" ? "完成與一位古人的整段對話即過關。" : ""
    }</p>
    <div class="toolbar">
      ${
        inUnitRun()
          ? ""
          : people
              .map(
                (x) =>
                  `<button type="button" class="chip ${state.dialogue.id === x.id ? "active" : ""}" data-dlg="${x.id}">${x.character}</button>`
              )
              .join("")
      }
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
                 : state.stageInteract?.game === "dialogue" || inUnitRun()
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
        : `<div style="margin-top:1rem">${unitBackButton()}</div>`
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
        if (inUnitRun()) {
          toast("對話過關！");
          advanceUnitRun();
          return;
        }
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

const GOLD_PRESS_SEL = "button, .btn, .option, .chip, .stage-card, .chapter-card, .growth-av, .match-item, .unit-card, .tl-card";
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
