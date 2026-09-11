/**
 * 兼容層：舊 import 仍可用。
 * 真正規則：levels.js（經驗等級）+ identities.js（身份晉升）
 */
export { XP_REWARDS, levelFromXp, LEVEL_THRESHOLDS } from "./levels.js";
export {
  IDENTITIES,
  getIdentity,
  identityDisplayName,
  outfitForIdentity,
  IDENTITY_DISCLAIMER,
} from "./identities.js";

import { levelFromXp } from "./levels.js";
import { getIdentity, outfitForIdentity, IDENTITIES } from "./identities.js";

/** @deprecated 僅兼容舊呼叫：勿再用 XP 直接當身份 */
export const RANKS = {
  male: IDENTITIES.map((id) => ({
    id: id.id,
    name: id.name,
    xp: 0,
    color: id.color,
    desc: id.desc,
    outfit: id.outfit.male,
  })),
  female: IDENTITIES.map((id) => ({
    id: id.id,
    name: id.altName || id.name,
    xp: 0,
    color: id.color,
    desc: id.desc,
    outfit: id.outfit.female,
  })),
};

export function outfitOf(gender, identityId) {
  return outfitForIdentity(identityId, gender);
}

/** 舊 API：改為回傳等級資訊；identity 請用 user.identityId */
export function rankFromXp(gender, xp) {
  const lv = levelFromXp(xp);
  const fake = {
    id: Math.min(7, Math.max(0, lv.level - 1)),
    name: `Lv.${lv.level}`,
    xp: lv.curXp,
    color: "#6b5b4a",
    desc: "角色等級（非身份）",
    outfit: outfitForIdentity(0, gender),
  };
  return {
    current: fake,
    next: lv.nextXp != null ? { ...fake, name: `Lv.${lv.level + 1}`, xp: lv.nextXp } : null,
    progress: lv.progress,
  };
}
