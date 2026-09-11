import { CHARACTERS, getCharacter } from "./data/characters.js";
import { QUESTIONS, checkFill } from "./data/questions.js";
import { RANKS, XP_REWARDS, rankFromXp } from "./data/ranks.js";
import { DIALOGUES } from "./data/dialogues.js";
import { TIMELINE_SETS, WORDWALL_ROUNDS } from "./data/games.js";
import { VIDEOS, EXTERNAL_WORDWALL } from "./data/videos.js";
import {
  getCurrentUser,
  registerUser,
  loginUser,
  clearSession,
  addXp,
} from "./storage.js";

const app = document.getElementById("app");
let toastTimer = null;
let state = {
  view: "home",
  authMode: "login",
  gender: "male",
  characterId: CHARACTERS.male[0].id,
  practice: { mode: "mc", grade: "全部", index: 0 },
  match: { selectedLeft: null, selectedRight: null, solved: new Set() },
  flip: { cards: [], flipped: [], matched: new Set(), lock: false },
  timeline: { setId: TIMELINE_SETS[0].id },
  dialogue: { id: DIALOGUES[0].id, step: 0 },
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
  const prevRank = before ? rankFromXp(before.gender, before.xp).current.id : 0;
  let bonus = amount;
  if (meta.correct && before?.streak >= 2) bonus += XP_REWARDS.streakBonus;
  addXp(bonus, meta);
  const after = getCurrentUser();
  const nextRank = rankFromXp(after.gender, after.xp).current;
  if (nextRank.id > prevRank) {
    toast(`晉升為「${nextRank.name}」！+${bonus} 經驗`);
  } else {
    toast(`+${bonus} 經驗`);
  }
  if (!meta.keepView) render();
  else refreshTopbarOnly();
}

function refreshTopbarOnly() {
  const user = getCurrentUser();
  if (!user) return;
  const char = getCharacter(user.gender, user.characterId);
  const { current, next, progress } = rankFromXp(user.gender, user.xp);
  const meta = app.querySelector(".player-meta");
  if (!meta) return;
  meta.innerHTML = `
    <strong>${char?.name || "行者"} · ${current.name}</strong>
    <span>${user.username}　經驗 ${user.xp}${next ? `／下一階 ${next.xp}` : "（已登頂）"}</span>
    <div class="xp-bar"><i style="width:${progress}%"></i></div>`;
}

function render() {
  const user = getCurrentUser();
  if (!user) {
    app.innerHTML = renderAuth();
    bindAuth();
    return;
  }
  app.innerHTML = renderShell(user);
  bindShell(user);
}

/* ========== Auth ========== */
function renderAuth() {
  const list = CHARACTERS[state.gender];
  return `
  <section class="hero-screen">
    <div class="brand-block">
      <h1>萬鈞伯裘<br>皇朝之路</h1>
      <p class="subtitle">初中中史科角色成長遊戲：答題升級，從奴隸／婢女走到皇帝／女皇。每個帳號都是獨立角色。</p>
      <div class="tags">
        <span class="tag">選擇題 · 填充 · 配對</span>
        <span class="tag">Wordwall 風小遊戲</span>
        <span class="tag">時間線 · 與古人對話</span>
        <span class="tag">影片學習區</span>
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
        <label>性別
          <select name="gender" id="gender-select">
            <option value="male" ${state.gender === "male" ? "selected" : ""}>男（奴隸→皇帝）</option>
            <option value="female" ${state.gender === "female" ? "selected" : ""}>女（婢女→女皇）</option>
          </select>
        </label>
        <div>
          <div style="font-weight:600;margin-bottom:.4rem;font-size:.9rem">選擇古代人物原型</div>
          <div class="char-pick" id="char-pick">
            ${list
              .map(
                (c) => `
              <button type="button" class="char-card ${state.characterId === c.id ? "selected" : ""}" data-char="${c.id}" style="border-color:${state.characterId === c.id ? c.color : ""}">
                <div class="emoji">${c.emoji}</div>
                <div class="name">${c.name}</div>
                <div class="era">${c.era}</div>
              </button>`
              )
              .join("")}
          </div>
        </div>`
            : ""
        }
        <p class="form-error" id="auth-error"></p>
        <button class="btn" type="submit">${state.authMode === "login" ? "進入皇朝" : "創角出發"}</button>
      </form>
    </div>
  </section>`;
}

function bindAuth() {
  app.querySelectorAll("[data-auth]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.authMode = btn.dataset.auth;
      if (state.authMode === "register") {
        state.characterId = CHARACTERS[state.gender][0].id;
      }
      render();
    });
  });
  const gender = app.querySelector("#gender-select");
  if (gender) {
    gender.addEventListener("change", (e) => {
      state.gender = e.target.value;
      state.characterId = CHARACTERS[state.gender][0].id;
      render();
    });
  }
  app.querySelectorAll("[data-char]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.characterId = btn.dataset.char;
      render();
    });
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
          characterId: state.characterId,
        });
      }
      state.view = "home";
      render();
      toast("歡迎踏上皇朝之路");
    } catch (ex) {
      err.textContent = ex.message;
    }
  });
}

/* ========== Shell ========== */
function renderShell(user) {
  const char = getCharacter(user.gender, user.characterId);
  const { current, next, progress } = rankFromXp(user.gender, user.xp);
  const ranks = RANKS[user.gender];
  return `
  <div class="app-shell">
    <header class="topbar">
      <div class="player-badge">
        <div class="avatar-ring" style="background:${char?.color || current.color}">${char?.emoji || "🏯"}</div>
        <div class="player-meta">
          <strong>${char?.name || "行者"} · ${current.name}</strong>
          <span>${user.username}　經驗 ${user.xp}${next ? `／下一階 ${next.xp}` : "（已登頂）"}</span>
          <div class="xp-bar"><i style="width:${progress}%"></i></div>
        </div>
      </div>
      <div style="display:flex;gap:.5rem;align-items:center">
        <button class="btn ghost" id="logout-btn" type="button">登出</button>
      </div>
    </header>
    <nav class="nav">
      ${[
        ["home", "主殿"],
        ["practice", "題目練習"],
        ["games", "小遊戲"],
        ["videos", "影片區"],
        ["profile", "角色之路"],
      ]
        .map(
          ([id, label]) =>
            `<button type="button" data-nav="${id}" class="${state.view === id ? "active" : ""}">${label}</button>`
        )
        .join("")}
    </nav>
    <main id="main">
      ${
        state.view === "home"
          ? renderHome(user, char, current)
          : state.view === "practice"
            ? renderPractice()
            : state.view === "games"
              ? renderGamesHub()
              : state.view === "videos"
                ? renderVideos()
                : state.view === "profile"
                  ? renderProfile(user, ranks, current)
                  : state.view === "wordwall"
                    ? renderWordwall()
                    : state.view === "timeline"
                      ? renderTimeline()
                      : state.view === "dialogue"
                        ? renderDialogue()
                        : ""
      }
    </main>
  </div>`;
}

function bindShell(user) {
  app.querySelector("#logout-btn")?.addEventListener("click", () => {
    clearSession();
    render();
  });
  app.querySelectorAll("[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.view = btn.dataset.nav;
      render();
    });
  });
  app.querySelectorAll("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.view = btn.dataset.goto;
      render();
    });
  });

  if (state.view === "practice") bindPractice();
  if (state.view === "wordwall") bindWordwall();
  if (state.view === "timeline") bindTimeline();
  if (state.view === "dialogue") bindDialogue();
}

function renderHome(user, char, rank) {
  return `
  <section class="panel">
    <h2>萬鈞伯裘—皇朝之路</h2>
    <p class="lead">你化身${char?.name}（${char?.era}）：「${char?.motto}」現職${rank.name}。答岩題目、完成挑戰即可升級——難度中等，需持續練習方可達帝位。</p>
    <div class="grid-cards">
      <article class="feature-card" data-goto="practice">
        <div style="font-size:1.6rem">📝</div>
        <h3>題目練習</h3>
        <p>選擇題、填充題、配對題，涵蓋中一至中三中史重點。</p>
      </article>
      <article class="feature-card" data-goto="wordwall">
        <div style="font-size:1.6rem">🎯</div>
        <h3>Wordwall 風挑戰</h3>
        <p>翻牌配對與限時問答，練反應與史識。</p>
      </article>
      <article class="feature-card" data-goto="timeline">
        <div style="font-size:1.6rem">⏳</div>
        <h3>人物時間線</h3>
        <p>把事件拖回正確年代，理清歷史順序。</p>
      </article>
      <article class="feature-card" data-goto="dialogue">
        <div style="font-size:1.6rem">💬</div>
        <h3>與古人對話</h3>
        <p>與秦始皇、太宗、太祖等問答，考你史識與判斷。</p>
      </article>
      <article class="feature-card" data-goto="videos">
        <div style="font-size:1.6rem">🎬</div>
        <h3>影片學習區</h3>
        <p>觀看教育影片，鞏固課堂知識。</p>
      </article>
      <article class="feature-card" data-goto="profile">
        <div style="font-size:1.6rem">🏯</div>
        <h3>角色之路</h3>
        <p>查看等級階梯、答題統計與升級條件。</p>
      </article>
    </div>
  </section>`;
}

function renderProfile(user, ranks, current) {
  return `
  <section class="panel">
    <h2>角色之路</h2>
    <p class="lead">${current.desc}　連勝 ${user.streak || 0} 題可獲額外經驗。</p>
    <div class="rank-road">
      ${ranks
        .map(
          (r) =>
            `<span class="rank-pill ${user.xp >= r.xp ? "reached" : ""}" style="${user.xp >= r.xp ? `background:${r.color}` : ""}">${r.name}<br><small>${r.xp}XP</small></span>`
        )
        .join("")}
    </div>
    <div class="stat-row">
      <div class="stat">答對 ${user.stats?.correct || 0}</div>
      <div class="stat">答錯 ${user.stats?.wrong || 0}</div>
      <div class="stat">小遊戲 ${user.stats?.games || 0}</div>
      <div class="stat">總經驗 ${user.xp}</div>
    </div>
    <p class="lead" style="margin-top:1rem">升級提示：選擇題 +${XP_REWARDS.mcCorrect}、填充 +${XP_REWARDS.fillCorrect}、配對每對 +${XP_REWARDS.matchPair}；小遊戲獎勵更高。中等難度下，大約需完成多輪練習才能登頂。</p>
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
  <section class="panel">
    <h2>小遊戲大廳</h2>
    <p class="lead">Wordwall 風格挑戰、時間線排序、與古人對話——完成可獲較高經驗。</p>
    <div class="grid-cards">
      <article class="feature-card" data-goto="wordwall"><div style="font-size:1.6rem">🎯</div><h3>Wordwall 風</h3><p>翻牌配對、限時問答</p></article>
      <article class="feature-card" data-goto="timeline"><div style="font-size:1.6rem">⏳</div><h3>時間線</h3><p>人物／事件與年代配對</p></article>
      <article class="feature-card" data-goto="dialogue"><div style="font-size:1.6rem">💬</div><h3>與古人對話</h3><p>選擇正確回應</p></article>
    </div>
    <h3 style="margin-top:1.5rem;font-family:var(--font-display)">外部 Wordwall</h3>
    <div class="grid-cards" style="margin-top:.6rem">
      ${EXTERNAL_WORDWALL.map(
        (w) => `
        <a class="feature-card" href="${w.url}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit">
          <h3>${w.title}</h3>
          <p>${w.note || w.url}</p>
        </a>`
      ).join("")}
    </div>
  </section>`;
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
