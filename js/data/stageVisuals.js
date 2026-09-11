/**
 * 架空遊戲美術：同一人物 × 八個人生階段
 * （非真實歷朝通用服制／升遷）
 */
export const STAGE_RELIC = {
  id: "old_chronicle",
  label: "開局殘舊史冊",
  note: "貫穿全程的小物——從困境到終章仍在書案上。",
};

/** @type {Record<number, object>} */
export const STAGE_VISUALS = {
  0: {
    id: 0,
    scene: "院落",
    sceneKey: "courtyard",
    pose: "謹慎站立，眼神堅定",
    poseKey: "watchful",
    prop: "空布袋",
    propKey: "sack",
    accent: "#6b5b4a",
    bgHint: "土灰與褐色",
    quote: "路雖遠，仍要走下去。",
    priority: false, // MVP 優先差異：庶民／學子／縣令
  },
  1: {
    id: 1,
    scene: "街巷",
    sceneKey: "street",
    pose: "挺直站立，準備出發",
    poseKey: "ready",
    prop: "腰間布袋",
    propKey: "bag",
    accent: "#7a8f4a",
    bgHint: "暖米色",
    quote: "脫籍之後，才剛開始。",
    priority: true,
  },
  2: {
    id: 2,
    scene: "書院",
    sceneKey: "academy",
    pose: "側身閱讀",
    poseKey: "reading",
    prop: "書卷",
    propKey: "scroll",
    accent: "#35665b",
    bgHint: "青綠",
    quote: "讀史，亦是在尋路。",
    priority: true,
  },
  3: {
    id: 3,
    scene: "書齋",
    sceneKey: "study",
    pose: "執筆思考",
    poseKey: "writing",
    prop: "毛筆",
    propKey: "brush",
    accent: "#4a7a6e",
    bgHint: "青藍",
    quote: "不止知其事，更要明其理。",
    priority: false,
  },
  4: {
    id: 4,
    scene: "官署",
    sceneKey: "yamen",
    pose: "持文書立於案前",
    poseKey: "document",
    prop: "文書",
    propKey: "docs",
    accent: "#a3312b",
    bgHint: "朱紅細節",
    quote: "治一方，先問證據與代價。",
    priority: true,
  },
  5: {
    id: 5,
    scene: "議事廳",
    sceneKey: "hall",
    pose: "展開地圖議事",
    poseKey: "map",
    prop: "地圖",
    propKey: "map",
    accent: "#8a3a3a",
    bgHint: "深青與暗金",
    quote: "一城一事，皆關民生。",
    priority: false,
  },
  6: {
    id: 6,
    scene: "朝堂外廊",
    sceneKey: "court",
    pose: "沉穩議事",
    poseKey: "counsel",
    prop: "印信",
    propKey: "seal",
    accent: "#6a4a8a",
    bgHint: "深色與暗金",
    quote: "權愈重，愈要敢於自問。",
    priority: false,
  },
  7: {
    id: 7,
    scene: "城樓",
    sceneKey: "tower",
    pose: "立於城樓，目光望遠",
    poseKey: "gaze",
    prop: "披風一角",
    propKey: "cape",
    accent: "#b8860b",
    bgHint: "深墨色",
    quote: "天下未定，先定己心。",
    priority: false,
  },
  8: {
    id: 8,
    scene: "宮殿",
    sceneKey: "palace",
    pose: "正式站姿",
    poseKey: "sovereign",
    prop: "終章冠飾",
    propKey: "crown",
    accent: "#c9a227",
    bgHint: "朱紅與金色",
    quote: "登基不是終點——是另一種責任。",
    priority: false,
  },
};

export function getStageVisual(identityId) {
  const id = Math.min(8, Math.max(0, Number(identityId) || 0));
  return STAGE_VISUALS[id] || STAGE_VISUALS[0];
}

/** 技能條顯示用 */
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
