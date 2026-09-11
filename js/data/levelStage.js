/**
 * 角色等級 ↔ 階段立繪／身份形象
 * 規則：到達等級帶下限即自動轉稱謂＋頭像（無需考核）
 */
import { levelFromXp } from "./levels.js";
import { getIdentity, identityDisplayName, outfitForIdentity } from "./identities.js";
import {
  stageIdFromLevel,
  effectiveStageId,
  getStageVisual,
  LEVEL_STAGE_BANDS,
  nextStageMinLevel,
} from "./stageVisuals.js";

export { stageIdFromLevel, effectiveStageId, LEVEL_STAGE_BANDS, nextStageMinLevel };

/** 依目前 XP 得出應顯示嘅階段 id（立繪／稱謂） */
export function stageIdForUser(user) {
  if (!user) return 0;
  const lv = levelFromXp(user.xp).level;
  return effectiveStageId(user.identityId, lv);
}

/**
 * 等級落入海報等級帶時，自動升身份（Lv.6→學子等）
 * 同步寫入 identityId，令稱謂／頭像／主題一致
 * @returns {{ from: number, to: number, level: number } | null}
 */
export function syncIdentityToLevel(user) {
  if (!user) return null;
  if (typeof user.identityId !== "number" || user.identityId < 0) {
    user.identityId = 0;
  }
  if (!user.progress || typeof user.progress !== "object") {
    user.progress = {
      identityId: user.identityId,
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
  const lv = levelFromXp(user.xp).level;
  const band = stageIdFromLevel(lv);
  const cur = Math.min(7, Math.max(0, Number(user.identityId) || 0));
  if (band <= cur) return null;
  const from = cur;
  user.identityId = band;
  if (user.progress) user.progress.identityId = band;
  const p = user.progress;
  p.chronicle = p.chronicle || { promotions: [], restored: [], quotes: [] };
  p.chronicle.promotions = p.chronicle.promotions || [];
  // 避免同一等級帶重複寫入多筆
  const last = p.chronicle.promotions[p.chronicle.promotions.length - 1];
  if (!(last && last.to === band && last.trialId === "level_band")) {
    p.chronicle.promotions.push({
      from,
      to: band,
      at: Date.now(),
      trialId: "level_band",
      byLevel: lv,
    });
  }
  return { from, to: band, level: lv };
}

export function stageDisplayName(user, gender) {
  const id = stageIdForUser(user);
  return identityDisplayName(getIdentity(id), gender || user?.gender);
}

export function stageOutfit(user, gender) {
  return outfitForIdentity(stageIdForUser(user), gender || user?.gender);
}

export function stageVisualForUser(user) {
  return getStageVisual(stageIdForUser(user));
}

/** 給晉升殿顯示嘅等級帶說明 */
export function levelBandLines(gender) {
  return LEVEL_STAGE_BANDS.map((b) => {
    const idn = getIdentity(b.id);
    const name = identityDisplayName(idn, gender);
    return {
      ...b,
      name,
      range: `Lv.${b.minLevel}–${b.maxLevel}`,
    };
  });
}
