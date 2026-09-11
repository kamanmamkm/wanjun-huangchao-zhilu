/**
 * 角色等級（靠經驗累積）——與身份晉升分開。
 * 小升級靠努力刷題；大晉升靠考核實力。
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
  remedialBonus: 15,
  trialPassBonus: 40,
};

/** Lv.1–20 經驗門檻（累計 XP） */
export const LEVEL_THRESHOLDS = [
  0, 40, 90, 150, 220, 300, 400, 520, 660, 820, 1000, 1220, 1480, 1780, 2120, 2500, 2950, 3450, 4000, 4600,
];

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
