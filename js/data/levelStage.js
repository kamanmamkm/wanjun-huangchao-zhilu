/**
 * 角色等級 ↔ 階段立繪／身份形象
 * 等級靠經驗；身份／造型只跟 identityId（試煉解鎖），唔再跟等級自動升。
 */
import { getIdentity, identityDisplayName, outfitForIdentity } from "./identities.js";
import {
  stageIdFromLevel,
  effectiveStageId,
  getStageVisual,
  LEVEL_STAGE_BANDS,
  nextStageMinLevel,
} from "./stageVisuals.js";

export { stageIdFromLevel, effectiveStageId, LEVEL_STAGE_BANDS, nextStageMinLevel };

/** 立繪／稱謂跟已解鎖身份，唔跟等級帶 */
export function stageIdForUser(user) {
  if (!user) return 0;
  return Math.min(7, Math.max(0, Number(user.identityId) || 0));
}

/**
 * 只校正缺省 identityId；不再按等級自動升身份。
 * @returns {null}
 */
export function syncIdentityToLevel(user) {
  if (!user) return null;
  if (typeof user.identityId !== "number" || user.identityId < 0) {
    user.identityId = 0;
  }
  if (user.progress && typeof user.progress === "object") {
    user.progress.identityId = user.identityId;
  }
  return null;
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
