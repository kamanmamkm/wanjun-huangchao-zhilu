/**
 * 角色等級（練習、小遊戲累積經驗）
 * 身份晉升：達指定等級後通過短試煉解鎖（見 identities.PROMOTION_GATES）
 */
export const XP_REWARDS = {
  mcCorrect: 4,
  fillCorrect: 5,
  matchPair: 3,
  wordwallRound: 10,
  timelineComplete: 12,
  dialogueGood: 6,
  streakBonus: 1,
  repeatScale: 0.25,
  shizhanWin: 28,
  shizhanLose: 8,
  chapterBonus: 20,
  flavorGood: 3,
  remedialBonus: 15,
  trialPassBonus: 40,
};

/** Lv.1–20 維持舊門檻，免打亂現有進度；其後延伸至 Lv.60 */
export const MAX_LEVEL = 60;

const LEVEL_THRESHOLDS_V1 = [
  0, 40, 90, 150, 220, 300, 400, 520, 660, 820, 1000, 1220, 1480, 1780, 2120, 2500, 2950, 3450, 4000, 4600,
];

function buildLevelThresholds(maxLevel = MAX_LEVEL) {
  const t = [...LEVEL_THRESHOLDS_V1];
  let total = t[t.length - 1];
  for (let lv = t.length; lv < maxLevel; lv++) {
    // lv 為「即將達到的等級索引」（0-based：t[19]=Lv20 門檻）
    const cost = Math.round(90 + lv * 16 + Math.max(0, lv - 20) * 10);
    total += cost;
    t.push(total);
  }
  return t;
}

/** 累計 XP 門檻：THRESHOLDS[i] = 達到 Lv.(i+1) 所需 */
export const LEVEL_THRESHOLDS = buildLevelThresholds(MAX_LEVEL);

export function levelFromXp(xp) {
  const x = Math.max(0, xp || 0);
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (x >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  const idx = level - 1;
  const curXp = LEVEL_THRESHOLDS[idx] || 0;
  const nextXp = LEVEL_THRESHOLDS[idx + 1];
  const progress =
    nextXp != null && nextXp > curXp ? ((x - curXp) / (nextXp - curXp)) * 100 : 100;
  return {
    level,
    maxLevel: LEVEL_THRESHOLDS.length,
    curXp,
    nextXp: nextXp ?? null,
    progress: Math.min(100, Math.max(0, progress)),
  };
}
