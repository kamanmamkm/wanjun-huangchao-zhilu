/** 等級制度：中等難度，需持續答題與挑戰才可升至皇帝／女皇 */
export const RANKS = {
  male: [
    { id: 0, name: "奴隸", xp: 0, color: "#6b5b4a", desc: "出身微賤，以勤學為階" },
    { id: 1, name: "農夫", xp: 45, color: "#7a8f4a", desc: "耕讀並進，略識史事" },
    { id: 2, name: "士兵", xp: 110, color: "#5a6e8a", desc: "披甲執戈，初知戰史" },
    { id: 3, name: "書吏", xp: 200, color: "#4a7a6e", desc: "掌簿記史，文采漸開" },
    { id: 4, name: "縣令", xp: 310, color: "#8a6a3a", desc: "治一方民，洞悉政體" },
    { id: 5, name: "將軍", xp: 450, color: "#8a3a3a", desc: "統軍征伐，諳熟兵機" },
    { id: 6, name: "諸侯", xp: 620, color: "#6a4a8a", desc: "裂土封疆，權傾一方" },
    { id: 7, name: "王", xp: 820, color: "#b8860b", desc: "位極人臣，逼近帝位" },
    { id: 8, name: "皇帝", xp: 1050, color: "#c9a227", desc: "君臨天下，史識圓融" },
  ],
  female: [
    { id: 0, name: "婢女", xp: 0, color: "#6b5b4a", desc: "出身微賤，以勤學為階" },
    { id: 1, name: "農婦", xp: 45, color: "#7a8f4a", desc: "耕讀並進，略識史事" },
    { id: 2, name: "女兵", xp: 110, color: "#5a6e8a", desc: "披甲執戈，初知戰史" },
    { id: 3, name: "才女", xp: 200, color: "#4a7a6e", desc: "詩書滿腹，文采漸開" },
    { id: 4, name: "女史", xp: 310, color: "#8a6a3a", desc: "掌記史事，洞悉政體" },
    { id: 5, name: "女將", xp: 450, color: "#8a3a3a", desc: "統軍征伐，諳熟兵機" },
    { id: 6, name: "郡主", xp: 620, color: "#6a4a8a", desc: "貴胄之身，權傾一方" },
    { id: 7, name: "女王", xp: 820, color: "#b8860b", desc: "位極尊貴，逼近帝位" },
    { id: 8, name: "女皇", xp: 1050, color: "#c9a227", desc: "君臨天下，史識圓融" },
  ],
};

export const XP_REWARDS = {
  mcCorrect: 8,
  fillCorrect: 10,
  matchPair: 6,
  wordwallRound: 18,
  timelineComplete: 22,
  dialogueGood: 12,
  streakBonus: 3,
};

export function rankFromXp(gender, xp) {
  const list = RANKS[gender] || RANKS.male;
  let current = list[0];
  for (const r of list) {
    if (xp >= r.xp) current = r;
  }
  const next = list.find((r) => r.xp > xp) || null;
  const prevXp = current.xp;
  const nextXp = next ? next.xp : current.xp;
  const progress =
    next && nextXp > prevXp ? ((xp - prevXp) / (nextXp - prevXp)) * 100 : 100;
  return { current, next, progress: Math.min(100, Math.max(0, progress)) };
}
