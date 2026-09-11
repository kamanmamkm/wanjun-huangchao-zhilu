/**
 * 角色等級 ↔ 階段立繪／身份形象
 * 獨立模組，避免 storage ↔ progress 循環依賴
 */
import { levelFromXp } from "./levels.js";
import { getIdentity, identityDisplayName, outfitForIdentity } from "./identities.js";
import { stageIdFromLevel, effectiveStageId, getStageVisual } from "./stageVisuals.js";

export { stageIdFromLevel, effectiveStageId };

/** 依目前 XP 得出應顯示嘅階段 id（立繪／稱謂） */
export function stageIdForUser(user) {
  if (!user) return 0;
  const lv = levelFromXp(user.xp).level;
  return effectiveStageId(user.identityId, lv);
}

/**
 * 等級落入海報等級帶時，自動升身份（Lv.6→學子等）
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
  const p = user.progress;
  p.chronicle = p.chronicle || { promotions: [], restored: [], quotes: [] };
  p.chronicle.promotions.push({
    to: band,
    at: Date.now(),
    trialId: "level_band",
    byLevel: lv,
  });
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
