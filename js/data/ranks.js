/** 等級制度：偏難挑戰——需長期練習與破關才可達帝位；衣裝由簡樸漸華麗 */
export const RANKS = {
  male: [
    { id: 0, name: "奴隸", xp: 0, color: "#6b5b4a", desc: "出身微賤，以勤學為階", outfit: "粗布短褐" },
    { id: 1, name: "農夫", xp: 120, color: "#7a8f4a", desc: "耕讀並進，略識史事", outfit: "布衣短褐" },
    { id: 2, name: "士兵", xp: 320, color: "#5a6e8a", desc: "披甲執戈，初知戰史", outfit: "戎服布甲" },
    { id: 3, name: "書吏", xp: 620, color: "#4a7a6e", desc: "掌簿記史，文采漸開", outfit: "青衫儒服" },
    { id: 4, name: "縣令", xp: 1050, color: "#8a6a3a", desc: "治一方民，洞悉政體", outfit: "官袍束帶" },
    { id: 5, name: "將軍", xp: 1650, color: "#8a3a3a", desc: "統軍征伐，諳熟兵機", outfit: "錦甲戎裝" },
    { id: 6, name: "諸侯", xp: 2450, color: "#6a4a8a", desc: "裂土封疆，權傾一方", outfit: "錦衣玉帶" },
    { id: 7, name: "王", xp: 3500, color: "#b8860b", desc: "位極人臣，逼近帝位", outfit: "蟒袍華冠" },
    { id: 8, name: "皇帝", xp: 5000, color: "#c9a227", desc: "君臨天下，史識圓融", outfit: "龍袍冕旒" },
  ],
  female: [
    { id: 0, name: "婢女", xp: 0, color: "#6b5b4a", desc: "出身微賤，以勤學為階", outfit: "粗布襖裙" },
    { id: 1, name: "農婦", xp: 120, color: "#7a8f4a", desc: "耕讀並進，略識史事", outfit: "布裙短襖" },
    { id: 2, name: "女兵", xp: 320, color: "#5a6e8a", desc: "披甲執戈，初知戰史", outfit: "戎裝布甲" },
    { id: 3, name: "才女", xp: 620, color: "#4a7a6e", desc: "詩書滿腹，文采漸開", outfit: "羅衫青裙" },
    { id: 4, name: "女史", xp: 1050, color: "#8a6a3a", desc: "掌記史事，洞悉政體", outfit: "青衫束帶" },
    { id: 5, name: "女將", xp: 1650, color: "#8a3a3a", desc: "統軍征伐，諳熟兵機", outfit: "錦甲華服" },
    { id: 6, name: "郡主", xp: 2450, color: "#6a4a8a", desc: "貴胄之身，權傾一方", outfit: "錦裙珠釵" },
    { id: 7, name: "女王", xp: 3500, color: "#b8860b", desc: "位極尊貴，逼近帝位", outfit: "翟衣華飾" },
    { id: 8, name: "女皇", xp: 5000, color: "#c9a227", desc: "君臨天下，史識圓融", outfit: "鳳袍珠冠" },
  ],
};

/** 單題經驗偏低，需大量正確答題與挑戰才升級 */
export const XP_REWARDS = {
  mcCorrect: 4,
  fillCorrect: 5,
  matchPair: 3,
  wordwallRound: 10,
  timelineComplete: 12,
  dialogueGood: 6,
  streakBonus: 1,
  /** 已答過的題目再答，只得此比例經驗 */
  repeatScale: 0.25,
  shizhanWin: 28,
  shizhanLose: 8,
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

export function outfitOf(gender, rankId) {
  const list = RANKS[gender] || RANKS.male;
  const r = list[Math.min(list.length - 1, Math.max(0, rankId))];
  return r?.outfit || "布衣";
}
