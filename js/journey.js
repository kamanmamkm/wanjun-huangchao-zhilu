/**
 * 《任平生》主介面：行旅首頁、歷史長卷、晉升殿、待考札記、史冊
 */
import { CHAPTERS, chapterList } from "./data/chapters.js?v=rad56";
import { XP_REWARDS } from "./data/levels.js?v=rad50";
import { CUOSHI_BATTLES, CHAPTER_BOSS_PAGES, getCuoshi, wrongLineOf } from "./data/cuoshi.js?v=rad57";
import { IDENTITIES } from "./data/identities.js?v=rad50";
import { getStageVisual, SKILL_BARS, skillFill, STAGE_RELIC, realmLabel } from "./data/stageVisuals.js";
import { heroDisplayName, normalizeHeroName } from "./data/characters.js";
import { pickRandomHeroName, HERO_NAME_COUNT } from "./data/heroNames.js";
import { renderAvatar } from "./avatar.js";
import { renderHeroStage, renderStudyCompanion, renderPromoteReveal } from "./heroStage.js";
import { nextHook, nextStageAfter, todayEncounter } from "./data/flavor.js?v=rad50";
import {
  userSnapshot,
  wheelStatus,
  buildPromotionOrder,
  completeStage,
  settleStage,
  isStageCompleted,
  isStageMastered,
  isStageCorrected,
  stageRecord,
  stageStatusLabel,
  masteryFromScore,
  STAGE_MASTERY_RATE,
  markNoteMastered,
  scoreTrial,
  flattenTrialParts,
  applyPromotion,
  openWeakRemedials,
  getTrialData,
  IDENTITY_DISCLAIMER,
  identityDisplayName,
  getIdentity,
  queueReview,
  getFinaleState,
  saveFinaleSegment,
  markCuoshiWon,
  levelBandLines,
  stageIdForUser,
} from "./progress.js?v=rad56";
import { updateUser, addXp, pushRecent } from "./storage.js";
import { getTrial } from "./data/trials.js";

function chapterShortTitle(ch) {
  const t = String(ch?.title || "");
  const m = t.match(/^(第[一二三四五六七八九十百]+章)/);
  return m ? m[1] : t || "長卷";
}

function makeStageTask(ch, stage, idx, extra = {}) {
  const short = chapterShortTitle(ch);
  return {
    kind: extra.resume ? "resume" : "stage",
    label: `繼續：${short}・第 ${idx + 1} 關`,
    detail: stage.title,
    chapterId: ch.id,
    stageId: stage.id,
    enterStage: `${ch.id}:${stage.id}`,
  };
}

/** 根據目前進度計下一關：未完成關卡 → 下一章 → 錯題／試煉。 */
export function nextJourneyTask(user, ui = {}) {
  const list = chapterList();
  const p = user.progress?.chapters || {};
  const notes = (user.progress?.wrongNotes || []).filter((n) => n.status !== "mastered");

  if (ui.scrollChapter && ui.scrollStage) {
    const ch = CHAPTERS[ui.scrollChapter];
    const stage = ch?.stages?.find((s) => s.id === ui.scrollStage);
    const rec = p[ui.scrollChapter]?.stages?.[ui.scrollStage];
    if (ch && stage && isChapterEnterable(user, ui.scrollChapter) && !isStageCompleted(rec)) {
      const idx = ch.stages.findIndex((s) => s.id === stage.id);
      return makeStageTask(ch, stage, idx, { resume: true });
    }
  }

  for (const ch of list) {
    const stages = ch.stages || [];
    if (!stages.length) continue;
    if (!isChapterEnterable(user, ch.id)) continue;
    const st = p[ch.id] || { stages: {} };
    const idx = stages.findIndex((s) => !isStageCompleted(st.stages?.[s.id]));
    if (idx >= 0) return makeStageTask(ch, stages[idx], idx);
  }

  if (notes.length) {
    return {
      kind: "notes",
      label: "複習錯題",
      detail: `尚有 ${notes.length} 則待掌握`,
      goto: "notes",
    };
  }

  const order = buildPromotionOrder(user);
  if (order.readyForTrial) {
    return {
      kind: "trial",
      label: "開始試煉",
      detail: order.nextName ? `挑戰「${order.nextName}」` : "晉升試煉已解鎖",
      goto: "promote",
    };
  }
  if (order.trialPassed && order.next) {
    return {
      kind: "promote",
      label: `確認晉升「${order.nextName}」`,
      detail: "條件已齊，可到晉升殿完成躍升",
      goto: "promote",
    };
  }

  const nextDraft = list.find((ch) => !(ch.stages || []).length);
  return {
    kind: "scroll",
    label: "重溫長卷",
    detail: nextDraft ? `${nextDraft.title} 製作中` : "已完成現有關卡",
    goto: "scroll",
  };
}

function lastHookLine(user) {
  const restored = user.progress?.chronicle?.restored || [];
  const last = restored[restored.length - 1];
  if (!last) return "";
  return nextHook(last.chapterId, last.stageId);
}

function renderFlavorCard(user, ui) {
  const enc = todayEncounter();
  const done = user.progress?.flavor?.day === enc.day;
  if (done) {
    return `<div class="flavor-card done">
      <p class="eyebrow">今日機緣</p>
      <p>${user.progress.flavor.reply || "今日已遇。"}</p>
    </div>`;
  }
  if (ui.flavorOpen) {
    return `<div class="flavor-card open">
      <p class="eyebrow">今日機緣</p>
      <p>${enc.setup}</p>
      <div class="options">
        ${enc.options
          .map((o, i) => `<button type="button" class="option" data-flavor-pick="${i}">${o.text}</button>`)
          .join("")}
      </div>
    </div>`;
  }
  return `<div class="flavor-card">
    <p class="eyebrow">今日機緣</p>
    <p>${enc.setup}</p>
    <button type="button" class="btn ghost" data-open-flavor>應對</button>
  </div>`;
}

function renderRelicTray(user) {
  const relics = user.progress?.relics || [];
  if (!relics.length) {
    return `<p class="relic-tray muted">過關可偶得信物</p>`;
  }
  return `<div class="relic-tray" aria-label="信物">${relics
    .map((r) => `<span class="relic-stamp" title="${String(r.hint || "").replace(/"/g, "&quot;")}">${r.name}</span>`)
    .join("")}</div>`;
}

export function renderJourneyHome(user, char, ui = {}) {
  const snap = userSnapshot(user);
  const stageId = snap.stageId ?? user.identityId ?? 0;
  const order = buildPromotionOrder(user);
  const task = nextJourneyTask(user, ui);
  const taskCh = task.chapterId ? CHAPTERS[task.chapterId] : null;
  const skills = user.progress?.skills || {};
  const vis = getStageVisual(stageId);
  const realm = realmLabel(stageId);
  const heroName = heroDisplayName(user, char);
  const gaps = (order.items || []).filter((i) => !i.ok);

  const skillBars = SKILL_BARS.slice(0, 3)
    .map((s) => {
      const fill = skillFill(skills, s.key);
      const blocks = [0, 1, 2, 3]
        .map((i) => `<i class="${fill > i * 0.25 ? "on" : ""}"></i>`)
        .join("");
      return `<div class="skill-row"><span>${s.label}</span><span class="skill-pips">${blocks}</span></div>`;
    })
    .join("");

  const ladder = IDENTITIES.map((idn) => {
    const unlocked = stageId >= idn.id;
    const current = stageId === idn.id;
    const label = identityDisplayName(idn, user.gender);
    if (current) return `<span class="grow-step current">【${label}】</span>`;
    if (unlocked) return `<span class="grow-step done">${label}</span>`;
    if (idn.id === stageId + 1) return `<span class="grow-step next">${label}</span>`;
    if (idn.id > stageId + 1 && idn.id <= stageId + 3)
      return `<span class="grow-step locked">${label}</span>`;
    if (idn.id === IDENTITIES.length - 1) return `<span class="grow-step locked">？</span>`;
    return "";
  })
    .filter(Boolean)
    .join('<span class="grow-sep">──</span>');

  const avatars = IDENTITIES.map((idn) => {
    const unlocked = stageId >= idn.id;
    const current = stageId === idn.id;
    const next = idn.id === stageId + 1;
    if (!unlocked && !next && idn.id > stageId + 1) {
      if (idn.id === IDENTITIES.length - 1)
        return `<button type="button" class="growth-av locked" disabled title="？">？</button>`;
      return "";
    }
    if (next && !unlocked) {
      return `<button type="button" class="growth-av next" data-nav="growth" title="下一階">
        ${renderAvatar(char, idn.id, "sm")}
      </button>`;
    }
    if (!unlocked) return "";
    return `<button type="button" class="growth-av ${current ? "current" : ""}" data-growth-pick="${idn.id}" title="${identityDisplayName(idn, user.gender)}">
      ${renderAvatar(char, idn.id, "sm")}
    </button>`;
  })
    .filter(Boolean)
    .join("");

  const questAction = task.enterStage
    ? `data-enter-stage="${task.enterStage}"`
    : `data-goto="${task.goto || "scroll"}"`;

  let promoteBlock = "";
  if (order.next) {
    if (gaps.length) {
      promoteBlock = `<div class="promote-teaser edict">
        <h4>晉升尚欠</h4>
        <ul class="edict-list">
          ${gaps
            .map((i) => {
              const extra = i.hint ? ` <span class="muted">${i.hint}</span>` : "";
              return `<li class="wait"><span>○</span><div>${i.label}${extra}</div></li>`;
            })
            .join("")}
        </ul>
        <button type="button" class="btn ghost" data-goto="promote">前往晉升殿</button>
      </div>`;
    } else if (order.readyForTrial) {
      promoteBlock = `<div class="promote-teaser edict">
        <h4>下一身份：${order.nextName}</h4>
        <p class="muted" style="margin:0 0 .5rem">條件已齊，可開始試煉。</p>
        <button type="button" class="btn" data-goto="promote">開始試煉</button>
      </div>`;
    } else if (order.trialPassed) {
      promoteBlock = `<div class="promote-teaser edict">
        <h4>下一身份：${order.nextName}</h4>
        <p class="muted" style="margin:0 0 .5rem">試煉已過，可確認晉升。</p>
        <button type="button" class="btn" data-goto="promote">確認晉升</button>
      </div>`;
    }
  }

  return `
  <section class="poster-home scene-poster-${vis.sceneKey}">
    <div class="poster-copy">
      <p class="realm-kicker">${realm}${taskCh?.arc ? ` · ${taskCh.arc}` : ""}</p>
      <h2 class="realm-title">${snap.identityName}</h2>
      <hr class="realm-rule" />
      <p class="realm-quote">${vis.quote}</p>
      <p class="poster-char">
        <span>${heroName}</span>
        <button type="button" class="name-pencil" id="toggle-hero-name" aria-label="改名" title="改名" aria-expanded="${ui.heroNameEdit ? "true" : "false"}">✎</button>
        <span class="muted">Lv.${snap.level.level}</span>
      </p>
      ${
        ui.heroNameEdit
          ? `<div class="hero-name-edit" id="hero-name-edit">
        <input id="ingame-hero-name" maxlength="8" value="${String(heroName).replace(/"/g, "&quot;")}" aria-label="角色名" />
        <button type="button" class="btn ghost" id="reroll-hero-name">換一個</button>
        <button type="button" class="btn ghost" id="save-hero-name">確認改名</button>
        <button type="button" class="btn ghost" id="cancel-hero-name">取消</button>
        <p class="muted" style="font-size:.8rem;margin:.15rem 0 0;flex-basis:100%">古風姓＋名共 ${HERO_NAME_COUNT} 組，亦可自訂。</p>
      </div>`
          : ""
      }
      <div class="home-quest">
        <p class="eyebrow">當前任務</p>
        <h3>${task.label}</h3>
        <p>${task.detail || ""}</p>
        ${lastHookLine(user) ? `<p class="next-hook">${lastHookLine(user)}</p>` : ""}
        <div class="poster-actions">
          <button type="button" class="btn" ${questAction}>${task.label}</button>
          <button type="button" class="btn ghost" data-goto="scroll">歷史長卷</button>
          <button type="button" class="btn ghost" data-goto="games">趣味關卡</button>
        </div>
      </div>
      ${
        wheelStatus(user).canSpin
          ? `<div class="wheel-teaser edict">
        <p class="eyebrow">天機輪</p>
        <p>尚有 ${wheelStatus(user).charges} 次可轉天機輪</p>
        <button type="button" class="btn" data-goto="wheel">前往天機輪</button>
      </div>`
          : ""
      }
      ${renderFlavorCard(user, ui)}
      ${promoteBlock}
      <div class="poster-skills">${skillBars}</div>
    </div>
    <div class="poster-art" aria-label="${heroName} 立繪">
      ${renderHeroStage(char, stageId, "hero", {
        gender: user.gender,
        priorityBoost: true,
        poster: true,
      })}
    </div>
    <footer class="poster-rail">
      <div class="growth-avatars" aria-label="已解鎖造型">${avatars}</div>
      <div class="growth-ladder">${ladder}</div>
      ${renderRelicTray(user)}
      <button type="button" class="btn ghost" data-nav="growth">成長長卷</button>
    </footer>
  </section>`;
}

function isChapterFullyDone(user, ch) {
  if (!ch) return false;
  const stages = ch.stages || [];
  if (!stages.length) return false;
  const st = user.progress?.chapters?.[ch.id] || {};
  if (st.done) return true;
  return stages.every((s) => isStageCompleted(st.stages?.[s.id]));
}

export function isChapterEnterable(user, chapterId) {
  const list = chapterList();
  const idx = list.findIndex((c) => c.id === chapterId);
  if (idx < 0) return false;
  const ch = list[idx];
  if (!(ch.stages || []).length) return false;
  for (let j = idx - 1; j >= 0; j--) {
    if ((list[j].stages || []).length) return isChapterFullyDone(user, list[j]);
  }
  return true;
}

const INTERACT_COPY = {
  timeline: {
    how: "把事件牌排成由早到晚。<strong>本局全部按時序排對（全對）</strong>即完成本關，會自動記入長卷。核對後才顯示年份。",
    start: "開始時序長廊",
    again: "再玩一局",
    done: "本關已完成——你已全對過一局。",
  },
  dialogue: {
    how: "選最符合史實或合理史觀的回應。<strong>完成與一位古人的整段對話</strong>即完成本關，會自動記入長卷。",
    start: "開始與古人對話",
    again: "再對話一回",
    done: "本關已完成——你已完成一段對話。",
  },
};

export function renderScroll(user) {
  const list = chapterList();
  const p = user.progress?.chapters || {};
  return `
  <section class="panel-paper scroll-view">
    <h2>歷史長卷</h2>
    <p class="lead">課程章節可隨老師進度學習；角色身份晉升另計，唔會因為未升官而鎖死課堂課題。</p>
    <div class="chapter-list">
      ${list
        .map((ch) => {
          const st = p[ch.id] || {};
          const hasStages = (ch.stages || []).length > 0;
          const total = (ch.stages || []).length || 0;
          const doneN = (ch.stages || []).filter((s) => isStageCompleted(st.stages?.[s.id])).length;
          const masteredN = (ch.stages || []).filter((s) => isStageMastered(st.stages?.[s.id])).length;
          const enterable = hasStages && isChapterEnterable(user, ch.id);
          const lockHint = hasStages && !enterable ? "先完成上一章" : "";
          return `
          <article class="chapter-card ${hasStages ? "" : "dim"} ${enterable ? "" : hasStages ? "locked" : ""}" data-open-chapter="${ch.id}">
            <div class="ch-arc">${ch.arc}</div>
            <h3>${ch.title}</h3>
            <p>${ch.blurb}</p>
            <p class="muted">${
              !hasStages
                ? "關卡製作中（可先用趣味關卡）"
                : enterable
                  ? `已完成 ${doneN}/${total} · 已掌握 ${masteredN}/${total}`
                  : lockHint
            }</p>
            ${
              enterable
                ? `<button type="button" class="btn ghost" data-open-chapter="${ch.id}">進入</button>`
                : hasStages
                  ? `<button type="button" class="btn ghost" disabled>尚未解鎖</button>`
                  : ""
            }
          </article>`;
        })
        .join("")}
    </div>
  </section>`;
}

export function renderChapterDetail(user, chapterId, stageId) {
  const ch = CHAPTERS[chapterId];
  if (!ch) return `<section class="panel-paper"><p>找不到章節</p></section>`;
  if (!isChapterEnterable(user, chapterId)) {
    return `
    <section class="panel-paper">
      <button type="button" class="btn ghost" data-nav="scroll">← 返回長卷</button>
      <p class="eyebrow ink-red">${ch.arc}</p>
      <h2>${ch.title}</h2>
      <p class="lead">尚未解鎖。請先完成上一章全部關卡，再入本章。</p>
    </section>`;
  }
  const st = user.progress?.chapters?.[chapterId] || { stages: {} };
  if (!stageId) {
    return `
    <section class="panel-paper">
      <button type="button" class="btn ghost" data-nav="scroll">← 返回長卷</button>
      <p class="eyebrow ink-red">${ch.arc}</p>
      <h2>${ch.title}</h2>
      <p class="lead">${ch.blurb}</p>
      <p class="muted">已完成＝做完全部題目。已掌握＝首次答對八成。未達可做錯題重答，完成後為「已完成修正」，首次成績保留。</p>
      <div class="stage-grid">
        ${(ch.stages || [])
          .map((s, i) => {
            const prevDone = i === 0 || isStageCompleted(st.stages?.[(ch.stages[i - 1] || {}).id]);
            const rec = stageRecord(st.stages?.[s.id]);
            const done = !!rec?.completed;
            const mastered = !!rec?.mastered;
            const corrected = isStageCorrected(st.stages?.[s.id]);
            const locked = !prevDone && !done;
            const status = locked ? "先完成上一關" : stageStatusLabel(rec);
            return `
            <button type="button" class="stage-card ${done ? "done" : ""} ${mastered ? "mastered" : ""} ${corrected ? "corrected" : ""} ${locked ? "locked" : ""}"
              data-enter-stage="${ch.id}:${s.id}" ${locked ? "disabled" : ""}>
              <span class="ic">${s.icon}</span>
              <strong>${s.title}</strong>
              <span>${s.minutes || "—"} 分鐘</span>
              <span class="goal">${s.goal}</span>
              <em>${status}</em>
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
  const companionSlot = `<div id="study-companion-slot" data-identity="${stageIdForUser(user)}"></div>`;
  if (stage.kind === "story") {
    return `
    <section class="panel-paper stage-play study-mode">
      ${companionSlot}
      <div class="q-top"><span>${ch.title}</span></div>
      <h2>${stage.title}</h2>
      <div class="story-box">${stage.body}</div>
      <p class="lead">學習目標：${stage.goal}</p>
      <button type="button" class="btn" data-finish-stage="${ch.id}:${stage.id}">明白了，繼續</button>
    </section>`;
  }
  if (stage.kind === "interact" && stage.gotoGame) {
    const done = isStageCompleted(user.progress?.chapters?.[ch.id]?.stages?.[stage.id]);
    const copy = INTERACT_COPY[stage.gotoGame] || INTERACT_COPY.timeline;
    return `
    <section class="panel-paper stage-play study-mode">
      ${companionSlot}
      <div class="q-top"><span>${stage.title}</span></div>
      <p class="lead">${stage.goal}</p>
      <p>${copy.how}</p>
      ${
        done
          ? `<p class="settle-line ok">${copy.done}</p>
             <button type="button" class="btn" data-start-interact="${ch.id}:${stage.id}">${copy.again}</button>
             <button type="button" class="btn ghost" data-open-chapter="${ch.id}">返回關卡</button>`
          : `<button type="button" class="btn" data-start-interact="${ch.id}:${stage.id}">${copy.start}</button>`
      }
    </section>`;
  }
  if (stage.kind === "boss" && stage.boss) {
    return `
    <section class="panel-paper stage-play study-mode" id="boss-stage" data-chapter="${ch.id}" data-stage="${stage.id}">
      ${companionSlot}
      <div class="q-top"><span>${stage.title}</span></div>
      <p class="lead">Boss 是一本被改亂的史書——撳出錯句，再揀修正。</p>
      <div class="boss-progress"><i style="width:0%" id="boss-bar"></i></div>
      <div id="boss-body"></div>
    </section>`;
  }
  const qs = stage.questions || [];
  return `
  <section class="panel-paper stage-play study-mode" id="stage-quiz" data-chapter="${ch.id}" data-stage="${stage.id}">
    ${companionSlot}
    <div class="q-top">
      <span>${ch.title} · ${stage.title}</span>
      <span id="sq-progress">進度 1 / ${qs.length}</span>
    </div>
    <div id="sq-body"></div>
  </section>`;
}

export function renderGrowthScroll(user, char, growthFocus) {
  const snap = userSnapshot(user);
  const cur = snap.stageId ?? stageIdForUser(user);
  const promotions = user.progress?.chronicle?.promotions || [];
  const bands = levelBandLines(user.gender);
  const cards = IDENTITIES.map((idn) => {
    const unlocked = cur >= idn.id;
    const current = cur === idn.id;
    const nextHint = idn.id === cur + 1;
    const vis = getStageVisual(idn.id);
    const name = identityDisplayName(idn, user.gender);
    const band = bands.find((b) => b.id === idn.id);
    const promo = promotions.find((p) => p.to === idn.id);
    if (!unlocked && !nextHint) {
      return `
      <article class="growth-card locked">
        <div class="growth-preview unknown">？</div>
        <h3>未知</h3>
        <p class="muted">${band ? `${band.range} 達標後考試煉解鎖` : "繼續升級以揭曉"}</p>
      </article>`;
    }
    if (nextHint && !unlocked) {
      return `
      <article class="growth-card next-hint">
        ${renderHeroStage(char, idn.id, "md", {
          gender: user.gender,
          silhouette: true,
          previewId: idn.id,
          compact: true,
          showRelic: false,
          hideQuote: true,
        })}
        <h3>${name}</h3>
        <p class="muted">達 Lv.${band?.minLevel ?? "？"} 並通過試煉解鎖 · 「${vis.prop}」</p>
      </article>`;
    }
    return `
    <article class="growth-card ${current ? "current" : "done"}" data-growth-pick="${idn.id}">
      ${renderHeroStage(char, idn.id, "md", {
        gender: user.gender,
        compact: true,
        hideQuote: true,
        showRelic: false,
        preferStageArt: true,
      })}
      <h3>${current ? `【${name}】` : name} ${current ? "· 目前" : "· 已解鎖"}</h3>
      <p>${band?.range || ""} · ${vis.scene} · ${vis.prop}</p>
      <p class="muted">${promo?.trialId && promo.trialId !== "level_band" ? new Date(promo.at).toLocaleDateString() + " 試煉晉升" : promo?.byLevel ? `Lv.${promo.byLevel} 晉升` : promo ? new Date(promo.at).toLocaleDateString() + " 晉升" : idn.id === 0 ? "開局" : ""}</p>
    </article>`;
  }).join("");

  const focusId =
    typeof growthFocus === "number" && growthFocus <= cur ? growthFocus : cur;
  const focusVis = getStageVisual(focusId);
  const focusIdn = getIdentity(focusId);
  const focusPromo = promotions.find((p) => p.to === focusId);
  const focusBand = bands.find((b) => b.id === focusId);

  return `
  <section class="panel-paper growth-scroll-view">
    <p class="eyebrow ink-gold">人物成長長卷</p>
    <h2>同一人物 · 試煉通過即轉相轉頭像</h2>
    <p class="lead">等級靠長卷與遊戲累積；身份造型要通過短試煉才解鎖。${STAGE_RELIC.note}</p>
    <p class="muted">${IDENTITY_DISCLAIMER}</p>
    <div class="growth-rail">${cards}</div>
    <div class="growth-focus thin-card">
      ${renderHeroStage(char, focusId, "hero", { gender: user.gender, priorityBoost: true, preferStageArt: true })}
      <div class="growth-focus-meta">
        <p class="realm-kicker">${realmLabel(focusId)} · ${focusBand?.range || ""} · ${focusVis.vibe}</p>
        <h3>${identityDisplayName(focusIdn, user.gender)}</h3>
        <p>${focusVis.pose} · ${focusVis.prop}</p>
        ${focusVis.bgHint ? `<p>背景：${focusVis.scene}（${focusVis.bgHint}）</p>` : ""}
        <p class="stage-quote">「${focusVis.quote}」</p>
        <p class="muted">${focusPromo?.trialId && focusPromo.trialId !== "level_band" ? `晉升於 ${new Date(focusPromo.at).toLocaleString()}` : focusPromo?.byLevel ? `Lv.${focusPromo.byLevel} 晉升` : focusPromo ? `晉升於 ${new Date(focusPromo.at).toLocaleString()}` : focusId === 0 ? "旅程起點" : "已解鎖造型"}</p>
      </div>
    </div>
    <button type="button" class="btn ghost" data-nav="home">返回行旅</button>
  </section>`;
}

export function renderCuoshi(user) {
  const won = user.progress?.cuoshi || {};
  const cards = CUOSHI_BATTLES.map(
    (b) => `
    <article class="chapter-card ${won[b.id]?.won ? "done" : ""}">
      <p class="eyebrow">${b.difficulty || "關卡"}</p>
      <h3>${b.title} ${won[b.id]?.won ? "✓" : ""}</h3>
      <p>${b.blurb}</p>
      <button type="button" class="btn ${won[b.id]?.won ? "ghost" : ""}" data-cuoshi="${b.id}">
        ${won[b.id]?.won ? "再戰一回" : "進入戰場"}
      </button>
    </article>`
  ).join("");
  return `
  <section class="panel-paper cuoshi-view">
    <p class="eyebrow ink-red">趣味關卡 · 錯史之戰</p>
    <h2>修復被改亂的史頁</h2>
    <p class="lead">Boss 是錯史本身：讀殘卷，撳出錯句，再揀修正。一關大約三分鐘。</p>
    <div class="cuoshi-grid">${cards}</div>
    <div id="cuoshi-panel" class="hidden"></div>
    <button type="button" class="btn ghost" data-goto="games">返回大廳</button>
  </section>`;
}

function bindHeroNameEdit(ctx) {
  const { render, toast, getUser, state } = ctx;
  document.getElementById("toggle-hero-name")?.addEventListener("click", () => {
    state.heroNameEdit = !state.heroNameEdit;
    render();
  });
  document.getElementById("cancel-hero-name")?.addEventListener("click", () => {
    state.heroNameEdit = false;
    render();
  });
  const input = document.getElementById("ingame-hero-name");
  if (!input) return;
  input.focus();
  input.select();
  const save = (raw) => {
    try {
      const name = normalizeHeroName(raw);
      updateUser((u) => {
        u.heroName = name;
      });
      state.heroNameEdit = false;
      toast(`角色名已改為「${name}」`);
      render();
    } catch (ex) {
      toast(ex.message);
    }
  };
  document.getElementById("reroll-hero-name")?.addEventListener("click", () => {
    const u = getUser?.() || {};
    save(pickRandomHeroName(u.gender, u.heroName));
  });
  document.getElementById("save-hero-name")?.addEventListener("click", () => {
    save(input.value);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      save(input.value);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      state.heroNameEdit = false;
      render();
    }
  });
}

function bindFlavor(user, ctx) {
  const { state, render, toast } = ctx;
  appClick("[data-open-flavor]", () => {
    state.flavorOpen = true;
    render();
  });
  appClick("[data-flavor-pick]", (btn) => {
    const enc = todayEncounter();
    const fresh = ctx.getUser?.() || user;
    if (fresh.progress?.flavor?.day === enc.day) {
      toast("今日機緣已遇");
      state.flavorOpen = false;
      render();
      return;
    }
    const opt = enc.options[Number(btn.dataset.flavorPick)];
    if (!opt) return;
    updateUser((u) => {
      const p = u.progress || {};
      p.flavor = { day: enc.day, id: enc.id, good: !!opt.good, reply: opt.reply };
      u.progress = p;
    });
    ctx.submitAnswer?.(opt.good ? XP_REWARDS.flavorGood || 3 : 0, {
      correct: !!opt.good,
      wrong: !opt.good,
      qid: `flavor-${enc.day}`,
      qText: enc.setup,
      source: "機緣",
      keepView: true,
      nudge: false,
    });
    toast(opt.reply);
    state.flavorOpen = false;
    render();
  });
}

export function bindJourney(user, ctx) {
  const { render, toast, state, reward } = ctx;

  appClick("[data-open-chapter]", (btn) => {
    const cid = btn.dataset.openChapter;
    const ch = CHAPTERS[cid];
    if (!(ch?.stages || []).length) {
      toast("本章關卡製作中，可先用趣味關卡。");
      return;
    }
    if (!isChapterEnterable(user, cid)) {
      toast("先完成上一章，再入本章。");
      return;
    }
    state.scrollChapter = cid;
    state.scrollStage = null;
    state.view = "chapter";
    render();
  });

  appClick("[data-start-interact]", (btn) => {
    const [cid, sid] = btn.dataset.startInteract.split(":");
    if (!isChapterEnterable(user, cid)) {
      toast("先完成上一章，再入本章。");
      return;
    }
    const stage = CHAPTERS[cid]?.stages?.find((s) => s.id === sid);
    const game = stage?.gotoGame || "timeline";
    state.scrollChapter = cid;
    state.scrollStage = sid;
    state.stageInteract = { cid, sid, game, title: stage?.title || "" };
    if (game === "dialogue") {
      state.dialogue = { id: state.dialogue?.id || "d_qin", step: 0, replied: false, good: 0 };
    }
    state.view = game;
    render();
  });

  appClick("[data-enter-stage]", (btn) => {
    const [cid, sid] = btn.dataset.enterStage.split(":");
    if (!isChapterEnterable(user, cid)) {
      toast("先完成上一章，再入本章。");
      return;
    }
    state.scrollChapter = cid;
    state.scrollStage = sid;
    state.view = "chapter";
    state.stageQuiz = blankStageQuiz();
    state.bossStep = 0;
    state.bossPlay = null;
    render();
    // after render, bind quiz/boss
    setTimeout(() => {
      bindStageRuntime(user, ctx);
    }, 0);
  });

  appClick("[data-finish-stage]", (btn) => {
    const [cid, sid] = btn.dataset.finishStage.split(":");
    let dropped = null;
    updateUser((u) => {
      dropped = completeStage(u, cid, sid);
    });
    pushRecent(`完成 ${CHAPTERS[cid]?.title || ""} · ${sid}`);
    addXp(XP_REWARDS.chapterBonus || 20, { correct: true });
    ctx.queueRelic?.(dropped);
    const hook = nextHook(cid, sid);
    toast(dropped ? `偶得「${dropped.name}」。${hook}` : hook);
    const nxt = nextStageAfter(cid, sid);
    const fresh = ctx.getUser?.() || user;
    if (nxt && isChapterEnterable(fresh, nxt.chapterId)) {
      state.scrollChapter = nxt.chapterId;
      state.scrollStage = nxt.stageId;
      state.stageQuiz = blankStageQuiz();
      state.bossStep = 0;
      state.bossPlay = null;
      state.view = "chapter";
    } else {
      state.scrollStage = null;
      state.view = "chapter";
    }
    render();
  });

  bindStageRuntime(user, ctx);
  bindPromote(user, ctx);
  bindNotes(user, ctx);
  bindCuoshi(user, ctx);
  bindHeroNameEdit(ctx);
  bindGrowth(user, ctx);
  bindFlavor(user, ctx);

  const slot = document.getElementById("study-companion-slot");
  if (slot && ctx.getCharacter) {
    const char = ctx.getCharacter();
    const id = Number(slot.dataset.identity || 0);
    slot.outerHTML = renderStudyCompanion(char, id, "行囊已備。答題時我會在旁點一句。");
  }
}

function bindCuoshi(user, ctx) {
  const { state } = ctx;
  appClick("[data-cuoshi]", (btn) => {
    state.cuoshi = { id: btn.dataset.cuoshi, phase: "spot", miss: [] };
    paintCuoshi(ctx);
  });
  if (state.cuoshi?.id && document.getElementById("cuoshi-panel")) {
    paintCuoshi(ctx);
  }
}

function paintCuoshi(ctx) {
  const { state, toast } = ctx;
  const battle = getCuoshi(state.cuoshi.id);
  const panel = document.getElementById("cuoshi-panel");
  if (!panel || !battle) return;
  panel.classList.remove("hidden");
  document.querySelector(".cuoshi-grid")?.classList.add("hidden");
  panel.scrollIntoView({ block: "nearest" });
  if (state.cuoshi.phase === "done") {
    updateUser((u) => markCuoshiWon(u, battle.id));
    pushRecent(`戰勝錯史：${battle.title}`);
    addXp(XP_REWARDS.chapterBonus || 20, { correct: true });
    const repaired = battle.fix?.repaired || "";
    panel.innerHTML = `
      <div class="trial-result">
        <h3>史頁已修復</h3>
        <p>你完成了「${battle.title}」。</p>
        ${repaired ? `<p class="cuoshi-repaired">改寫：${repaired}</p>` : ""}
        <button type="button" class="btn" data-cuoshi-back>返回關卡列表</button>
      </div>`;
    toast("錯史之戰勝利！");
    bindCuoshiListBack(panel, ctx);
    state.cuoshi = null;
    return;
  }
  paintPageGame(panel, battle, state.cuoshi, ctx, {
    qidBase: `cuoshi-${battle.id}`,
    source: "錯史",
    onWin: () => {
      state.cuoshi.phase = "done";
      paintCuoshi(ctx);
    },
  });
}

function bindCuoshiListBack(host, ctx) {
  host.querySelectorAll("[data-cuoshi-back]").forEach((btn) => {
    btn.addEventListener("click", () => {
      ctx.state.cuoshi = null;
      ctx.render();
    });
  });
}

function paintPageGame(host, pack, play, ctx, opts) {
  const phase = play.phase || "spot";
  if (phase === "fix") paintPageFix(host, pack, play, ctx, opts);
  else paintPageSpot(host, pack, play, ctx, opts);
}

function paintPageSpot(host, pack, play, ctx, opts) {
  const { toast } = ctx;
  const lines = pack.lines || [];
  const wrong = wrongLineOf(pack);
  const bar = document.getElementById("boss-bar");
  if (bar) bar.style.width = "45%";
  if (!lines.length || !wrong) {
    host.innerHTML = `
      <div class="trial-result">
        <h3>此關未載入</h3>
        <p>請強制刷新頁面後再試。</p>
        <button type="button" class="btn" data-cuoshi-back>返回關卡列表</button>
      </div>`;
    bindCuoshiListBack(host, ctx);
    return;
  }
  const missCount = (play.miss || []).length;
  const hint = missCount >= 2 && pack.spotHint ? `<p class="cuoshi-hint">${pack.spotHint}</p>` : "";
  host.innerHTML = `
    <div class="cuoshi-folio">
      <p class="eyebrow">${pack.title || "殘卷"} · 辨錯</p>
      <div class="cuoshi-page">
        <p class="cuoshi-page-mark">殘卷</p>
        <h3 class="cuoshi-page-title">${pack.pageTitle || ""}</h3>
        <p class="muted">${pack.spotLead || "撳一撳，找出寫錯嘅一句。"}</p>
        ${hint}
        <div class="cuoshi-lines">
          ${lines
            .map((ln) => {
              const miss = (play.miss || []).includes(ln.id);
              return `<button type="button" class="cuoshi-line${miss ? " is-miss" : ""}" data-line="${ln.id}">${ln.text}${miss ? "<small>非此句，可再撳其他</small>" : ""}</button>`;
            })
            .join("")}
        </div>
      </div>
    </div>`;
  host.querySelectorAll("[data-line]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (play.locked) return;
      const id = btn.dataset.line;
      const ok = id === wrong.id;
      const line = lines.find((l) => l.id === id);
      ctx.submitAnswer?.(ok ? XP_REWARDS.mcCorrect || 8 : 0, {
        correct: ok,
        wrong: !ok,
        skill: pack.fix?.skill || "timeline",
        qid: `${opts.qidBase}-line-${id}`,
        qText: line?.text || "",
        source: opts.source || "錯史",
        chapterId: opts.chapterId || "",
        keepView: true,
      });
      if (!ok) {
        play.miss = [...new Set([...(play.miss || []), id])];
        toast("呢句無問題——再搵寫錯嗰句");
        paintPageSpot(host, pack, play, ctx, opts);
        return;
      }
      play.locked = true;
      play.phase = "fix";
      toast("搵到錯句！而家改返正確");
      paintPageFix(host, pack, play, ctx, opts);
    });
  });
}

function paintPageFix(host, pack, play, ctx, opts) {
  const { toast } = ctx;
  play.locked = false;
  const wrong = wrongLineOf(pack);
  const fix = pack.fix || { prompt: "", options: [], answer: 0 };
  const bar = document.getElementById("boss-bar");
  if (bar) bar.style.width = "75%";
  host.innerHTML = `
    <div class="cuoshi-folio">
      <p class="eyebrow">${pack.title || "殘卷"} · 修正</p>
      <div class="cuoshi-page">
        <p class="cuoshi-page-mark">殘卷</p>
        <h3 class="cuoshi-page-title">${pack.pageTitle || ""}</h3>
        <p class="cuoshi-wrong-quote">錯句：「${wrong?.text || ""}」</p>
        <div class="q-text">${fix.prompt || "呢句應該點改？"}</div>
        <div class="options">
          ${(fix.options || []).map((o, idx) => `<button type="button" class="option" data-fix="${idx}">${o}</button>`).join("")}
        </div>
      </div>
    </div>`;
  host.querySelectorAll("[data-fix]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (play.locked) return;
      const ok = Number(btn.dataset.fix) === Number(fix.answer);
      ctx.submitAnswer?.(ok ? XP_REWARDS.mcCorrect || 8 : 0, {
        correct: ok,
        wrong: !ok,
        skill: fix.skill || "recall",
        qid: `${opts.qidBase}-fix`,
        qText: fix.prompt || "",
        source: opts.source || "錯史",
        chapterId: opts.chapterId || "",
        keepView: true,
      });
      if (!ok) {
        toast("未中——再揀一次（可重試）");
        return;
      }
      play.locked = true;
      toast(fix.explain || "史頁已改妥");
      opts.onWin?.();
    });
  });
}

function blankStageQuiz() {
  return {
    index: 0,
    correct: 0,
    locked: false,
    pick: null,
    wrong: [],
    phase: "main",
    mastered: false,
    retried: false,
    corrected: false,
    firstCorrect: 0,
    firstTotal: 0,
    retryCorrect: 0,
  };
}

function bindStageRuntime(user, ctx) {
  const { state, render, toast, reward } = ctx;
  const quizRoot = document.getElementById("stage-quiz");
  if (quizRoot) {
    const ch = CHAPTERS[quizRoot.dataset.chapter];
    const stage = ch.stages.find((s) => s.id === quizRoot.dataset.stage);
    const qs = stage.questions || [];
    state.stageQuiz = state.stageQuiz || blankStageQuiz();
    paintQuiz(qs, state, ch, stage, ctx);
  }
  const bossRoot = document.getElementById("boss-stage");
  if (bossRoot) {
    paintBoss(bossRoot, ctx);
  }
}

function quizPool(qs, quiz) {
  return quiz.phase === "retry" ? quiz.wrong : qs;
}

function paintQuizSettle(qs, state, ch, stage, ctx) {
  const { render, toast } = ctx;
  const quiz = state.stageQuiz;
  const body = document.getElementById("sq-body");
  const prog = document.getElementById("sq-progress");
  if (!body) return;
  if (prog) prog.textContent = "本關結算";
  const firstC = quiz.firstCorrect ?? quiz.correct;
  const firstT = quiz.firstTotal || qs.length;
  const retryT = quiz.retryTotal || (quiz.wrong || []).length;
  const retryC = quiz.retryCorrect || 0;
  const status = quiz.mastered ? "已掌握" : quiz.corrected || quiz.retried ? "已完成修正" : "已完成";
  const need = Math.ceil(qs.length * STAGE_MASTERY_RATE);
  const nxt = nextStageAfter(ch.id, stage.id);
  const retryLine =
    quiz.corrected || quiz.retried
      ? `<p class="settle-line ok"><strong>錯題修正</strong>：${retryC}／${retryT}</p>`
      : quiz.wrong?.length
        ? `<p class="settle-line wait"><strong>已掌握</strong>：首次 ${firstC}／${firstT}，未達八成（須答對 ${need} 題）。可做錯題重答，首次成績保留。</p>`
        : `<p class="settle-line wait"><strong>已掌握</strong>：首次 ${firstC}／${firstT}，未達八成</p>`;
  body.innerHTML = `
    <div class="stage-settle">
      <h3>本關結算</h3>
      <p class="settle-line ok"><strong>首次作答</strong>：${firstC}／${firstT}</p>
      ${
        quiz.mastered
          ? `<p class="settle-line ok"><strong>已掌握</strong>：準確率已達八成</p>`
          : retryLine
      }
      <p class="settle-line ok"><strong>關卡狀態</strong>：${status}</p>
      <p class="next-hook">${nextHook(ch.id, stage.id)}</p>
      <p class="muted">做過同識咗係兩件事。錯題重答唔會覆蓋首次成績。</p>
      <div class="row-actions">
        ${
          !quiz.mastered && !quiz.corrected && !quiz.retried && (quiz.wrong || []).length
            ? `<button type="button" class="btn" id="sq-retry">開始錯題重答</button>`
            : ""
        }
        ${
          nxt
            ? `<button type="button" class="btn" data-enter-stage="${nxt.chapterId}:${nxt.stageId}">繼續前路</button>`
            : ""
        }
        <button type="button" class="btn ${quiz.mastered || quiz.corrected ? "" : "ghost"}" id="sq-back">返回關卡</button>
      </div>
    </div>`;
  document.getElementById("sq-retry")?.addEventListener("click", () => {
    quiz.phase = "retry";
    quiz.index = 0;
    quiz.locked = false;
    quiz.pick = null;
    quiz.retryCorrect = 0;
    quiz.retryTotal = (quiz.wrong || []).length;
    paintQuiz(qs, state, ch, stage, ctx);
  });
  document.getElementById("sq-back")?.addEventListener("click", () => {
    toast(status === "已掌握" ? "本關已掌握" : status === "已完成修正" ? "本關已完成修正" : "本關已完成（尚未掌握）");
    state.scrollStage = null;
    state.view = "chapter";
    render();
  });
  body.querySelector("[data-enter-stage]")?.addEventListener("click", (e) => {
    const btn = e.currentTarget;
    const [cid, sid] = btn.dataset.enterStage.split(":");
    if (!isChapterEnterable(ctx.getUser?.() || {}, cid)) {
      toast("先完成上一章，再入本章。");
      return;
    }
    state.scrollChapter = cid;
    state.scrollStage = sid;
    state.stageQuiz = blankStageQuiz();
    state.bossStep = 0;
    state.bossPlay = null;
    state.view = "chapter";
    render();
  });
}

function advanceAfterNext(qs, state, ch, stage, ctx) {
  const quiz = state.stageQuiz;
  const pool = quizPool(qs, quiz);
  if (quiz.index + 1 < pool.length) {
    quiz.index += 1;
    quiz.locked = false;
    quiz.pick = null;
    paintQuiz(qs, state, ch, stage, ctx);
    return;
  }
  if (quiz.phase === "retry") {
    quiz.retried = true;
    quiz.corrected = true;
    quiz.retryTotal = (quiz.wrong || []).length;
    updateUser((u) =>
      settleStage(u, ch.id, stage.id, {
        completed: true,
        corrected: true,
        retried: true,
        retryCorrect: quiz.retryCorrect || 0,
        retryTotal: quiz.retryTotal,
      })
    );
    quiz.phase = "settle";
    paintQuizSettle(qs, state, ch, stage, ctx);
    return;
  }
  quiz.mastered = masteryFromScore(quiz.correct, qs.length);
  quiz.firstCorrect = quiz.correct;
  quiz.firstTotal = qs.length;
  let dropped = null;
  updateUser((u) => {
    dropped = settleStage(u, ch.id, stage.id, {
      completed: true,
      mastered: quiz.mastered,
      firstCorrect: quiz.correct,
      firstTotal: qs.length,
      correct: quiz.correct,
      total: qs.length,
    });
  });
  ctx.queueRelic?.(dropped);
  pushRecent(`完成關卡：${stage.title}${quiz.mastered ? "（已掌握）" : ""}`);
  addXp(XP_REWARDS.chapterBonus);
  quiz.phase = "settle";
  paintQuizSettle(qs, state, ch, stage, ctx);
}

function paintQuiz(qs, state, ch, stage, ctx) {
  const quiz = state.stageQuiz;
  if (quiz.phase === "settle") {
    paintQuizSettle(qs, state, ch, stage, ctx);
    return;
  }
  const pool = quizPool(qs, quiz);
  const i = quiz.index;
  const q = pool[i];
  const body = document.getElementById("sq-body");
  const prog = document.getElementById("sq-progress");
  if (!body || !q) return;
  if (prog) {
    prog.textContent =
      quiz.phase === "retry" ? `錯題重答 ${i + 1} / ${pool.length}` : `進度 ${i + 1} / ${qs.length}`;
  }
  const last = i + 1 >= pool.length;
  const nextLabel =
    quiz.phase === "retry" ? (last ? "完成錯題重答" : "明白，下一題") : last ? "完成本關題目" : "明白，下一題";

  const paintQuestion = () => {
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
      ctx.toast(q.misconception || q.explain || "先排除明顯不合理的選項");
    });
    body.querySelectorAll("[data-sq]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (quiz.locked) return;
        const pick = Number(btn.dataset.sq);
        const ok = pick === q.answer;
        quiz.locked = true;
        quiz.pick = pick;
        const recorded = ctx.submitAnswer?.(ok ? XP_REWARDS.mcCorrect : 0, {
          correct: ok,
          wrong: !ok,
          topic: q.topic,
          skill: q.skill,
          qid: q.id,
          qText: q.q,
          chapterId: ch.id,
          source: quiz.phase === "retry" ? "錯題重答" : "關卡",
          keepView: true,
        });
        if (recorded?.duplicate) {
          quiz.locked = false;
          return;
        }
        const fb = document.getElementById("sq-fb");
        fb.classList.remove("hidden");
        fb.innerHTML = ok
          ? `<strong>正確。</strong> ${q.explain || ""}`
          : `<strong>未正確。</strong> ${q.explain || ""}<br>常見誤解：${q.misconception || "再讀一次材料／選項。"}`;
        body.querySelectorAll("[data-sq]").forEach((b) => {
          b.disabled = true;
          const idx = Number(b.dataset.sq);
          if (idx === q.answer) b.classList.add("correct");
          else if (idx === pick) b.classList.add("wrong");
        });
        if (quiz.phase === "main") {
          if (ok) quiz.correct += 1;
          else if (!quiz.wrong.some((w) => w.id === q.id)) quiz.wrong.push(q);
        } else if (quiz.phase === "retry" && ok) {
          quiz.retryCorrect = (quiz.retryCorrect || 0) + 1;
        }
        const actions = body.querySelector(".row-actions");
        if (quiz.phase === "retry" && !ok) {
          actions.insertAdjacentHTML(
            "beforeend",
            `<button type="button" class="btn" id="sq-again">再試一次</button>`
          );
          document.getElementById("sq-again")?.addEventListener("click", () => {
            quiz.locked = false;
            quiz.pick = null;
            paintQuestion();
          });
        } else {
          actions.insertAdjacentHTML(
            "beforeend",
            `<button type="button" class="btn" id="sq-next">${nextLabel}</button>`
          );
          document.getElementById("sq-next")?.addEventListener("click", () => {
            advanceAfterNext(qs, state, ch, stage, ctx);
          });
        }
      });
    });
  };

  paintQuestion();
}

function paintBoss(root, ctx) {
  const { state, toast, render } = ctx;
  const ch = CHAPTERS[root.dataset.chapter];
  const stage = ch.stages.find((s) => s.id === root.dataset.stage);
  const pack = stage.boss?.cuoshiId
    ? getCuoshi(stage.boss.cuoshiId)
    : stage.boss?.pageId
      ? CHAPTER_BOSS_PAGES[stage.boss.pageId]
      : stage.boss;
  const body = document.getElementById("boss-body");
  if (!pack?.lines || !body) return;
  if (!state.bossPlay || state.bossPlay.stageKey !== `${ch.id}:${stage.id}`) {
    state.bossPlay = { stageKey: `${ch.id}:${stage.id}`, phase: "spot", miss: [] };
  }
  paintPageGame(body, { ...pack, title: stage.boss?.title || pack.title }, state.bossPlay, ctx, {
    qidBase: `boss-${ch.id}-${stage.id}`,
    source: "關卡",
    chapterId: ch.id,
    onWin: () => {
      const bar = document.getElementById("boss-bar");
      if (bar) bar.style.width = "100%";
      let dropped = null;
      updateUser((u) => {
        dropped = completeStage(u, ch.id, stage.id, { mastered: true, correct: 2, total: 2 });
      });
      ctx.queueRelic?.(dropped);
      pushRecent("擊敗錯史·章節試煉");
      addXp(XP_REWARDS.chapterBonus, { correct: true });
      toast(dropped ? `史頁修復！偶得「${dropped.name}」` : "史頁修復完成！");
      state.bossPlay = null;
      state.scrollStage = null;
      state.view = "chapter";
      render();
    },
  });
}

export function renderPromote(user, char) {
  const order = buildPromotionOrder(user);
  const snap = userSnapshot(user);
  const list = order.items
    .map((i) => {
      const mark = i.ok ? "✓" : "○";
      const extra = !i.ok && i.hint ? `<div class="muted" style="font-size:.82rem">${i.hint}</div>` : "";
      return `<li class="${i.ok ? "ok" : "wait"}"><span>${mark}</span><div>${i.label}${extra}</div></li>`;
    })
    .join("");
  const rem = openWeakRemedials(user);
  const isFinale = order.gate?.isFinale || order.gate?.trialId === "trial_ascension";
  const finale = isFinale || user.identityId >= 6 ? getFinaleState(user) : null;

  const finaleBlock =
    finale && (order.canChallenge || order.trialPassed || user.identityId >= 6)
      ? `
    <div class="finale-board">
      <h3>終章試煉：天下待定</h3>
      <p class="lead">三段試煉可分開完成。全部通過後即可登基，解鎖帝王／女帝稱謂與造型。</p>
      <div class="finale-segs">
        ${finale.segs
          .map(
            (s) => `
          <article class="chapter-card ${s.done ? "done" : ""}">
            <h3>${s.title} ${s.done ? "✓" : ""}</h3>
            <p>${s.blurb}</p>
            <p class="muted">${s.done ? `已通過（${Math.round(s.saved.avg)} 分）` : "尚未完成"}</p>
            <button type="button" class="btn ${s.done ? "ghost" : ""}" data-finale-seg="${s.id}"
              ${order.canChallenge || order.trialPassed || user.identityId >= 6 ? "" : "disabled"}>
              ${s.done ? "重溫本段" : "開始本段"}
            </button>
          </article>`
          )
          .join("")}
      </div>
      ${
        finale.allDone
          ? `<p class="ink-gold">三段皆過——可確認登基，解鎖帝王／女帝。</p>
             <button type="button" class="btn gold" id="btn-confirm-promote">確認登基</button>`
          : ""
      }
    </div>`
      : "";

  return `
  <section class="panel-paper promote-view">
    <p class="eyebrow ink-gold">晉升殿 · ${realmLabel(snap.stageId)}</p>
    <h2>等級累積經驗 · 試煉解鎖身份</h2>
    <p class="lead disclaimer">${IDENTITY_DISCLAIMER}</p>
    <div class="level-band-table" style="display:grid;gap:.35rem;margin:0 0 1rem;font-size:.9rem">
      ${levelBandLines(user.gender)
        .map((b) => {
          const on = snap.stageId === b.id;
          return `<div style="display:flex;justify-content:space-between;gap:1rem;padding:.35rem .55rem;border-radius:6px;background:${on ? "rgba(215,170,80,.18)" : "transparent"};border:1px solid ${on ? "var(--gold, #d7aa50)" : "transparent"}">
            <strong>${b.name}</strong><span>${b.range}${on ? " · 當前" : ""}</span>
          </div>`;
        })
        .join("")}
    </div>
    <div class="promote-layout">
      <div class="promote-silhouette">
        ${renderHeroStage(char, snap.stageId, "lg", { gender: user.gender, priorityBoost: true, preferStageArt: true })}
        <p>當前：<strong>${snap.identityName}</strong> · Lv.${snap.level.level}</p>
      </div>
      <div class="edict big">
        <h3>下一身份：${order.nextName || "—"}</h3>
        <ul class="edict-list">${list}</ul>
        <div class="row-actions">
          ${
            order.readyForTrial && !isFinale
              ? `<button type="button" class="btn" id="btn-trial">開始試煉</button>`
              : ""
          }
          ${!order.levelOk ? `<button type="button" class="btn" data-goto="home">去行旅升級</button>` : ""}
          ${order.levelOk && !order.tasksOk ? `<button type="button" class="btn" data-goto="scroll">去完成學習任務</button>` : ""}
          ${
            order.trialPassed && order.next && !isFinale
              ? `<button type="button" class="btn gold" id="btn-confirm-promote">確認晉升「${order.nextName}」</button>`
              : ""
          }
          <button type="button" class="btn ghost" data-goto="notes">前往札記</button>
        </div>
        ${
          rem.length
            ? `<div class="rem-box"><p>建議補強：</p>${rem
                .map((r) => `<button type="button" class="chip" data-goto="${r.goto}">${r.title}</button>`)
                .join("")}</div>`
            : ""
        }
      </div>
    </div>
    ${finaleBlock}
    <div id="trial-panel" class="hidden"></div>
  </section>`;
}

function bindPromote(user, ctx) {
  const { state, render, toast } = ctx;
  document.getElementById("btn-confirm-promote")?.addEventListener("click", () => {
    const fromId = ctx.getUser()?.identityId ?? 0;
    let toId = null;
    let name = "";
    updateUser((u) => {
      const r = applyPromotion(u);
      if (r.ok) {
        toId = r.identityId;
        name = identityDisplayName(getIdentity(r.identityId), u.gender);
        pushRecent(`晉升為${name}`);
      } else toast(r.reason);
    });
    if (name && toId != null) {
      addXp(XP_REWARDS.trialPassBonus || 40, { correct: true });
      state.promoteReveal = { fromId, toId };
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
    state.trial = { id: order.trialId, index: 0, answers: [], segId: null };
    paintTrial(ctx);
  });
  appClick("[data-finale-seg]", (btn) => {
    state.trial = {
      id: "trial_ascension",
      segId: btn.dataset.finaleSeg,
      index: 0,
      answers: [],
    };
    paintTrial(ctx);
  });
}

export function bindGrowth(user, ctx) {
  appClick("[data-growth-pick]", (btn) => {
    ctx.state.growthFocus = Number(btn.dataset.growthPick);
    ctx.state.view = "growth";
    ctx.render();
  });
}

function paintTrial(ctx) {
  const { state, toast, render } = ctx;
  const trial = getTrialData(state.trial.id);
  const panel = document.getElementById("trial-panel");
  if (!panel || !trial) return;
  panel.classList.remove("hidden");
  const seg = state.trial.segId
    ? (trial.segments || []).find((s) => s.id === state.trial.segId)
    : null;
  const scoringTrial = seg
    ? { ...trial, segments: undefined, parts: seg.parts || [], title: `${trial.title} · ${seg.title}` }
    : trial;
  const parts = flattenTrialParts(scoringTrial);
  const i = state.trial.index;
  if (i >= parts.length) {
    const result = scoreTrial(scoringTrial, state.trial.answers);
    const fromId = ctx.getUser()?.identityId ?? 0;
    let promoted = null;
    updateUser((u) => {
      if (seg) {
        saveFinaleSegment(u, seg.id, result, state.trial.answers);
      } else {
        u.progress.trials[trial.id] = {
          passed: result.passed,
          avg: result.avg,
          at: Date.now(),
          fails: result.fails,
        };
        if (result.passed) {
          const r = applyPromotion(u);
          if (r.ok) {
            promoted = {
              toId: r.identityId,
              name: identityDisplayName(getIdentity(r.identityId), u.gender),
            };
          }
        }
      }
    });
    if (promoted) {
      addXp(XP_REWARDS.trialPassBonus || 40, { correct: true });
      pushRecent(`晉升為${promoted.name}`);
      state.promoteReveal = { fromId, toId: promoted.toId };
      toast(`試煉通過！晉升為「${promoted.name}」`);
      render();
      return;
    }
    panel.innerHTML = `
      <div class="trial-result">
        <h3>${result.passed ? (seg ? "本段通過" : "試煉通過") : "尚未通過——進度保留"}</h3>
        <p>總分 ${Math.round(result.avg)}｜史料 ${Math.round(result.sourceAvg)}｜論證 ${Math.round(result.argueAvg)}</p>
        ${
          result.passed
            ? `<p>${seg ? "可繼續下一段，或返回晉升殿。" : "可按「確認晉升」完成身份躍升。"}</p>`
            : `<ul>${result.fails.map((f) => `<li>${f}</li>`).join("")}</ul>
               <p>完成補強後可再挑戰<strong>另一組同等難度</strong>（唔使等日數）。</p>`
        }
        <button type="button" class="btn" data-goto="promote">${seg ? "返回終章" : "返回晉升殿"}</button>
      </div>`;
    if (result.passed) {
      pushRecent(seg ? `通過終章·${seg.title}` : `通過${trial.title}`);
      toast(seg ? "本段通過！進度已儲存" : "試煉通過！可確認晉升");
    } else toast("未通過——看看弱項再練");
    return;
  }
  const part = parts[i];
  panel.innerHTML = `
    <div class="trial-q stage-play">
      <p class="eyebrow">考核 ${i + 1}/${parts.length} · 提示較少</p>
      <h3>${seg ? seg.title : trial.title}</h3>
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
    if (part.type === "argue" || (!part.options && part.skill === "argue")) {
      updateUser((u) =>
        queueReview(u, {
          trialId: trial.id,
          trialTitle: seg ? seg.title : trial.title,
          q: part.q,
          answer: ans,
        })
      );
    }
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
    <p class="eyebrow ink-red">趣味關卡 · 待考札記</p>
    <h2>待考札記</h2>
    <p class="lead">錯題變成修練——指出弱項，補強後再戰。長卷可重答；考核另用新題。</p>
    <div class="note-grid">${cards || "<p>暫無未掌握錯題。繼續長卷或趣味關卡吧。</p>"}</div>
    <div class="row-actions">
      <button type="button" class="btn ghost" data-goto="games">返回大廳</button>
      <button type="button" class="btn" data-goto="scroll">去長卷</button>
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
  const entries = chronicleEntries(user);
  const relics = user.progress?.relics || [];
  const name = heroDisplayName(user, char);
  const rows = entries.length
    ? entries
        .map(
          (e) => `<li class="ledger-${e.kind}">
      <time>${e.when}</time>
      <span class="ledger-mark">${e.kind === "promote" ? "晉升" : "入冊"}</span>
      <span class="ledger-title">${e.title}</span>
    </li>`
        )
        .join("")
    : `<li class="ledger-empty">尚未入冊。去長卷過關或打錯史，史頁就會寫入呢度。</li>`;
  const stamps = relics.length
    ? `<div class="chronicle-seals">
        <h3>信物印記</h3>
        <div class="relic-tray">${relics
          .map((r) => `<span class="relic-stamp" title="${String(r.hint || "").replace(/"/g, "&quot;")}">${r.name}</span>`)
          .join("")}</div>
      </div>`
    : "";
  return `
  <section class="panel-paper chronicle">
    <p class="eyebrow ink-red">私人藏本</p>
    <h2>我的史冊</h2>
    <p class="lead">呢度係你自己寫成嘅書：過關、錯史、晉升都會按時間入冊。</p>
    <ol class="chronicle-ledger">${rows}</ol>
    ${stamps}
    <p class="chronicle-colophon">${name} 記</p>
  </section>`;
}

function restoredLabel(r) {
  if (r.chapterId === "cuoshi") {
    return getCuoshi(r.stageId)?.title || "錯史之戰";
  }
  const ch = CHAPTERS[r.chapterId];
  if (!ch) return r.stageId || r.chapterId;
  const st = (ch.stages || []).find((s) => s.id === r.stageId);
  return `${chapterShortTitle(ch)} · ${st?.title || r.stageId}`;
}

function chronicleWhen(at) {
  if (!at) return "";
  try {
    return new Date(at).toLocaleDateString("zh-HK");
  } catch {
    return "";
  }
}

function chronicleEntries(user) {
  const c = user.progress?.chronicle || {};
  const seen = new Set();
  const restored = [];
  for (const r of c.restored || []) {
    const key = `${r.chapterId}:${r.stageId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    restored.push({
      at: r.at || 0,
      kind: "restore",
      title: restoredLabel(r),
      when: chronicleWhen(r.at),
    });
  }
  const promos = (c.promotions || []).map((p) => ({
    at: p.at || 0,
    kind: "promote",
    title: `晉升為「${identityDisplayName(getIdentity(p.to), user.gender)}」`,
    when: chronicleWhen(p.at),
  }));
  return [...restored, ...promos].sort((a, b) => (a.at || 0) - (b.at || 0));
}

function appClick(sel, fn) {
  document.querySelectorAll(sel).forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      fn(el);
    });
  });
}
