/** 古代人物原型（男女各選，登入後成為獨立角色） */
export const CHARACTERS = {
  male: [
    {
      id: "hanxin",
      name: "韓信",
      era: "秦漢",
      motto: "多多益善，決勝千里",
      emoji: "⚔️",
      color: "#3d5a80",
    },
    {
      id: "zhuge",
      name: "諸葛亮",
      era: "三國",
      motto: "鞠躬盡瘁，死而後已",
      emoji: "🪶",
      color: "#2d6a4f",
    },
    {
      id: "yuefei",
      name: "岳飛",
      era: "宋",
      motto: "精忠報國，還我河山",
      emoji: "🛡️",
      color: "#9b2226",
    },
    {
      id: "zhenghe",
      name: "鄭和",
      era: "明",
      motto: "七下西洋，揚威遠洋",
      emoji: "⛵",
      color: "#0077b6",
    },
    {
      id: "simaqian",
      name: "司馬遷",
      era: "漢",
      motto: "究天人之際，通古今之變",
      emoji: "📜",
      color: "#6d597a",
    },
    {
      id: "sunwu",
      name: "孫武",
      era: "春秋",
      motto: "知己知彼，百戰不殆",
      emoji: "🏯",
      color: "#bc6c25",
    },
  ],
  female: [
    {
      id: "wuzetian",
      name: "武則天",
      era: "唐",
      motto: "臨朝稱制，開創新局",
      emoji: "👑",
      color: "#9b2226",
    },
    {
      id: "mulan",
      name: "花木蘭",
      era: "南北朝",
      motto: "代父從軍，忠孝兩全",
      emoji: "🗡️",
      color: "#3d5a80",
    },
    {
      id: "caiwenji",
      name: "蔡文姬",
      era: "漢",
      motto: "胡笳十八拍，才情絕代",
      emoji: "🎵",
      color: "#6d597a",
    },
    {
      id: "liqingzhao",
      name: "李清照",
      era: "宋",
      motto: "生當作人傑，死亦為鬼雄",
      emoji: "✒️",
      color: "#2d6a4f",
    },
    {
      id: "wangzhaojun",
      name: "王昭君",
      era: "漢",
      motto: "出塞和親，安定邊疆",
      emoji: "🌙",
      color: "#0077b6",
    },
    {
      id: "banzhao",
      name: "班昭",
      era: "漢",
      motto: "續成漢書，女史典範",
      emoji: "📚",
      color: "#bc6c25",
    },
  ],
};

export function getCharacter(gender, id) {
  return (CHARACTERS[gender] || []).find((c) => c.id === id) || null;
}
