/**
 * 晉升條件評估、掌握度、錯題札記、章節進度
 */
import { levelFromXp } from "./data/levels.js";
import {
  getIdentity,
  identityDisplayName,
  nextIdentity,
  gateFor,
  outfitForIdentity,
  IDENTITY_DISCLAIMER,
  migrateIdentityId,
  STARTING_IDENTITY_ID,
  IDENTITIES,
} from "./data/identities.js";
import { CHAPTERS, REMEDIALS } from "./data/chapters.js";
import { getTrial } from "./data/trials.js";
import { stageIdFromLevel, stageIdForUser, syncIdentityToLevel, levelBandLines, nextStageMinLevel, LEVEL_STAGE_BANDS } from "./data/levelStage.js";

export {
  IDENTITY_DISCLAIMER,
  outfitForIdentity,
  getIdentity,
  identityDisplayName,
  STARTING_IDENTITY_ID,
  IDENTITIES,
  stageIdFromLevel,
  stageIdForUser,
  syncIdentityToLevel,
  levelBandLines,
  nextStageMinLevel,
  LEVEL_STAGE_BANDS,
};

function clamp01(n) {
  return Math.min(1, Math.max(0, n));
}

export function ensureProgress(user) {
  if (!user.progress) {
    user.progress = {
      identityId: user.identityId || 0,
      chapters: {},
      mastery: {},
      skills: {},
      wrongNotes: [],
      remedials: {},
      trials: {},
      chronicle: { promotions: [], restored: [], quotes: [] },
      recent: [],
    };
  }
  if (typeof user.identityId !== "number") user.identityId = STARTING_IDENTITY_ID;
  return user.progress;
}

export function userSnapshot(user) {
  syncIdentityToLevel(user);
  const p = ensureProgress(user);
  const stageId = stageIdForUser(user);
  const identity = getIdentity(stageId);
  const next = nextIdentity(Math.max(user.identityId || 0, stageId));
  const lv = levelFromXp(user.xp);
  return {
    identity,
    identityName: identityDisplayName(identity, user.gender),
    next,
    nextName: next ? identityDisplayName(next, user.gender) : null,
    level: lv,
    outfit: outfitForIdentity(stageId, user.gender),
    stageId,
    progress: p,
  };
}

/** 答題後更新掌握度／技能／章節 */
export function recordLearning(user, { topic, skill, correct, qid, qText, chapterId }) {
  const p = ensureProgress(user);
  const bump = (obj, key, ok) => {
    if (!key) return;
    const cur = obj[key] || 0.35;
    obj[key] = clamp01(ok ? cur + 0.08 : cur - 0.03);
  };
  if (topic) bump(p.mastery, topic, correct);
  if (skill) bump(p.skills, skill, correct);

  if (!correct && qText) {
    const tag = skillTagLabel(skill);
    p.wrongNotes = p.wrongNotes || [];
    const exists = p.wrongNotes.find((n) => n.qid === qid);
    if (!exists) {
      p.wrongNotes.unshift({
        id: `wn-${Date.now()}`,
        qid: qid || `x-${Date.now()}`,
        skill: skill || "recall",
        tag,
        qText: String(qText).slice(0, 120),
        status: "open",
        at: Date.now(),
      });
      p.wrongNotes = p.wrongNotes.slice(0, 40);
    }
  }

  if (correct && chapterId && CHAPTERS[chapterId]) {
    const ch = p.chapters[chapterId] || { correct: 0, stages: {} };
    ch.correct = (ch.correct || 0) + 1;
    p.chapters[chapterId] = ch;
  }
}

export function skillTagLabel(skill) {
  const map = {
    timeline: "時序未明",
    cause: "因果待辨",
    source: "史料待證",
    argue: "論證待練",
    recall: "基礎待固",
  };
  return map[skill] || "待重修";
}

export function completeStage(user, chapterId, stageId) {
  const p = ensureProgress(user);
  const ch = p.chapters[chapterId] || { correct: 0, stages: {} };
  ch.stages = ch.stages || {};
  ch.stages[stageId] = true;
  const meta = CHAPTERS[chapterId];
  if (meta?.stages?.every((s) => ch.stages[s.id])) ch.done = true;
  p.chapters[chapterId] = ch;
  p.chronicle = p.chronicle || { promotions: [], restored: [], quotes: [] };
  p.chronicle.restored.push({ chapterId, stageId, at: Date.now() });
}

export function markRemedial(user, remedialId) {
  const p = ensureProgress(user);
  const r = REMEDIALS[remedialId];
  if (!r) return;
  p.remedials[remedialId] = (p.remedials[remedialId] || 0) + 1;
}

export function markNoteMastered(user, noteId) {
  const p = ensureProgress(user);
  const n = (p.wrongNotes || []).find((x) => x.id === noteId);
  if (n) n.status = "mastered";
}

/**
 * 晉升令：等級自動轉相為主；試煉為可選加分
 */
export function buildPromotionOrder(user) {
  syncIdentityToLevel(user);
  const p = ensureProgress(user);
  const id = stageIdForUser(user);
  const gate = gateFor(id);
  const identity = getIdentity(id);
  const next = nextIdentity(id);
  const lv = levelFromXp(user.xp);
  const nextLv = nextStageMinLevel(lv.level);

  if (!next) {
    return {
      done: true,
      identity,
      next: null,
      items: [{ ok: true, label: "已達最高身份（Lv.86+ 帝王／女帝），可回顧史冊或挑戰加分試煉" }],
      canChallenge: false,
      trialId: null,
      disclaimer: IDENTITY_DISCLAIMER,
      autoLevel: true,
    };
  }

  const nextName = identityDisplayName(next, user.gender);
  const levelOk = nextLv != null && lv.level >= nextLv;
  const items = [
    {
      key: "auto-level",
      ok: levelOk,
      label: levelOk
        ? `已達 Lv.${lv.level}——稱謂／頭像應為「${identityDisplayName(identity, user.gender)}」（自動）`
        : `升至 Lv.${nextLv} 即可自動晉升為「${nextName}」並更換頭像（現 Lv.${lv.level}）`,
    },
  ];

  // 可選試煉條件（加分，不擋自動轉相）
  if (gate) {
    for (const cid of gate.chapters || []) {
      const ch = CHAPTERS[cid];
      const st = p.chapters[cid];
      const ok = !!(st?.done || (st?.correct || 0) >= (ch?.requiredCorrect || 999));
      items.push({
        key: `ch-${cid}`,
        ok,
        locked: false,
        optional: true,
        label: `【可選】完成主線「${ch?.title || cid}」以挑戰加分試`,
        goto: "scroll",
      });
    }
  }

  const chaptersOk = (gate?.chapters || []).every((cid) => {
    const ch = CHAPTERS[cid];
    const st = p.chapters[cid];
    return !!(st?.done || (st?.correct || 0) >= (ch?.requiredCorrect || 999));
  });
  const masteryOk = Object.entries(gate?.mastery || {}).every(([k, need]) => (p.mastery[k] || 0) >= need);
  const skillsOk = Object.entries(gate?.skills || {}).every(([k, need]) => (p.skills[k] || 0) >= need);
  const trialId = gate?.trialId;
  const trialPassed = trialId ? !!p.trials?.[trialId]?.passed : false;
  const canChallenge = !!(gate && chaptersOk && masteryOk && skillsOk && lv.level >= (gate.minLevel || 0) && !trialPassed);

  if (gate) {
    items.push({
      key: "trial-opt",
      ok: trialPassed,
      optional: true,
      label: trialPassed
        ? `加分試「${gate.label}」已通過`
        : `【可選】加分試「${gate.label}」——通過可獲額外經驗`,
    });
  }

  return {
    done: false,
    identity,
    next,
    gate,
    items,
    canChallenge,
    trialPassed,
    trialId,
    disclaimer: IDENTITY_DISCLAIMER,
    autoLevel: true,
    nextAutoLevel: nextLv,
  };
}

function topicLabel(k) {
  const m = {
    foundation: "基礎史識",
    figures: "人物",
    chronology: "時序",
    events: "事件",
    cause: "因果",
    institutions: "制度",
    policy: "政策",
    sources: "史料",
    synthesis: "綜合",
  };
  return m[k] || k;
}

function skillNice(k) {
  const m = {
    recall: "基礎識記",
    timeline: "時序掌握",
    cause: "因果分析",
    source: "史料分析",
    argue: "論證表達",
  };
  return m[k] || k;
}

function remedialGoto(skill) {
  if (skill === "timeline") return "timeline";
  if (skill === "argue") return "dialogue";
  return "notes";
}

export function evaluateTrialAnswer(part, answer) {
  if (!part) return { correct: false, score: 0 };
  if (part.type === "mc" || part.type === "source" || part.type === "compare") {
    const ok = Number(answer) === part.answer;
    return { correct: ok, score: ok ? 100 : 0, skill: part.skill };
  }
  if (part.type === "policy") {
    // 無單一神奇正解：選 preferred 滿分；其他選項若有後續論證仍可在 argue 補
    const ok = Number(answer) === (part.preferred ?? 0);
    return { correct: ok, score: ok ? 100 : 55, skill: part.skill };
  }
  if (part.type === "fill") {
    const t = String(answer || "").trim();
    const ok = (part.answers || []).some((a) => t === a || t.includes(a));
    return { correct: ok, score: ok ? 100 : 0, skill: part.skill };
  }
  if (part.type === "argue") {
    const t = String(answer || "");
    const hits = (part.keywords || []).filter((k) => t.includes(k)).length;
    const need = part.minHits || 2;
    const ok = hits >= need;
    const score = Math.min(100, Math.round((hits / Math.max(need, 1)) * 100));
    return { correct: ok, score, skill: part.skill, hits };
  }
  return { correct: false, score: 0 };
}

export function scoreTrial(trial, answers) {
  const parts = flattenTrialParts(trial);
  let total = 0;
  let sourceScores = [];
  let argueScores = [];
  const detail = [];
  parts.forEach((part, i) => {
    const r = evaluateTrialAnswer(part, answers[i]);
    total += r.score;
    if (part.skill === "source") sourceScores.push(r.score);
    if (part.skill === "argue") argueScores.push(r.score);
    detail.push({ ...r, part });
  });
  const avg = parts.length ? total / parts.length : 0;
  const sourceAvg = sourceScores.length
    ? sourceScores.reduce((a, b) => a + b, 0) / sourceScores.length
    : 100;
  const argueAvg = argueScores.length ? argueScores.reduce((a, b) => a + b, 0) / argueScores.length : 100;
  const passScore = trial.passScore ?? 70;
  const minSource = trial.minSource ?? 0;
  const minArgue = trial.minArgue ?? 0;
  const passed = avg >= passScore && sourceAvg >= minSource && argueAvg >= minArgue;
  const fails = [];
  if (avg < passScore) fails.push(`總分未達 ${passScore}（現 ${Math.round(avg)}）`);
  if (sourceAvg < minSource) fails.push(`史料部分未達最低 ${minSource}（現 ${Math.round(sourceAvg)}）`);
  if (argueAvg < minArgue) fails.push(`論證部分未達最低 ${minArgue}（現 ${Math.round(argueAvg)}）`);
  return { avg, sourceAvg, argueAvg, passed, fails, detail };
}

export function flattenTrialParts(trial) {
  if (!trial) return [];
  if (trial.segments) return trial.segments.flatMap((s) => s.parts || []);
  return trial.parts || [];
}

export function applyPromotion(user) {
  const order = buildPromotionOrder(user);
  if (!order.canChallenge && !order.trialPassed) return { ok: false, reason: "尚未符合挑戰條件" };
  const p = ensureProgress(user);
  const gate = order.gate;
  if (!p.trials[gate.trialId]?.passed) return { ok: false, reason: "尚未通過晉升試煉" };
  if (user.identityId >= IDENTITIES.length - 1) return { ok: false, reason: "已是最高身份" };
  user.identityId += 1;
  p.chronicle = p.chronicle || { promotions: [], restored: [], quotes: [] };
  p.chronicle.promotions.push({
    to: user.identityId,
    at: Date.now(),
    trialId: gate.trialId,
  });
  return { ok: true, identityId: user.identityId };
}

export function openWeakRemedials(user) {
  const order = buildPromotionOrder(user);
  const weak = order.items.filter((i) => !i.ok && i.key?.startsWith("s-"));
  return weak.map((i) => {
    const skill = i.key.replace("s-", "");
    const rem = Object.values(REMEDIALS).find((r) => r.skill === skill);
    return rem;
  }).filter(Boolean);
}

export function getTrialData(id) {
  return getTrial(id);
}

/** 儲存論證短答供老師覆核 */
export function queueReview(user, { trialId, trialTitle, q, answer }) {
  const p = ensureProgress(user);
  p.pendingReviews = p.pendingReviews || [];
  p.pendingReviews.unshift({
    id: `rv-${Date.now()}`,
    trialId,
    trialTitle,
    q: String(q).slice(0, 200),
    answer: String(answer).slice(0, 500),
    status: "pending",
    at: Date.now(),
  });
  p.pendingReviews = p.pendingReviews.slice(0, 30);
}

/** 終章分段進度 */
export function getFinaleState(user) {
  const p = ensureProgress(user);
  p.finale = p.finale || { segments: {} };
  const trial = getTrial("trial_ascension");
  const segs = (trial?.segments || []).map((s) => ({
    ...s,
    saved: p.finale.segments[s.id] || null,
    done: !!p.finale.segments[s.id]?.passed,
  }));
  const allDone = segs.length > 0 && segs.every((s) => s.done);
  return { trial, segs, allDone };
}

export function saveFinaleSegment(user, segId, result, answers) {
  const p = ensureProgress(user);
  p.finale = p.finale || { segments: {} };
  p.finale.segments[segId] = {
    passed: result.passed,
    avg: result.avg,
    sourceAvg: result.sourceAvg,
    argueAvg: result.argueAvg,
    fails: result.fails,
    answers,
    at: Date.now(),
  };
  // 三段皆通過 → 標記終章試煉通過
  const st = getFinaleState(user);
  if (st.allDone) {
    p.trials.trial_ascension = {
      passed: true,
      avg: 100,
      at: Date.now(),
      finale: true,
    };
  }
}

export function markCuoshiWon(user, battleId) {
  const p = ensureProgress(user);
  p.cuoshi = p.cuoshi || {};
  p.cuoshi[battleId] = { won: true, at: Date.now() };
  p.chronicle = p.chronicle || { promotions: [], restored: [], quotes: [] };
  p.chronicle.restored.push({ chapterId: "cuoshi", stageId: battleId, at: Date.now() });
}
