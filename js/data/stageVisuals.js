/**
 * 架空遊戲美術：盛世國風 × 熱血角色
 * 身份 id：0 庶民 … 7 帝王（已取消奴隸／婢女）
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
    scene: "城門外大道",
    sceneKey: "street",
    pose: "肩背行囊，迎向晨光",
    poseKey: "ready",
    prop: "行囊",
    propKey: "bag",
    accent: "#c84436",
    bgHint: "米白短衣與晨光",
    quote: "少年有志，自此登程。",
    vibe: "少年出發",
    priority: true,
  },
  1: {
    id: 1,
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
  2: {
    id: 2,
    scene: "開闊高臺",
    sceneKey: "study",
    pose: "立於高臺，遠山雲海",
    poseKey: "writing",
    prop: "青藍外袍",
    propKey: "brush",
    accent: "#246b87",
    bgHint: "白衣配青藍",
    quote: "初露鋒芒，志在天下。",
    vibe: "初露鋒芒",
    priority: true,
  },
  3: {
    id: 3,
    scene: "朱門石階",
    sceneKey: "yamen",
    pose: "持文書登階，回望前路",
    poseKey: "document",
    prop: "文書／官牌",
    propKey: "docs",
    accent: "#246b87",
    bgHint: "青袍與朱紅宮門",
    quote: "初露鋒芒，志在天下。",
    vibe: "初仕登門",
    priority: true,
  },
  4: {
    id: 4,
    scene: "高閣俯瞰城郭",
    sceneKey: "hall",
    pose: "手按地圖與玉印，遠望城池",
    poseKey: "map",
    prop: "地圖／玉印",
    propKey: "map",
    accent: "#246b87",
    bgHint: "青袍金繡與夕照城郭",
    quote: "安民重任。",
    vibe: "主政安民",
    priority: true,
  },
  5: {
    id: 5,
    scene: "殿閣議事堂",
    sceneKey: "court",
    pose: "展卷批閱，玉印在側",
    poseKey: "counsel",
    prop: "奏卷／玉印",
    propKey: "seal",
    accent: "#d7aa50",
    bgHint: "藍袍金繡與殿內陽光",
    quote: "權愈重，愈要敢於自問。",
    vibe: "重臣議事",
    priority: true,
  },
  6: {
    id: 6,
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
  7: {
    id: 7,
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
  const id = Math.min(7, Math.max(0, Number(identityId) || 0));
  return STAGE_VISUALS[id] || STAGE_VISUALS[0];
}

/** 階段專屬海報（key = 新身份 id） */
export const STAGE_ART = {
  0: {
    male: "assets/stages/shumin-male.jpg",
    female: "assets/stages/shumin-female.jpg",
    badge: "① 庶民｜Lv.1–5",
    label: "庶民登場",
  },
  1: {
    male: "assets/stages/xuezi-male.jpg",
    female: "assets/stages/xuezi-female.jpg",
    badge: "② 學子｜Lv.6–15",
    label: "學子登場",
  },
  2: {
    male: "assets/stages/shiren-male.jpg",
    female: "assets/stages/shiren-female.jpg",
    badge: "③ 士人｜Lv.16–25",
    label: "士人登場",
  },
  3: {
    male: "assets/stages/chushi-male.jpg",
    female: "assets/stages/chushi-female.jpg",
    badge: "④ 初仕｜Lv.26–40",
    label: "初仕登場",
  },
  4: {
    male: "assets/stages/zhuzheng-male.jpg",
    female: "assets/stages/zhuzheng-female.jpg",
    badge: "⑤ 主政｜Lv.41–55",
    label: "主政登場",
  },
  5: {
    male: "assets/stages/zhongchen-male.jpg",
    female: "assets/stages/zhongchen-female.jpg",
    badge: "⑥ 重臣｜Lv.56–70",
    label: "重臣登場",
  },
};

export function getStageArt(identityId, gender = "male") {
  const id = Math.min(7, Math.max(0, Number(identityId) || 0));
  const pack = STAGE_ART[id];
  if (!pack) return null;
  const g = gender === "female" ? "female" : "male";
  const src = pack[g] || pack.male;
  if (!src) return null;
  return { ...pack, src, gender: g };
}

/** 庶民＝第一境；士人＝第三境 */
export function realmLabel(identityId) {
  const id = Math.min(7, Math.max(0, Number(identityId) || 0));
  const map = ["一", "二", "三", "四", "五", "六", "七", "八"];
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
