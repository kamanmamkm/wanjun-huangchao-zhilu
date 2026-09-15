/**
 * 角色等級 ↔ 階段立繪／身份形象
 * 等級靠經驗；稱謂／造型取「已解鎖身份」同「等級帶」較高者。
 */
import { getIdentity, identityDisplayName, outfitForIdentity } from "./identities.js?v=rad71";
import { levelFromXp } from "./levels.js";
import {
  stageIdFromLevel,
  effectiveStageId,
  getStageVisual,
  LEVEL_STAGE_BANDS,
  nextStageMinLevel,
} from "./stageVisuals.js";

export { stageIdFromLevel, effectiveStageId, LEVEL_STAGE_BANDS, nextStageMinLevel };

/** 立繪／稱謂：身份同等級帶取較高 */
export function stageIdForUser(user) {
  if (!user) return 0;
  const lv = levelFromXp(user.xp || 0).level;
  return effectiveStageId(user.identityId, lv);
}

/**
 * 等級進入新帶時補升 identityId（只升唔降）。
 * @returns {{ fromId: number, toId: number } | null}
 */
export function syncIdentityToLevel(user) {
  if (!user) return null;
  if (typeof user.identityId !== "number" || user.identityId < 0) {
    user.identityId = 0;
  }
  const from = user.identityId;
  const lv = levelFromXp(user.xp || 0).level;
  const to = effectiveStageId(from, lv);
  user.identityId = to;
  if (user.progress && typeof user.progress === "object") {
    user.progress.identityId = to;
    if (to > from) {
      user.progress.chronicle = user.progress.chronicle || {
        promotions: [],
        restored: [],
        quotes: [],
      };
      const promos = user.progress.chronicle.promotions || [];
      if (!promos.some((p) => Number(p.to) === to && p.trialId === "level_band")) {
        promos.push({ to, at: Date.now(), trialId: "level_band", byLevel: lv });
        user.progress.chronicle.promotions = promos;
      }
    }
  }
  return to > from ? { fromId: from, toId: to } : null;
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
