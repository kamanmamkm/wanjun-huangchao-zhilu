/**
 * 玩家角色：只分男女樣貌殼，開局自訂名字。
 * 已取消二十個歷史人物可選原型。
 */

const MALE_LOOK = {
  gender: "male",
  skin: "#f0c8a8",
  hair: "#1a1410",
  eye: "#5c3a22",
  lip: "#b06a5a",
  style: "traveler",
  robe: "#fff4e4",
  robe2: "#e8d4b0",
  accent: "#c84436",
  hat: "none",
};

const FEMALE_LOOK = {
  gender: "female",
  skin: "#f6d8c4",
  hair: "#1a1410",
  eye: "#6b4028",
  lip: "#d07070",
  style: "traveler",
  robe: "#fff4e4",
  robe2: "#e8d4b0",
  accent: "#c84436",
  hat: "none",
  hairdo: "simple",
};

/** @deprecated 保留匯出相容；實際只有男女各一殼 */
export const CHARACTERS = {
  male: [
    {
      id: "hero_male",
      name: "行者",
      era: "架空",
      motto: "歷千年風雨，成就我人生",
      color: "#246b87",
      look: MALE_LOOK,
    },
  ],
  female: [
    {
      id: "hero_female",
      name: "行者",
      era: "架空",
      motto: "歷千年風雨，成就我人生",
      color: "#c84436",
      look: FEMALE_LOOK,
    },
  ],
};

/** 史戰對手：架空名，非歷史人物 */
export const RIVALS = [
  {
    id: "rival_shadow",
    name: "錯史影",
    era: "架空",
    color: "#5a4030",
    look: { ...MALE_LOOK, robe: "#4a3c30", robe2: "#2a241c", accent: "#d7aa50" },
  },
  {
    id: "rival_scroll",
    name: "殘卷使",
    era: "架空",
    color: "#6d597a",
    look: { ...FEMALE_LOOK, robe: "#6d597a", robe2: "#3d3550", accent: "#d7aa50" },
  },
  {
    id: "rival_ember",
    name: "偽史燼",
    era: "架空",
    color: "#8a3a3a",
    look: { ...MALE_LOOK, robe: "#8a3a3a", robe2: "#3a2018", accent: "#d7aa50" },
  },
  {
    id: "rival_mist",
    name: "迷霧史吏",
    era: "架空",
    color: "#3d5a80",
    look: { ...FEMALE_LOOK, robe: "#3d5a80", robe2: "#1f334d", accent: "#d7aa50" },
  },
];

export function getCharacter(gender) {
  const g = gender === "female" ? "female" : "male";
  return CHARACTERS[g][0];
}

/** 玩家自訂角色名；未填則「行者」 */
export function heroDisplayName(user, char) {
  const custom = String(user?.heroName || "").trim();
  if (custom) return custom;
  return char?.name || "行者";
}

export function normalizeHeroName(raw) {
  const name = String(raw || "")
    .trim()
    .replace(/\s+/g, "");
  if (!name) throw new Error("請填寫角色名");
  if (name.length < 1 || name.length > 8) throw new Error("角色名請用 1–8 個字");
  if (/[<>&"'`\\/]/.test(name)) throw new Error("角色名含有不支援的符號");
  return name;
}
