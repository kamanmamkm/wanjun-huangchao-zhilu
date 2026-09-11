import { getCharacter, heroDisplayName } from "./data/characters.js?v=rad18";
import { QUESTIONS, checkFill } from "./data/questions.js?v=rad18";
import { XP_REWARDS, outfitOf } from "./data/ranks.js?v=rad18";
import { levelFromXp } from "./data/levels.js?v=rad18";
import { DIALOGUES } from "./data/dialogues.js?v=rad18";
import { TIMELINE_SETS, WORDWALL_ROUNDS } from "./data/games.js?v=rad18";
import { VIDEOS, EXTERNAL_WORDWALL } from "./data/videos.js?v=rad18";
import { renderAvatar } from "./avatar.js?v=rad18";
import {
  CARD_TYPES,
  createBattle,
  startPlayCard,
  useSkillOnQuiz,
  resolvePlayerQuiz,
  resolveEnemyTurn,
  resolveGuardQuiz,
  hearts,
} from "./data/shizhan.js?v=rad18";
import {
  getCurrentUser,
  registerUser,
  loginUser,
  clearSession,
  addXp,
  updateUser,
} from "./storage.js?v=rad18";
import {
  userSnapshot,
  buildPromotionOrder,
  recordLearning,
  IDENTITY_DISCLAIMER,
  identityDisplayName,
  getIdentity,
  syncIdentityToLevel,
} from "./progress.js?v=rad18";
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
} from "./journey.js?v=rad18";
import { renderTeacherPage, bindTeacher } from "./teacher.js?v=rad18";
import { renderPromoteReveal } from "./heroStage.js?v=rad18";
import { getStageVisual } from "./data/stageVisuals.js?v=rad18";

const app = document.getElementById("app");
let toastTimer = null;
let state = {
  view: "home",
  authMode: "login",
  gender: "male",
  heroName: "",
  practice: { mode: "mc", grade: "全部", index: 0 },
  match: { selectedLeft: null, selectedRight: null, solved: new Set() },
  flip: { cards: [], flipped: [], matched: new Set(), lock: false },
  timeline: { setId: TIMELINE_SETS[0].id },
  dialogue: { id: DIALOGUES[0].id, step: 0 },
  shizhan: null,
  scrollChapter: "ch1_escape",
  scrollStage: null,
  stageQuiz: null,
  bossStep: 0,
  trial: null,
  cuoshi: null,
  promoteReveal: null,
  growthFocus: null,
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

function reward(amount, meta = {}) {
  const before = getCurrentUser();
  const prevLv = before ? levelFromXp(before.xp).level : 1;
  let bonus = amount;
  if (meta.qid && before?.answered?.[meta.qid]) {
    bonus = Math.max(1, Math.round(bonus * XP_REWARDS.repeatScale));
  }
  if (meta.correct && (before?.streak || 0) >= 3) bonus += XP_REWARDS.streakBonus;
  if (meta.correct && (meta.topic || meta.skill || meta.qid)) {
    updateUser((u) =>
      recordLearning(u, {
        topic: meta.topic,
        skill: meta.skill || "recall",
        correct: true,
        qid: meta.qid,
        qText: meta.qText,
        chapterId: meta.chapterId,
      })
    );
  }
  if (meta.wrong && meta.qText) {
    updateUser((u) =>
      recordLearning(u, {
        topic: meta.topic,
        skill: meta.skill || "recall",
        correct: false,
        qid: meta.qid,
        qText: meta.qText,
      })
    );
  }
  addXp(bonus, meta);
  const after = getCurrentUser();
  const nextLv = levelFromXp(after.xp).level;
  let stageUp = null;
  if (nextLv > prevLv) {
    updateUser((u) => {
      stageUp = syncIdentityToLevel(u);
    });
  }
  const synced = getCurrentUser();
  if (stageUp) {
    const name = identityDisplayName(getIdentity(stageUp.to), synced?.gender);
    state.promoteReveal = { fromId: stageUp.from, toId: stageUp.to };
    toast(`升至 Lv.${nextLv}！形象晉升為「${name}」· +${bonus} 經驗`);
  } else if (nextLv > prevLv) toast(`角色升至 Lv.${nextLv}！+${bonus} 經驗`);
  else if (meta.qid && before?.answered?.[meta.qid]) toast(`+${bonus} 經驗（複習減幅）`);
  else if (bonus) toast(`+${bonus} 經驗`);
  if (!meta.keepView) render();
  else refreshTopbarOnly();
}

function refreshTopbarOnly() {
  const user = getCurrentUser();
  if (!user) return;
  const char = getCharacter(user.gender, user.characterId);
  const snap = userSnapshot(user);
  const badge = app.querySelector(".player-badge");
  if (!badge) return;
  badge.innerHTML = `
    <div class="avatar-ring">${renderAvatar(char, snap.identity.id, "sm", { gender: user.gender })}</div>
    <div class="player-meta">
      <strong>${heroDisplayName(user, char)} · ${snap.identityName}</strong>
      <span>${user.username}　Lv.${snap.level.level}　XP ${user.xp}</span>
      <div class="xp-bar"><i style="width:${snap.level.progress}%"></i></div>
    </div>`;
}

function journeyCtx() {
  return {
    state,
    render,
    toast,
    reward,
    getUser: getCurrentUser,
    getCharacter: () => {
      const u = getCurrentUser();
      return u ? getCharacter(u.gender, u.characterId) : null;
    },
  };
}

function render() {
  const user = getCurrentUser();
  if (!user) {
    document.body.className = "";
    app.innerHTML = renderAuth();
    bindAuth();
    return;
  }
  const id = user.identityId || 0;
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
  }
}

/* ========== Auth ========== */
function renderAuth() {
  const preview = getCharacter(state.gender);
  const previewName = String(state.heroName || "").trim() || "行者";
  return `
  <section class="hero-screen">
    <div class="brand-block">
      <p class="eyebrow">萬鈞伯裘中史科成長遊戲</p>
      <h1>任平生</h1>
      <p class="subtitle">歷千年風雨，成就我人生。</p>
      <div class="hero-preview">
        <div class="hero-stage">
          ${
            state.authMode === "register"
              ? `${renderAvatar(preview, 0, "lg", { gender: state.gender })}
                 <div class="hero-caption"><strong>${previewName}</strong><span>自訂角色名 · ${state.gender === "female" ? "女" : "男"} · 起步「${outfitOf(state.gender, 0)}」</span></div>`
              : `${renderAvatar(getCharacter("male"), 0, "lg", { gender: "male" })}
                 <p class="hero-idle-note">開局自訂角色名 · 選男女樣貌 · 考核晉升後衣裝與場景漸開闊</p>`
          }
        </div>
      </div>
      <div class="tags">
        <span class="tag">盛世國風</span>
        <span class="tag">熱血角色 RPG</span>
        <span class="tag">晉升靠考核</span>
        <span class="tag">陽光登場</span>
      </div>
    </div>
    <div class="auth-panel">
      <div class="auth-tabs">
        <button type="button" data-auth="login" class="${state.authMode === "login" ? "active" : ""}">登入</button>
        <button type="button" data-auth="register" class="${state.authMode === "register" ? "active" : ""}">註冊角色</button>
      </div>
      <form id="auth-form" class="form-grid">
        <label>帳號<input name="username" required autocomplete="username" placeholder="例如：1A_陳大文" /></label>
        <label>密碼<input name="password" type="password" required autocomplete="current-password" placeholder="至少三個字" /></label>
        ${
          state.authMode === "register"
            ? `
        <label>角色名（自訂）
          <input name="heroName" id="hero-name-input" required maxlength="8" autocomplete="nickname"
            value="${escapeAttr(state.heroName)}" placeholder="例如：任平生、阿文" />
        </label>
        <label>性別
          <select name="gender" id="gender-select">
            <option value="male" ${state.gender === "male" ? "selected" : ""}>男（開局：庶民 · Lv.1 起步）</option>
            <option value="female" ${state.gender === "female" ? "selected" : ""}>女（開局：庶民 · Lv.1 起步）</option>
          </select>
        </label>
        <p class="muted" style="margin:0;font-size:.88rem">已取消歷史人物原型——只選男女樣貌，角色名完全自訂。</p>`
            : ""
        }
        <p class="form-error" id="auth-error"></p>
        <button class="btn btn-wide" type="submit">${state.authMode === "login" ? "⚔️ 進入任平生" : "🏯 創角出發"}</button>
      </form>
    </div>
  </section>`;
}

function escapeAttr(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function rememberAuthDraft() {
  const hero = app.querySelector("#hero-name-input");
  if (hero) state.heroName = hero.value;
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
      state.gender = e.target.value;
      render();
    });
  }
  app.querySelector("#hero-name-input")?.addEventListener("input", (e) => {
    state.heroName = e.target.value;
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
        registerUser({
          username: fd.get("username"),
          password: fd.get("password"),
          gender: state.gender,
          heroName: fd.get("heroName"),
        });
        state.heroName = "";
      }
      state.view = "home";
      render();
      toast("歡迎踏上任平生——小升級靠努力，大晉升靠實力");
    } catch (ex) {
      err.textContent = ex.message;
    }
  });
}

/* ========== Shell ========== */
function renderShell(user) {
  const char = getCharacter(user.gender, user.characterId);
  const snap = userSnapshot(user);
  const idn = snap.identity;
  const main =
    state.view === "home"
      ? renderJourneyHome(user, char)
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
                    : state.view === "teacher"
                      ? renderTeacherPage()
                      : state.view === "practice"
                        ? renderPractice()
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
    ["practice", "練習", "ico-practice"],
    ["games", "遊戲", "ico-game"],
    ["teacher", "老師", "ico-teacher"],
  ];

  return `
  <div class="app-shell paper-shell">
    <header class="topbar">
      <div class="player-badge">
        <div class="avatar-ring">${renderAvatar(char, idn.id, "sm", { gender: user.gender })}</div>
        <div class="player-meta">
          <strong>${heroDisplayName(user, char)} · ${snap.identityName}</strong>
          <span>${user.username}　Lv.${snap.level.level}　XP ${user.xp}</span>
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
      state.view = btn.dataset.goto;
      render();
    });
  });

  bindJourney(user, journeyCtx());
  if (state.view === "teacher") bindTeacher({ render, toast });

  if (state.view === "practice") bindPractice();
  if (state.view === "wordwall") bindWordwall();
  if (state.view === "timeline") bindTimeline();
  if (state.view === "dialogue") bindDialogue();
  if (state.view === "shizhan") bindShizhan(user, char);
}

function renderHome(user, char) {
  return renderJourneyHome(user, char);
}

function renderProfile(user, char, snap) {
  const order = buildPromotionOrder(user);
  const name = heroDisplayName(user, char);
  return `
  <section class="panel-paper profile-panel">
    <div class="profile-hero">
      ${renderAvatar(char, snap.identity.id, "lg", { gender: user.gender })}
      <div>
        <h2>${name}</h2>
        <p class="lead">身份「${snap.identityName}」· Lv.${snap.level.level} · 衣裝「${snap.outfit}」。${snap.identity.desc}</p>
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

/* ========== Practice ========== */
function filteredList(mode) {
  const list = QUESTIONS[mode] || [];
  if (state.practice.grade === "全部") return list;
  return list.filter((q) => q.grade === state.practice.grade || (q.grade || "").includes(state.practice.grade));
}

function renderPractice() {
  const mode = state.practice.mode;
  const list = filteredList(mode);
  if (!list.length) {
    return `<section class="panel"><h2>題目練習</h2><p class="lead">此篩選暫無題目。</p></section>`;
  }
  if (state.practice.index >= list.length) state.practice.index = 0;
  const q = list[state.practice.index];

  let body = "";
  if (mode === "mc") {
    body = `
      <div class="question-box" id="qbox">
        <div class="q-meta">${q.grade} · ${q.topic} · ${state.practice.index + 1}/${list.length}</div>
        <div class="q-text">${q.q}</div>
        <div class="options">
          ${q.options.map((o, i) => `<button type="button" class="option" data-mc="${i}">${String.fromCharCode(65 + i)}. ${o}</button>`).join("")}
        </div>
        <div class="feedback hidden" id="feedback"></div>
      </div>`;
  } else if (mode === "fill") {
    body = `
      <div class="question-box">
        <div class="q-meta">${q.grade} · ${q.topic} · ${state.practice.index + 1}/${list.length}</div>
        <div class="q-text">${q.q}</div>
        <p style="font-size:.85rem;opacity:.7">提示：${q.hint || "——"}</p>
        <div class="fill-row">
          <input id="fill-input" placeholder="輸入答案" autocomplete="off" />
          <button class="btn" type="button" id="fill-submit">提交</button>
        </div>
        <div class="feedback hidden" id="feedback"></div>
      </div>`;
  } else {
    const matchKey = `${q.id}-${state.practice.index}-${state.practice.grade}`;
    if (state.match.key !== matchKey) {
      state.match = {
        key: matchKey,
        selectedLeft: null,
        selectedRight: null,
        solved: new Set(),
        pairs: q.pairs,
        rights: shuffle(q.pairs.map((p) => p.right)),
      };
    }
    const { rights, solved, pairs } = state.match;
    body = `
      <div class="question-box">
        <div class="q-meta">${q.grade} · ${q.topic} · 配對全部正確可獲經驗</div>
        <div class="q-text">將左欄與右欄正確配對</div>
        <div class="match-board">
          <div class="match-col" id="match-left">
            ${pairs
              .map(
                (p, i) =>
                  `<button type="button" class="match-item ${solved.has(i) ? "done" : ""}" data-left="${i}">${p.left}</button>`
              )
              .join("")}
          </div>
          <div class="match-col" id="match-right">
            ${rights
              .map((r, i) => {
                const leftIdx = pairs.findIndex((p) => p.right === r);
                const done = solved.has(leftIdx);
                return `<button type="button" class="match-item ${done ? "done" : ""}" data-right="${i}" data-val="${r}">${r}</button>`;
              })
              .join("")}
          </div>
        </div>
        <div class="feedback" id="feedback">已配對 ${solved.size}／${pairs.length}</div>
      </div>`;
  }

  return `
  <section class="panel">
    <h2>題目練習</h2>
    <p class="lead">依齡記／初中中史課程主題自擬題目，中等難度。答對可獲經驗升級。</p>
    <div class="toolbar">
      ${["mc|選擇題", "fill|填充題", "match|配對題"]
        .map((s) => {
          const [id, label] = s.split("|");
          return `<button type="button" class="chip ${mode === id ? "active" : ""}" data-mode="${id}">${label}</button>`;
        })
        .join("")}
      <span style="opacity:.4">|</span>
      ${["全部", "中一", "中二", "中三"]
        .map(
          (g) =>
            `<button type="button" class="chip ${state.practice.grade === g ? "active" : ""}" data-grade="${g}">${g}</button>`
        )
        .join("")}
      <button class="btn ghost" type="button" id="next-q">下一題</button>
    </div>
    ${body}
  </section>`;
}

function bindPractice() {
  app.querySelectorAll("[data-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.practice.mode = btn.dataset.mode;
      state.practice.index = 0;
      render();
    });
  });
  app.querySelectorAll("[data-grade]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.practice.grade = btn.dataset.grade;
      state.practice.index = 0;
      render();
    });
  });
  app.querySelector("#next-q")?.addEventListener("click", () => {
    const list = filteredList(state.practice.mode);
    state.practice.index = (state.practice.index + 1) % Math.max(list.length, 1);
    render();
  });

  const list = filteredList(state.practice.mode);
  const q = list[state.practice.index];
  if (!q) return;

  if (state.practice.mode === "mc") {
    app.querySelectorAll("[data-mc]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.mc);
        const options = app.querySelectorAll("[data-mc]");
        options.forEach((b) => (b.disabled = true));
        const fb = app.querySelector("#feedback");
        if (i === q.answer) {
          btn.classList.add("correct");
          fb.classList.remove("hidden");
          fb.textContent = `正確！${q.explain}`;
          reward(XP_REWARDS.mcCorrect, { correct: true, qid: q.id, keepView: true });
        } else {
          btn.classList.add("wrong");
          options[q.answer]?.classList.add("correct");
          fb.classList.remove("hidden");
          fb.textContent = `未中。正解：${q.options[q.answer]}。${q.explain}`;
          addXp(0, { wrong: true });
          refreshTopbarOnly();
        }
      });
    });
  }

  if (state.practice.mode === "fill") {
    const submit = () => {
      const input = app.querySelector("#fill-input");
      const fb = app.querySelector("#feedback");
      const ok = checkFill(q, input.value);
      fb.classList.remove("hidden");
      if (ok) {
        fb.textContent = "正確！";
        input.disabled = true;
        reward(XP_REWARDS.fillCorrect, { correct: true, qid: q.id, keepView: true });
      } else {
        fb.textContent = `未中。參考答案：${q.answers[0]}`;
        addXp(0, { wrong: true });
        refreshTopbarOnly();
        toast("再試一次，或按下一題");
      }
    };
    app.querySelector("#fill-submit")?.addEventListener("click", submit);
    app.querySelector("#fill-input")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submit();
    });
  }

  if (state.practice.mode === "match") {
    const tryMatch = () => {
      const { selectedLeft, selectedRight, pairs, rights, solved } = state.match;
      if (selectedLeft == null || selectedRight == null) return;
      const leftText = pairs[selectedLeft].left;
      const expected = pairs[selectedLeft].right;
      const got = rights[selectedRight];
      const leftBtn = app.querySelector(`[data-left="${selectedLeft}"]`);
      const rightBtn = app.querySelector(`[data-right="${selectedRight}"]`);
      if (got === expected) {
        leftBtn?.classList.add("done");
        rightBtn?.classList.add("done");
        solved.add(selectedLeft);
        reward(XP_REWARDS.matchPair, {
          correct: true,
          qid: `${q.id}-${selectedLeft}`,
          keepView: true,
        });
        app.querySelector("#feedback").textContent = `已配對 ${solved.size}／${pairs.length}`;
        if (solved.size === pairs.length) toast("本組配對全部完成！");
      } else {
        leftBtn?.classList.add("wrong");
        rightBtn?.classList.add("wrong");
        addXp(0, { wrong: true });
        setTimeout(() => {
          leftBtn?.classList.remove("wrong", "selected");
          rightBtn?.classList.remove("wrong", "selected");
        }, 450);
        toast("配對錯誤");
      }
      state.match.selectedLeft = null;
      state.match.selectedRight = null;
      app.querySelectorAll(".match-item.selected").forEach((el) => el.classList.remove("selected"));
    };

    app.querySelectorAll("[data-left]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.classList.contains("done")) return;
        app.querySelectorAll("[data-left]").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        state.match.selectedLeft = Number(btn.dataset.left);
        tryMatch();
      });
    });
    app.querySelectorAll("[data-right]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.classList.contains("done")) return;
        app.querySelectorAll("[data-right]").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        state.match.selectedRight = Number(btn.dataset.right);
        tryMatch();
      });
    });
  }
}

/* ========== Games ========== */
function renderGamesHub() {
  return `
  <section class="panel panel-paper">
    <h2>趣味關卡</h2>
    <p class="lead">挑一關挑戰吧！破關經驗比普通練習更高。</p>
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
        <div class="quest-body"><h3>時光長河</h3><p>把事件放回正確年代</p></div>
        <span class="quest-xp">+${XP_REWARDS.timelineComplete}</span>
      </article>
      <article class="quest-card tone-cinnabar" data-goto="dialogue" style="--i:4">
        <div class="quest-icon"><span class="ico ico-note" style="width:1.4em;height:1.4em"></span></div>
        <div class="quest-body"><h3>古人問答</h3><p>與名君對話，考你史識</p></div>
        <span class="quest-xp">+${XP_REWARDS.dialogueGood}</span>
      </article>
    </div>
    <h3 class="section-title" style="margin-top:1.5rem"><span>外部 Wordwall</span></h3>
    <div class="grid-cards" style="margin-top:.6rem">
      ${EXTERNAL_WORDWALL.map(
        (w) => `
        <a class="feature-card" href="${w.url}" target="_blank" rel="noopener">
          <h3>${w.title}</h3>
          <p>${w.note || w.url}</p>
        </a>`
      ).join("")}
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
    state.shizhan = createBattle(char);
    render();
  });
  app.querySelector("#shizhan-again")?.addEventListener("click", () => {
    state.shizhan = createBattle(char);
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
    reward(XP_REWARDS.shizhanWin, { correct: true, game: true });
  } else {
    reward(XP_REWARDS.shizhanLose, { game: true });
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
                reward(XP_REWARDS.wordwallRound, { correct: true, game: true, keepView: true });
              }
            } else {
              addXp(0, { wrong: true });
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
          reward(Math.round(XP_REWARDS.wordwallRound / round.questions.length) + 2, {
            correct: true,
            game: true,
          });
        } else {
          toast(`正解：${qq.options[qq.a]}`);
          addXp(0, { wrong: true });
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

function renderTimeline() {
  const set = TIMELINE_SETS.find((t) => t.id === state.timeline.setId) || TIMELINE_SETS[0];
  const years = set.items.map((i) => i.year).sort((a, b) => a - b);
  const labels = shuffle(set.items.map((i) => i.label));
  // store shuffled labels once per set
  if (state.timeline.shuffleId !== set.id) {
    state.timeline.shuffleId = set.id;
    state.timeline.labels = labels;
  }
  return `
  <section class="panel">
    <h2>人物／事件時間線</h2>
    <p class="lead">${set.title}（${set.grade}）——把正確事件配到年代。</p>
    <div class="toolbar">
      ${TIMELINE_SETS.map(
        (t) =>
          `<button type="button" class="chip ${state.timeline.setId === t.id ? "active" : ""}" data-tl="${t.id}">${t.title}</button>`
      ).join("")}
    </div>
    <div class="timeline-list" id="tl-list">
      ${years
        .map((y, idx) => {
          const item = set.items.find((it) => it.year === y);
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
    <div style="margin-top:1rem"><button class="btn" type="button" id="tl-check">核對時間線</button></div>
    <div class="feedback hidden" id="feedback"></div>
  </section>`;
}

function bindTimeline() {
  app.querySelectorAll("[data-tl]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.timeline.setId = btn.dataset.tl;
      state.timeline.shuffleId = null;
      render();
    });
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
    if (ok === selects.length) {
      reward(XP_REWARDS.timelineComplete, { correct: true, game: true });
    } else {
      addXp(0, { wrong: true });
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
    <p class="lead">選擇最符合史實或合理史觀的回應。</p>
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
             <button class="btn" type="button" id="dlg-next">${state.dialogue.step + 1 < d.steps.length ? "繼續對話" : "完成並換人"}</button>`
          : `<div class="options">${step.choices
              .map(
                (c, i) =>
                  `<button type="button" class="option" data-choice="${i}">${c.text}</button>`
              )
              .join("")}</div>`
      }
    </div>
  </section>`;
}

function bindDialogue() {
  app.querySelectorAll("[data-dlg]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.dialogue = { id: btn.dataset.dlg, step: 0, replied: false };
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
      if (choice.good) reward(XP_REWARDS.dialogueGood, { correct: true, game: true });
      else {
        addXp(0, { wrong: true });
        toast("此回應較欠妥，聽聽古人怎麼說");
      }
      render();
    });
  });
  app.querySelector("#dlg-next")?.addEventListener("click", () => {
    const d = DIALOGUES.find((x) => x.id === state.dialogue.id);
    if (state.dialogue.step + 1 < d.steps.length) {
      state.dialogue.step += 1;
      state.dialogue.replied = false;
    } else {
      const idx = DIALOGUES.findIndex((x) => x.id === d.id);
      const next = DIALOGUES[(idx + 1) % DIALOGUES.length];
      state.dialogue = { id: next.id, step: 0, replied: false };
      toast("對話完成！");
    }
    render();
  });
}

function renderVideos() {
  return `
  <section class="panel">
    <h2>影片學習區</h2>
    <p class="lead">觀看教育影片鞏固知識。老師可在 <code>js/data/videos.js</code> 新增或替換 YouTube 影片 ID。</p>
    <div class="video-grid">
      ${VIDEOS.map(
        (v) => `
        <article class="video-card">
          <iframe src="https://www.youtube.com/embed/${v.youtubeId}" title="${v.title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>
          <div class="body">
            <h3>${v.title}</h3>
            <p>${v.grade} · ${v.topic}<br>${v.desc}</p>
          </div>
        </article>`
      ).join("")}
    </div>
  </section>`;
}

render();
