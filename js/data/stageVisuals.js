/**
 * 架空遊戲美術：盛世國風 × 熱血角色
 * （非真實歷朝通用服制／升遷）
 * 由低到高：場景愈開闊、姿態愈從容——唔係畫面愈黑。
 */
export const STAGE_RELIC = {
  id: "old_chronicle",
  label: "開局殘舊史冊",
  note: "貫穿全程的小物——從城門外出發，到宮殿廣場仍在身側。",
};

/** @type {Record<number, object>} */
export const STAGE_VISUALS = {
  0: {
    id: 0,
    scene: "晨光城門外",
    sceneKey: "courtyard",
    pose: "站直身軀，準備上路",
    poseKey: "watchful",
    prop: "紅色束帶",
    propKey: "sack",
    accent: "#c84436",
    bgHint: "金色晨光",
    quote: "路雖遠，仍要走下去。",
    vibe: "少年出發",
    priority: true,
  },
  1: {
    id: 1,
    scene: "城門外大道",
    sceneKey: "street",
    pose: "肩背行囊，迎向晨光",
    poseKey: "ready",
    prop: "行囊",
    propKey: "bag",
    accent: "#d7aa50",
    bgHint: "米白短衣與晨光",
    quote: "少年有志，自此登程。",
    vibe: "少年出發",
    priority: true,
  },
  2: {
    id: 2,
    scene: "晴朗書院",
    sceneKey: "academy",
    pose: "手持書卷，衣袖迎風",
    poseKey: "reading",
    prop: "書卷",
    propKey: "scroll",
    accent: "#246b87",
    bgHint: "翠竹白牆",
    quote: "讀史明志，意氣風發。",
    vibe: "意氣風發",
    priority: true,
  },
  3: {
    id: 3,
    scene: "開闊高臺",
    sceneKey: "study",
    pose: "立於高臺，遠山雲海",
    poseKey: "writing",
    prop: "青藍外袍",
    propKey: "brush",
    accent: "#246b87",
    bgHint: "白衣配青藍",
    quote: "心有定見，行有所往。",
    vibe: "初露鋒芒",
    priority: true,
  },
  4: {
    id: 4,
    scene: "明亮官署",
    sceneKey: "yamen",
    pose: "從容持文書，白石階前",
    poseKey: "document",
    prop: "文書",
    propKey: "docs",
    accent: "#c84436",
    bgHint: "朱紅與暖白",
    quote: "治一方，先問證據與代價。",
    vibe: "從容自信",
    priority: true,
  },
  5: {
    id: 5,
    scene: "寬闊議事廳",
    sceneKey: "hall",
    pose: "展開地圖，陽光入窗",
    poseKey: "map",
    prop: "地圖",
    propKey: "map",
    accent: "#246b87",
    bgHint: "深青與金色細節",
    quote: "一城一事，皆關民生。",
    vibe: "獨當一面",
    priority: false,
  },
  6: {
    id: 6,
    scene: "議事廳正中",
    sceneKey: "court",
    pose: "沉穩而開闊的議事姿態",
    poseKey: "counsel",
    prop: "金色細節",
    propKey: "seal",
    accent: "#d7aa50",
    bgHint: "陽光與金飾",
    quote: "權愈重，愈要敢於自問。",
    vibe: "獨當一面",
    priority: false,
  },
  7: {
    id: 7,
    scene: "城樓晴空",
    sceneKey: "tower",
    pose: "立於城樓，目光遠望",
    poseKey: "gaze",
    prop: "旗幟一角",
    propKey: "cape",
    accent: "#c84436",
    bgHint: "遼闊天空",
    quote: "天下未定，先定己心。",
    vibe: "逼近終章",
    priority: false,
  },
  8: {
    id: 8,
    scene: "宮殿廣場",
    sceneKey: "palace",
    pose: "居中登場，旗幟與晴空",
    poseKey: "sovereign",
    prop: "專屬禮服",
    propKey: "crown",
    accent: "#d7aa50",
    bgHint: "朱紅・象牙白・金色",
    quote: "盛世登場——責任亦隨之而來。",
    vibe: "盛世登場",
    priority: false,
  },
};

export function getStageVisual(identityId) {
  const id = Math.min(8, Math.max(0, Number(identityId) || 0));
  return STAGE_VISUALS[id] || STAGE_VISUALS[0];
}

/**
 * 階段專屬海報立繪（有則優先用於主頁／成長長卷大圖）
 * key = identityId
 */
export const STAGE_ART = {
  1: {
    male: "assets/stages/shumin-male.jpg",
    female: "assets/stages/shumin-female.jpg",
    badge: "① 庶民｜Lv.1–5",
    label: "庶民登場",
  },
};

export function getStageArt(identityId, gender = "male") {
  const id = Math.min(8, Math.max(0, Number(identityId) || 0));
  const pack = STAGE_ART[id];
  if (!pack) return null;
  const g = gender === "female" ? "female" : "male";
  const src = pack[g] || pack.male;
  if (!src) return null;
  return { ...pack, src, gender: g };
}

/** 士人＝第三境（id 3）；開局困境單獨標示 */
export function realmLabel(identityId) {
  const id = Math.min(8, Math.max(0, Number(identityId) || 0));
  if (id === 0) return "開局 · 困境";
  const map = ["", "一", "二", "三", "四", "五", "六", "七", "八"];
  return `第${map[id]}境`;
}

export const SKILL_BARS = [
  { key: "timeline", label: "時序" },
  { key: "cause", label: "因果" },
  { key: "source", label: "史料" },
  { key: "argue", label: "論證" },
  { key: "recall", label: "基礎" },
];

export function skillFill(skills, key) {
  const v = skills?.[key];
  if (v == null) return 0.25;
  return Math.min(1, Math.max(0, v));
}
