/** 時間線事件（人物／事件配對年代） */
export const TIMELINE_SETS = [
  {
    id: "tl1",
    title: "上古至秦漢",
    grade: "中一",
    items: [
      { id: "a", label: "西周封建", year: -1046, hint: "約公元前11世紀" },
      { id: "b", label: "秦滅六國統一", year: -221, hint: "公元前221年" },
      { id: "c", label: "張騫首次出使西域", year: -138, hint: "漢武帝時期" },
      { id: "d", label: "王莽篡漢", year: 9, hint: "公元9年" },
    ],
  },
  {
    id: "tl2",
    title: "隋唐盛世",
    grade: "中一",
    items: [
      { id: "a", label: "隋統一南北", year: 589, hint: "公元589年" },
      { id: "b", label: "唐朝建立", year: 618, hint: "公元618年" },
      { id: "c", label: "安史之亂爆發", year: 755, hint: "公元755年" },
      { id: "d", label: "唐朝滅亡", year: 907, hint: "公元907年" },
    ],
  },
  {
    id: "tl3",
    title: "宋元明",
    grade: "中二",
    items: [
      { id: "a", label: "陳橋兵變／北宋建立", year: 960, hint: "公元960年" },
      { id: "b", label: "元朝建立（忽必烈）", year: 1271, hint: "公元1271年" },
      { id: "c", label: "明朝建立", year: 1368, hint: "公元1368年" },
      { id: "d", label: "鄭和首次下西洋", year: 1405, hint: "永樂年間" },
    ],
  },
  {
    id: "tl4",
    title: "晚清至民國",
    grade: "中二／中三",
    items: [
      { id: "a", label: "鴉片戰爭", year: 1840, hint: "公元1840年" },
      { id: "b", label: "甲午戰爭", year: 1894, hint: "公元1894年" },
      { id: "c", label: "辛亥革命", year: 1911, hint: "公元1911年" },
      { id: "d", label: "五四運動", year: 1919, hint: "公元1919年" },
    ],
  },
  {
    id: "tl5",
    title: "抗戰與當代",
    grade: "中三",
    items: [
      { id: "a", label: "九一八事變", year: 1931, hint: "公元1931年" },
      { id: "b", label: "七七事變／全面抗戰", year: 1937, hint: "公元1937年" },
      { id: "c", label: "中華人民共和國成立", year: 1949, hint: "公元1949年" },
      { id: "d", label: "改革開放啟動", year: 1978, hint: "公元1978年" },
    ],
  },
];

/** Wordwall 風格關卡：翻牌配對 + 問答衝刺 */
export const WORDWALL_ROUNDS = [
  {
    id: "ww1",
    title: "人物稱號配對",
    type: "flip",
    pairs: [
      ["秦皇", "嬴政"],
      ["武帝", "劉徹"],
      ["太宗", "李世民"],
      ["太祖（宋）", "趙匡胤"],
    ],
  },
  {
    id: "ww2",
    title: "條約與戰爭",
    type: "flip",
    pairs: [
      ["鴉片戰爭", "南京條約"],
      ["甲午戰爭", "馬關條約"],
      ["八國聯軍", "辛丑條約"],
      ["英法聯軍", "北京條約"],
    ],
  },
  {
    id: "ww3",
    title: "限時史識問答",
    type: "quiz",
    questions: [
      { q: "明太祖的姓名是？", options: ["朱元璋", "朱棣", "趙匡胤", "楊堅"], a: 0 },
      { q: "開元之治與誰有關？", options: ["唐太宗", "唐玄宗", "唐高宗", "隋煬帝"], a: 1 },
      { q: "太平天國領袖是？", options: ["李鴻章", "洪秀全", "曾國藩", "左宗棠"], a: 1 },
      { q: "西安事變扣押了誰？", options: ["蔣介石", "毛澤東", "汪精衛", "張作霖"], a: 0 },
    ],
  },
];
