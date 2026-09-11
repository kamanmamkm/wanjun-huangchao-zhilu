/**
 * 架空遊戲身份階梯（非真實歷史晉升制度）。
 * 核心：經驗升等級；通過考核才升身份。
 * 開局：庶民（id 0）｜已取消奴隸／婢女。
 */

export const IDENTITY_DISCLAIMER =
  "以下身份為《任平生》架空遊戲階級，並非中國歷史上通用的真實晉升制度。由庶民起步，靠考核晉升。";

export const STARTING_IDENTITY_ID = 0;

/** 男／女共用階名；顯示時女線可用 altName */
export const IDENTITIES = [
  {
    id: 0,
    key: "commoner",
    name: "庶民",
    arc: "啟程篇",
    color: "#c84436",
    outfit: { male: "米白短衣", female: "米白短襖" },
    desc: "少年出發——以平民身分踏入史識之路。",
  },
  {
    id: 1,
    key: "student",
    name: "學子",
    arc: "求學篇",
    color: "#246b87",
    outfit: { male: "青綠長衫", female: "青綠長衫" },
    desc: "認識人物、事件與時序，奠下史識根基。",
  },
  {
    id: 2,
    key: "shi",
    name: "士人",
    arc: "入仕篇",
    color: "#4a7a6e",
    outfit: { male: "白衣青袍", female: "白衣青袍" },
    desc: "能解釋因果，準備踏入公門。",
  },
  {
    id: 3,
    key: "magistrate",
    name: "初仕",
    arc: "入仕篇",
    color: "#246b87",
    outfit: { male: "青袍官服", female: "青袍官服" },
    desc: "初入公門，持文書治事——治一方民，比較政策與影響。",
  },
  {
    id: 4,
    key: "prefect",
    name: "主政",
    arc: "治政篇",
    color: "#246b87",
    outfit: { male: "青袍玉印", female: "青袍玉印" },
    desc: "一城之主——地圖在手，安民為重。",
  },
  {
    id: 5,
    key: "minister",
    name: "重臣",
    arc: "治政篇",
    color: "#243746",
    outfit: { male: "藍袍玉帶", female: "鳳冠藍袍" },
    desc: "朝堂議事——展卷批閱，權愈重愈要敢於自問。",
  },
  {
    id: 6,
    key: "lord",
    name: "諸侯",
    arc: "天下篇",
    color: "#c84436",
    outfit: { male: "紅甲金冠", female: "紅甲鳳氅" },
    desc: "臨城執旗——河山在望，逼近終章試煉。",
  },
  {
    id: 7,
    key: "sovereign",
    name: "帝王",
    altName: "女帝",
    arc: "天下篇",
    color: "#d7aa50",
    outfit: { male: "龍袍冕旒", female: "鳳袍珠冠" },
    desc: "通過終章試煉登基——宮階金暉，責任亦隨之而來。",
  },
];

/**
 * 升至「下一身份」所需條件（由 currentId 升到 currentId+1）
 */
export const PROMOTION_GATES = {
  0: {
    // 庶民 → 學子
    minLevel: 4,
    chapters: ["ch1_escape", "ch2_figures"],
    mastery: { foundation: 0.65, figures: 0.7, chronology: 0.65 },
    skills: { recall: 0.65, timeline: 0.6 },
    trialId: "trial_to_student",
    label: "求學考核",
  },
  1: {
    // 學子 → 士人
    minLevel: 6,
    chapters: ["ch3_events"],
    mastery: { events: 0.75, chronology: 0.7 },
    skills: { timeline: 0.7, cause: 0.65 },
    trialId: "trial_to_shi",
    label: "入仕預備試",
  },
  2: {
    // 士人 → 初仕
    minLevel: 8,
    chapters: ["ch4_cause"],
    mastery: { cause: 0.75, institutions: 0.7 },
    skills: { cause: 0.75, source: 0.65 },
    trialId: "trial_to_magistrate",
    label: "初仕試煉",
  },
  3: {
    // 初仕 → 主政
    minLevel: 10,
    chapters: ["ch5_policy"],
    mastery: { policy: 0.8, sources: 0.8 },
    skills: { timeline: 0.8, cause: 0.8, source: 0.8 },
    trialId: "trial_to_prefect",
    label: "主政晉升試煉",
  },
  4: {
    // 主政 → 重臣
    minLevel: 13,
    chapters: ["ch6_compare"],
    mastery: { sources: 0.82, policy: 0.8 },
    skills: { source: 0.8, argue: 0.75 },
    trialId: "trial_to_minister",
    label: "重臣試煉",
  },
  5: {
    // 重臣 → 諸侯
    minLevel: 16,
    chapters: ["ch7_synthesis"],
    mastery: { synthesis: 0.8, sources: 0.82 },
    skills: { source: 0.82, argue: 0.8, cause: 0.8 },
    trialId: "trial_to_lord",
    label: "諸侯試煉",
  },
  6: {
    // 諸侯 → 帝王：終章
    minLevel: 18,
    chapters: ["ch8_finale_prep"],
    mastery: { synthesis: 0.85, sources: 0.85, policy: 0.8 },
    skills: { timeline: 0.85, source: 0.85, argue: 0.85 },
    trialId: "trial_ascension",
    label: "終章試煉：天下待定",
    isFinale: true,
  },
};

export function getIdentity(id) {
  return IDENTITIES[Math.min(IDENTITIES.length - 1, Math.max(0, id))] || IDENTITIES[0];
}

export function identityDisplayName(identity, gender) {
  if (!identity) return "？";
  if (gender === "female" && identity.altName) return identity.altName;
  return identity.name;
}

export function outfitForIdentity(identityId, gender) {
  const idn = getIdentity(identityId);
  const g = gender === "female" ? "female" : "male";
  return idn.outfit?.[g] || idn.outfit?.male || "布衣";
}

export function nextIdentity(id) {
  if (id >= IDENTITIES.length - 1) return null;
  return IDENTITIES[id + 1];
}

export function gateFor(identityId) {
  return PROMOTION_GATES[identityId] || null;
}

/**
 * 舊版身份：0奴隸 1庶民 … 8帝王
 * 新版：0庶民 … 7帝王
 */
export function migrateIdentityId(oldId) {
  const n = typeof oldId === "number" ? oldId : 0;
  if (n <= 0) return STARTING_IDENTITY_ID; // 舊奴隸／缺省 → 庶民
  return Math.min(IDENTITIES.length - 1, n - 1);
}
