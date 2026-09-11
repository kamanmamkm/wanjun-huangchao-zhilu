/**
 * 架空遊戲美術：暗黑國風史詩方向
 * （非真實歷朝通用服制／升遷）
 */
export const STAGE_RELIC = {
  id: "old_chronicle",
  label: "開局殘舊史冊",
  note: "貫穿全程的小物——從孤身求存到坐鎮天下仍在身側。",
};

/** @type {Record<number, object>} */
export const STAGE_VISUALS = {
  0: {
    id: 0,
    scene: "雨夜院落",
    sceneKey: "courtyard",
    pose: "獨自站立，眼神堅定",
    poseKey: "watchful",
    prop: "纏布護腕",
    propKey: "sack",
    accent: "#78969b",
    bgHint: "雨夜冷光",
    quote: "路雖遠，仍要走下去。",
    vibe: "孤身求存",
    priority: true,
  },
  1: {
    id: 1,
    scene: "街巷晨霧",
    sceneKey: "street",
    pose: "挺直站立，準備出發",
    poseKey: "ready",
    prop: "腰間布袋",
    propKey: "bag",
    accent: "#78969b",
    bgHint: "冷青灰霧",
    quote: "脫籍之後，征程才剛開始。",
    vibe: "踏入世間",
    priority: true,
  },
  2: {
    id: 2,
    scene: "風起竹林",
    sceneKey: "academy",
    pose: "手握書卷，衣袖揚起",
    poseKey: "reading",
    prop: "書卷",
    propKey: "scroll",
    accent: "#5a8a82",
    bgHint: "深青長衫氣場",
    quote: "讀史，亦是在尋路。",
    vibe: "求學立志",
    priority: true,
  },
  3: {
    id: 3,
    scene: "高門階前",
    sceneKey: "study",
    pose: "立於階前，門扉半開",
    poseKey: "writing",
    prop: "簡潔佩飾",
    propKey: "brush",
    accent: "#6a8a9a",
    bgHint: "墨藍與側光",
    quote: "心有定見，行有所往。",
    vibe: "立言立身",
    priority: true,
  },
  4: {
    id: 4,
    scene: "朱門石階",
    sceneKey: "yamen",
    pose: "挺拔持文書，兩側燈火",
    poseKey: "document",
    prop: "文書",
    propKey: "docs",
    accent: "#a83232",
    bgHint: "朱紅燈火",
    quote: "治一方，先問證據與代價。",
    vibe: "入仕治政",
    priority: true,
  },
  5: {
    id: 5,
    scene: "陰影殿堂",
    sceneKey: "hall",
    pose: "站於地圖案前",
    poseKey: "map",
    prop: "地圖",
    propKey: "map",
    accent: "#a83232",
    bgHint: "深墨配暗紅",
    quote: "一城一事，皆關民生。",
    vibe: "權責加重",
    priority: false,
  },
  6: {
    id: 6,
    scene: "殿堂陰影",
    sceneKey: "court",
    pose: "沉穩議事，氣場壓場",
    poseKey: "counsel",
    prop: "印信",
    propKey: "seal",
    accent: "#b79a61",
    bgHint: "深墨與舊金",
    quote: "權愈重，愈要敢於自問。",
    vibe: "坐鎮一方",
    priority: false,
  },
  7: {
    id: 7,
    scene: "城樓遠望",
    sceneKey: "tower",
    pose: "立於城樓，目光望遠",
    poseKey: "gaze",
    prop: "披風一角",
    propKey: "cape",
    accent: "#b79a61",
    bgHint: "深墨冷光",
    quote: "天下未定，先定己心。",
    vibe: "逼近終章",
    priority: false,
  },
  8: {
    id: 8,
    scene: "殿門晨光",
    sceneKey: "palace",
    pose: "居中而立，殿門在後",
    poseKey: "sovereign",
    prop: "專屬冠飾",
    propKey: "crown",
    accent: "#b79a61",
    bgHint: "晨光與舊金",
    quote: "登基不是終點——是另一種責任。",
    vibe: "坐鎮天下",
    priority: false,
  },
};

export function getStageVisual(identityId) {
  const id = Math.min(8, Math.max(0, Number(identityId) || 0));
  return STAGE_VISUALS[id] || STAGE_VISUALS[0];
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
