/**
 * 《任平生》主介面：行旅首頁、歷史長卷、晉升殿、待考札記、史冊
 */
import { CHAPTERS, chapterList } from "./data/chapters.js";
import { XP_REWARDS } from "./data/levels.js";
import { renderAvatar } from "./avatar.js";
import {
  userSnapshot,
  buildPromotionOrder,
  completeStage,
  recordLearning,
  markNoteMastered,
  scoreTrial,
  flattenTrialParts,
  applyPromotion,
  openWeakRemedials,
  getTrialData,
  IDENTITY_DISCLAIMER,
  identityDisplayName,
  getIdentity,
} from "./progress.js";
import { updateUser, addXp, pushRecent } from "./storage.js";

export function renderJourneyHome(user, char, ctx) {
  const snap = userSnapshot(user);
  const order = buildPromotionOrder(user);
  const ch = CHAPTERS.ch1_escape;
  const chProg = user.progress?.chapters?.ch1_escape || { stages: {} };
  const stages = ch.stages || [];
  const nextStage = stages.find((s) => !chProg.stages?.[s.id]) || stages[stages.length - 1];
  const dots = stages
    .map((s) => {
      const done = !!chProg.stages?.[s.id];
      const cur = nextStage?.id === s.id && !chProg.done;
      if (done) return `<span class="route-dot done" title="${s.title}">●</span>`;
      if (cur) return `<span class="route-dot current" title="${s.title}">◉</span>`;
      return `<span class="route-dot locked" title="${s.title}">○</span>`;
    })
    .join('<span class="route-line">──</span>');

  const checklist = order.items
    .slice(0, 6)
    .map((i) => {
      const mark = i.ok ? "✓" : i.locked ? "○" : "✗";
      const cls = i.ok ? "ok" : i.locked ? "lock" : "no";
      return `<li class="${cls}"><span>${mark}</span>${i.label}</li>`;
    })
    .join("");

  const recent = (user.progress?.recent || [])
    .slice(0, 3)
    .map((t) => `<span class="chip-soft">${t}</span>`)
    .join("") || `<span class="chip-soft">尚未有紀錄——從第一章開始</span>`;

  return `
  <section class="dash">
    <aside class="dash-nav panel-paper">
      <p class="brand-mini">《任平生》</p>
      <button type="button" class="side-link active" data-nav="home">行旅首頁</button>
      <button type="button" class="side-link" data-nav="scroll">歷史長卷</button>
      <button type="button" class="side-link" data-nav="promote">晉升試煉</button>
      <button type="button" class="side-link" data-nav="notes">待考札記</button>
      <button type="button" class="side-link" data-nav="practice">藏書閣·練習</button>
      <button type="button" class="side-link" data-nav="games">趣味關卡</button>
      <button type="button" class="side-link" data-nav="chronicle">我的史冊</button>
      <p class="side-note">${IDENTITY_DISCLAIMER.slice(0, 42)}…</p>
    </aside>

    <div class="dash-main panel-paper">
      <p class="eyebrow ink-red">${ch.arc}</p>
      <h2>${ch.title}</h2>
      <p class="lead">${ch.blurb}</p>
      <div class="route-map" aria-label="關卡路線">${dots}</div>
      <div class="task-card">
        <p class="task-kicker">當前任務</p>
        <h3>${nextStage?.icon || "🚩"} ${nextStage?.title || "本章已完成"}</h3>
        <p>${nextStage?.goal || "可前往晉升殿查看脫籍考核。"}</p>
        <p class="muted">預計 ${nextStage?.minutes || "—"} 分鐘${nextStage?.difficulty ? ` · ${nextStage.difficulty}` : ""}</p>
        <button type="button" class="btn" data-goto="scroll">${chProg.done ? "重溫長卷" : "繼續旅程"}</button>
      </div>
    </div>

    <aside class="dash-hero panel-paper">
      <div class="hero-card">
        ${renderAvatar(char, snap.identity.id, "lg")}
        <h3>${char?.name || "行者"}</h3>
        <p class="id-line">身份：<strong style="color:${snap.identity.color}">${snap.identityName}</strong></p>
        <p class="id-line">等級：Lv.${snap.level.level}　衣裝：${snap.outfit}</p>
        <div class="xp-bar xl"><i style="width:${snap.level.progress}%"></i></div>
        <p class="muted">經驗 ${user.xp}${snap.level.nextXp != null ? `／下一級 ${snap.level.nextXp}` : ""}</p>
      </div>
      <div class="edict">
        <h4>晉升令${order.next ? ` → ${identityDisplayName(order.next, user.gender)}` : ""}</h4>
        <ul class="edict-list">${checklist}</ul>
        <button type="button" class="btn ${order.canChallenge ? "" : "ghost"}" data-goto="promote">
          ${order.canChallenge ? "前往晉升試煉" : "查看晉升條件"}
        </button>
      </div>
    </aside>

    <footer class="dash-foot panel-paper">
      <span>最新成果</span>
      <div class="foot-chips">${recent}</div>
    </footer>
  </section>`;
}

export function renderScroll(user) {
  const list = chapterList();
  const p = user.progress?.chapters || {};
  return `
  <section class="panel-paper scroll-view">
    <h2>歷史長卷</h2>
    <p class="lead">課程章節可隨老師進度學習；角色身份晉升另計，唔會因為未升官而鎖死課堂課題。</p>
    <div class="chapter-list">
      ${list
        .map((ch, idx) => {
          const st = p[ch.id] || {};
          const hasStages = (ch.stages || []).length > 0;
          const doneN = Object.keys(st.stages || {}).length;
          const total = (ch.stages || []).length || 0;
          return `
          <article class="chapter-card ${hasStages ? "" : "dim"}" data-open-chapter="${ch.id}">
            <div class="ch-arc">${ch.arc}</div>
            <h3>${ch.title}</h3>
            <p>${ch.blurb}</p>
            <p class="muted">${hasStages ? `進度 ${doneN}/${total}` : "關卡製作中（可先用練習／遊戲）"}</p>
            ${idx === 0 || hasStages ? `<button type="button" class="btn ghost" data-open-chapter="${ch.id}">進入</button>` : ""}
          </article>`;
        })
        .join("")}
    </div>
  </section>`;
}

export function renderChapterDetail(user, chapterId, stageId) {
  const ch = CHAPTERS[chapterId];
  if (!ch) return `<section class="panel-paper"><p>找不到章節</p></section>`;
  const st = user.progress?.chapters?.[chapterId] || { stages: {} };
  if (!stageId) {
    return `
    <section class="panel-paper">
      <button type="button" class="btn ghost" data-nav="scroll">← 返回長卷</button>
      <p class="eyebrow ink-red">${ch.arc}</p>
      <h2>${ch.title}</h2>
      <p class="lead">${ch.blurb}</p>
      <div class="stage-grid">
        ${(ch.stages || [])
          .map((s, i) => {
            const prevDone = i === 0 || !!st.stages?.[(ch.stages[i - 1] || {}).id];
            const done = !!st.stages?.[s.id];
            const locked = !prevDone && !done;
            return `
            <button type="button" class="stage-card ${done ? "done" : ""} ${locked ? "locked" : ""}"
              data-enter-stage="${ch.id}:${s.id}" ${locked ? "disabled" : ""}>
              <span class="ic">${s.icon}</span>
              <strong>${s.title}</strong>
              <span>${s.minutes || "—"} 分鐘</span>
              <span class="goal">${s.goal}</span>
              ${locked ? "<em>先完成上一關</em>" : done ? "<em>已修復</em>" : "<em>可進入</em>"}
            </button>`;
          })
          .join("")}
      </div>
    </section>`;
  }
  const stage = (ch.stages || []).find((s) => s.id === stageId);
  if (!stage) return renderChapterDetail(user, chapterId, null);
  return renderStagePlay(user, ch, stage);
}

function renderStagePlay(user, ch, stage) {
  if (stage.kind === "story") {
    return `
    <section class="panel-paper stage-play">
      <p class="eyebrow">${ch.title}</p>
      <h2>${stage.icon} ${stage.title}</h2>
      <div class="story-box">${stage.body}</div>
      <p class="lead">學習目標：${stage.goal}</p>
      <button type="button" class="btn" data-finish-stage="${ch.id}:${stage.id}">明白了，繼續</button>
    </section>`;
  }
  if (stage.kind === "interact" && stage.gotoGame) {
    return `
    <section class="panel-paper stage-play">
      <h2>${stage.icon} ${stage.title}</h2>
      <p class="lead">${stage.goal}</p>
      <p>此關連接到「時光長河」互動。完成一局後返回可標記進度。</p>
      <button type="button" class="btn" data-goto="${stage.gotoGame}">開始時序長廊</button>
      <button type="button" class="btn ghost" data-finish-stage="${ch.id}:${stage.id}">我已完成，標記本關</button>
    </section>`;
  }
  if (stage.kind === "boss" && stage.boss) {
    return `
    <section class="panel-paper stage-play" id="boss-stage" data-chapter="${ch.id}" data-stage="${stage.id}">
      <h2>${stage.icon} ${stage.title}</h2>
      <p class="lead">Boss 是一本被改亂的史書——辨錯、修正、舉證。</p>
      <div class="boss-progress"><i style="width:0%" id="boss-bar"></i></div>
      <div id="boss-body"></div>
    </section>`;
  }
  // basic / source questions
  const qs = stage.questions || [];
  return `
  <section class="panel-paper stage-play" id="stage-quiz" data-chapter="${ch.id}" data-stage="${stage.id}">
    <div class="q-top">
      <span>${ch.title} · ${stage.title}</span>
      <span id="sq-progress">進度 1 / ${qs.length}</span>
    </div>
    <div id="sq-body"></div>
  </section>`;
}

export function bindJourney(user, ctx) {
  const { render, toast, state, reward } = ctx;

  appClick("[data-open-chapter]", (btn) => {
    state.scrollChapter = btn.dataset.openChapter;
    state.scrollStage = null;
    state.view = "chapter";
    render();
  });

  appClick("[data-enter-stage]", (btn) => {
    const [cid, sid] = btn.dataset.enterStage.split(":");
    state.scrollChapter = cid;
    state.scrollStage = sid;
    state.view = "chapter";
    state.stageQuiz = { index: 0, correct: 0 };
    state.bossStep = 0;
    render();
    // after render, bind quiz/boss
    setTimeout(() => {
      bindStageRuntime(user, ctx);
    }, 0);
  });

  appClick("[data-finish-stage]", (btn) => {
    const [cid, sid] = btn.dataset.finishStage.split(":");
    updateUser((u) => {
      completeStage(u, cid, sid);
    });
    pushRecent(`完成 ${CHAPTERS[cid]?.title || ""} · ${sid}`);
    addXp(XP_REWARDS.chapterBonus || 20, { correct: true });
    toast("本關已記入長卷");
    state.scrollStage = null;
    state.view = "chapter";
    render();
  });

  bindStageRuntime(user, ctx);
  bindPromote(user, ctx);
  bindNotes(user, ctx);
}

function bindStageRuntime(user, ctx) {
  const { state, render, toast, reward } = ctx;
  const quizRoot = document.getElementById("stage-quiz");
  if (quizRoot) {
    const ch = CHAPTERS[quizRoot.dataset.chapter];
    const stage = ch.stages.find((s) => s.id === quizRoot.dataset.stage);
    const qs = stage.questions || [];
    state.stageQuiz = state.stageQuiz || { index: 0, correct: 0 };
    paintQuiz(qs, state, ch, stage, ctx);
  }
  const bossRoot = document.getElementById("boss-stage");
  if (bossRoot) {
    paintBoss(bossRoot, ctx);
  }
}

function paintQuiz(qs, state, ch, stage, ctx) {
  const { render, toast } = ctx;
  const i = state.stageQuiz.index;
  const q = qs[i];
  const body = document.getElementById("sq-body");
  const prog = document.getElementById("sq-progress");
  if (!body || !q) return;
  prog.textContent = `進度 ${i + 1} / ${qs.length}`;
  body.innerHTML = `
    <div class="mission-box"><strong>【任務】</strong>${stage.goal}</div>
    <div class="q-text">${q.q}</div>
    <div class="options">
      ${q.options.map((o, idx) => `<button type="button" class="option" data-sq="${idx}">${String.fromCharCode(65 + idx)}. ${o}</button>`).join("")}
    </div>
    <div class="feedback hidden" id="sq-fb"></div>
    <div class="row-actions">
      <button type="button" class="btn ghost" id="sq-hint">查看提示</button>
    </div>`;
  document.getElementById("sq-hint")?.addEventListener("click", () => {
    toast(q.misconception || q.explain || "先排除明顯不合理的選項");
  });
  body.querySelectorAll("[data-sq]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pick = Number(btn.dataset.sq);
      const ok = pick === q.answer;
      updateUser((u) => {
        recordLearning(u, {
          topic: q.topic,
          skill: q.skill,
          correct: ok,
          qid: q.id,
          qText: q.q,
          chapterId: ch.id,
        });
      });
      const fb = document.getElementById("sq-fb");
      fb.classList.remove("hidden");
      fb.innerHTML = ok
        ? `<strong>正確。</strong> ${q.explain || ""}<br>下一步：繼續下一題。`
        : `<strong>未正確。</strong> ${q.explain || ""}<br>常見誤解：${q.misconception || "再讀一次材料／選項。"}`;
      if (ok) {
        state.stageQuiz.correct++;
        ctx.reward(XP_REWARDS.mcCorrect, { correct: true, qid: q.id, keepView: true });
      } else {
        ctx.reward(0, { wrong: true, keepView: true });
      }
      body.querySelectorAll("[data-sq]").forEach((b) => (b.disabled = true));
      setTimeout(() => {
        if (i + 1 >= qs.length) {
          updateUser((u) => completeStage(u, ch.id, stage.id));
          pushRecent(`修復史頁：${stage.title}`);
          addXp(XP_REWARDS.chapterBonus, { correct: true });
          toast("本關完成！史頁修復進度＋1");
          state.scrollStage = null;
          state.view = "chapter";
          ctx.render();
        } else {
          state.stageQuiz.index++;
          paintQuiz(qs, state, ch, stage, ctx);
        }
      }, 900);
    });
  });
}

function paintBoss(root, ctx) {
  const { state, toast, render } = ctx;
  const ch = CHAPTERS[root.dataset.chapter];
  const stage = ch.stages.find((s) => s.id === root.dataset.stage);
  const steps = stage.boss.steps;
  state.bossStep = state.bossStep || 0;
  const i = state.bossStep;
  const step = steps[i];
  const bar = document.getElementById("boss-bar");
  if (bar) bar.style.width = `${(i / steps.length) * 100}%`;
  const body = document.getElementById("boss-body");
  if (!step || !body) return;
  body.innerHTML = `
    <p class="eyebrow">步驟 ${i + 1}/${steps.length} · ${step.title}</p>
    <div class="q-text">${step.q}</div>
    <div class="options">
      ${step.options.map((o, idx) => `<button type="button" class="option" data-boss="${idx}">${o}</button>`).join("")}
    </div>`;
  body.querySelectorAll("[data-boss]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const ok = Number(btn.dataset.boss) === step.answer;
      updateUser((u) =>
        recordLearning(u, { skill: step.skill, correct: ok, qid: `boss-${step.id}`, qText: step.q, chapterId: ch.id })
      );
      if (!ok) {
        toast("未中——再想一次（練習可重試）");
        return;
      }
      ctx.reward(XP_REWARDS.mcCorrect, { correct: true, qid: `boss-${step.id}`, keepView: true });
      state.bossStep++;
      if (state.bossStep >= steps.length) {
        if (bar) bar.style.width = "100%";
        updateUser((u) => completeStage(u, ch.id, stage.id));
        pushRecent("擊敗錯史·第一章試煉");
        addXp(XP_REWARDS.chapterBonus, { correct: true });
        toast("史頁修復完成！");
        state.scrollStage = null;
        state.view = "chapter";
        render();
      } else {
        paintBoss(root, ctx);
      }
    });
  });
}

export function renderPromote(user, char) {
  const order = buildPromotionOrder(user);
  const snap = userSnapshot(user);
  const list = order.items
    .map((i) => {
      const mark = i.ok ? "✓" : i.locked ? "○" : "✗";
      return `<li class="${i.ok ? "ok" : i.locked ? "lock" : "no"}"><span>${mark}</span><div>${i.label}</div></li>`;
    })
    .join("");
  const rem = openWeakRemedials(user);

  return `
  <section class="panel-paper promote-view">
    <p class="eyebrow ink-gold">晉升殿</p>
    <h2>經驗解鎖資格 · 考核決定晉升</h2>
    <p class="lead disclaimer">${IDENTITY_DISCLAIMER}</p>
    <div class="promote-layout">
      <div class="promote-silhouette">
        ${renderAvatar(char, snap.identity.id, "lg")}
        <p>當前：<strong>${snap.identityName}</strong> · Lv.${snap.level.level}</p>
        <p class="next-shadow">下一身份：${order.next ? identityDisplayName(order.next, user.gender) : "—"}</p>
      </div>
      <div class="edict big">
        <h3>【晉升令】</h3>
        <ul class="edict-list">${list}</ul>
        <div class="row-actions">
          <button type="button" class="btn ghost" data-goto="notes">前往補強</button>
          <button type="button" class="btn" id="btn-trial" ${order.canChallenge ? "" : "disabled"}>
            ${order.canChallenge ? `挑戰：${order.gate.label}` : order.trialPassed ? "試煉已通過，確認晉升" : "挑戰晉升：未解鎖"}
          </button>
        </div>
        ${
          order.trialPassed && order.next
            ? `<button type="button" class="btn gold" id="btn-confirm-promote">確認晉升為「${identityDisplayName(order.next, user.gender)}」</button>`
            : ""
        }
        ${
          rem.length
            ? `<div class="rem-box"><p>建議補強：</p>${rem
                .map((r) => `<button type="button" class="chip" data-goto="${r.goto}">${r.title}</button>`)
                .join("")}</div>`
            : ""
        }
      </div>
    </div>
    <div id="trial-panel" class="hidden"></div>
  </section>`;
}

function bindPromote(user, ctx) {
  const { state, render, toast } = ctx;
  document.getElementById("btn-confirm-promote")?.addEventListener("click", () => {
    let name = "";
    updateUser((u) => {
      const r = applyPromotion(u);
      if (r.ok) {
        name = identityDisplayName(getIdentity(r.identityId), u.gender);
        pushRecent(`晉升為${name}`);
      } else toast(r.reason);
    });
    if (name) {
      toast(`晉升成功：${name}！`);
      addXp(XP_REWARDS.trialPassBonus || 40, { correct: true });
      render();
    }
  });
  document.getElementById("btn-trial")?.addEventListener("click", () => {
    const order = buildPromotionOrder(ctx.getUser());
    if (order.trialPassed) {
      document.getElementById("btn-confirm-promote")?.click();
      return;
    }
    if (!order.canChallenge) {
      toast("尚未解鎖試煉");
      return;
    }
    state.trial = { id: order.trialId, index: 0, answers: [] };
    paintTrial(ctx);
  });
}

function paintTrial(ctx) {
  const { state, toast, render } = ctx;
  const trial = getTrialData(state.trial.id);
  const panel = document.getElementById("trial-panel");
  if (!panel || !trial) return;
  panel.classList.remove("hidden");
  const parts = flattenTrialParts(trial);
  const i = state.trial.index;
  if (i >= parts.length) {
    const result = scoreTrial(trial, state.trial.answers);
    panel.innerHTML = `
      <div class="trial-result">
        <h3>${result.passed ? "試煉通過" : "尚未通過——進度保留"}</h3>
        <p>總分 ${Math.round(result.avg)}｜史料 ${Math.round(result.sourceAvg)}｜論證 ${Math.round(result.argueAvg)}</p>
        ${
          result.passed
            ? `<p>可按「確認晉升」完成身份躍升。</p>`
            : `<ul>${result.fails.map((f) => `<li>${f}</li>`).join("")}</ul>
               <p>完成補強後可再挑戰<strong>另一組同等難度</strong>（唔使等日數）。</p>`
        }
        <button type="button" class="btn" data-goto="notes">前往待考札記／補強</button>
      </div>`;
    updateUser((u) => {
      u.progress.trials[trial.id] = {
        passed: result.passed,
        avg: result.avg,
        at: Date.now(),
        fails: result.fails,
      };
    });
    if (result.passed) {
      pushRecent(`通過${trial.title}`);
      toast("試煉通過！可確認晉升");
    } else toast("未通過——看看弱項再練");
    return;
  }
  const part = parts[i];
  panel.innerHTML = `
    <div class="trial-q">
      <p class="eyebrow">考核 ${i + 1}/${parts.length} · 提示較少</p>
      <h3>${trial.title}</h3>
      <div class="q-text">${part.q}</div>
      ${
        part.options
          ? `<div class="options">${part.options
              .map((o, idx) => `<button type="button" class="option" data-ta="${idx}">${o}</button>`)
              .join("")}</div>`
          : `<textarea id="ta-input" rows="3" placeholder="寫出關鍵詞／短句即可（史實準確、證據相關、解釋合理）"></textarea>
             <button type="button" class="btn" id="ta-submit">提交</button>`
      }
    </div>`;
  const submit = (ans) => {
    state.trial.answers[i] = ans;
    state.trial.index++;
    paintTrial(ctx);
  };
  panel.querySelectorAll("[data-ta]").forEach((btn) =>
    btn.addEventListener("click", () => submit(Number(btn.dataset.ta)))
  );
  document.getElementById("ta-submit")?.addEventListener("click", () => {
    submit(document.getElementById("ta-input")?.value || "");
  });
}

export function renderNotes(user) {
  const notes = user.progress?.wrongNotes || [];
  const open = notes.filter((n) => n.status !== "mastered");
  const groups = {};
  open.forEach((n) => {
    groups[n.tag] = groups[n.tag] || [];
    groups[n.tag].push(n);
  });
  const cards = Object.entries(groups)
    .map(
      ([tag, list]) => `
    <article class="note-card">
      <h3>${tag}</h3>
      ${list
        .slice(0, 5)
        .map(
          (n) => `
        <div class="note-item">
          <p><strong>我錯喺邊：</strong>${n.qText}</p>
          <p class="muted">簡短重溫：先分清時序／因果／史料，再答新題。</p>
          <button type="button" class="btn ghost" data-master-note="${n.id}">蓋上「已掌握」</button>
        </div>`
        )
        .join("")}
    </article>`
    )
    .join("");

  return `
  <section class="panel-paper">
    <h2>待考札記</h2>
    <p class="lead">錯題變成修練——指出弱項，補強後再戰。練習可提示；考核另用新題。</p>
    <div class="note-grid">${cards || "<p>暫無未掌握錯題。繼續長卷或練習吧。</p>"}</div>
    <div class="row-actions">
      <button type="button" class="btn" data-goto="practice">去練習</button>
      <button type="button" class="btn ghost" data-goto="timeline">時序長廊</button>
      <button type="button" class="btn ghost" data-goto="dialogue">朝堂議事·對話</button>
    </div>
  </section>`;
}

function bindNotes(user, ctx) {
  document.querySelectorAll("[data-master-note]").forEach((btn) => {
    btn.addEventListener("click", () => {
      updateUser((u) => markNoteMastered(u, btn.dataset.masterNote));
      addXp(Math.max(1, Math.round(XP_REWARDS.remedialBonus * 0.5)), { correct: true });
      ctx.toast("已蓋章：已掌握");
      ctx.render();
    });
  });
}

export function renderChronicle(user, char) {
  const c = user.progress?.chronicle || { promotions: [], restored: [], quotes: [] };
  const snap = userSnapshot(user);
  return `
  <section class="panel-paper chronicle">
    <h2>我的史冊</h2>
    <p class="lead">展示你學識咗乜——最終收藏是一部自己完成的史冊，而不只是裝備。</p>
    <div class="book">
      <div class="book-page">
        <h3>行者檔案</h3>
        ${renderAvatar(char, snap.identity.id, "md")}
        <p>${char?.name} · ${snap.identityName} · Lv.${snap.level.level}</p>
        <p>衣裝：${snap.outfit}</p>
      </div>
      <div class="book-page">
        <h3>晉升紀錄</h3>
        <ul>${(c.promotions || []).map((p) => `<li>${new Date(p.at).toLocaleDateString()} → ${identityDisplayName(getIdentity(p.to), user.gender)}</li>`).join("") || "<li>尚未晉升——先完成脫籍之路</li>"}</ul>
      </div>
      <div class="book-page">
        <h3>修復篇章</h3>
        <ul>${(c.restored || []).slice(-12).map((r) => `<li>${r.chapterId} · ${r.stageId}</li>`).join("") || "<li>尚未修復史頁</li>"}</ul>
      </div>
    </div>
  </section>`;
}

function appClick(sel, fn) {
  document.querySelectorAll(sel).forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      fn(el);
    });
  });
}
