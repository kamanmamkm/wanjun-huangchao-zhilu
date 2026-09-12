/**
 * 古風姓＋名：150 男名 + 150 女名＝300 組。
 * 架空組合，避免直接用歷史名人全名。
 */

const SURNAMES = [
  "趙", "錢", "孫", "李", "周", "吳", "鄭", "王", "馮", "陳",
  "衛", "蔣", "沈", "韓", "楊", "朱", "秦", "許", "何", "呂",
  "張", "孔", "曹", "嚴", "魏", "陶", "姜", "謝", "鄒", "蘇",
  "潘", "范", "彭", "魯", "韋", "馬", "方", "俞", "任", "袁",
  "柳", "唐", "薛", "羅", "畢", "安", "于", "傅", "齊", "康",
  "歐陽", "司馬", "諸葛", "上官", "夏侯", "令狐",
];

const MALE_GIVEN = [
  "景行", "懷遠", "志遠", "承安", "守正", "明遠", "文博", "修遠", "清和", "立誠",
  "嘉樹", "永言", "季真", "伯言", "子安", "君實", "正衡", "致遠", "弘毅", "若虛",
  "通明", "厚德", "知微", "仲平", "叔清", "季朗", "公望", "載物", "元亮", "子瞻",
];

const FEMALE_GIVEN = [
  "婉清", "若蘭", "懷瑾", "清揚", "素心", "令儀", "淑慎", "靜好", "清暉", "如玉",
  "芳洲", "秋水", "晚晴", "采薇", "青梧", "疏影", "嘉音", "書凝", "墨蓮", "聽雪",
  "映月", "含章", "靈秀", "佩蘭", "慕雲", "聽竹", "清漣", "韶華", "昭寧", "宜修",
];

function uniqueCombos(surnames, givens, count) {
  const out = [];
  const seen = new Set();
  for (let gi = 0; gi < givens.length && out.length < count; gi++) {
    for (let si = 0; si < surnames.length && out.length < count; si++) {
      const name = `${surnames[si]}${givens[gi]}`;
      if (!seen.has(name) && name.length >= 2 && name.length <= 8) {
        seen.add(name);
        out.push(name);
      }
    }
  }
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const HERO_NAMES_MALE = uniqueCombos(SURNAMES, MALE_GIVEN, 150);
export const HERO_NAMES_FEMALE = uniqueCombos(SURNAMES, FEMALE_GIVEN, 150);
export const HERO_NAME_POOL = [...HERO_NAMES_MALE, ...HERO_NAMES_FEMALE];
export const HERO_NAME_COUNT = HERO_NAME_POOL.length;

export function heroNamePool(gender) {
  return gender === "female" ? HERO_NAMES_FEMALE : HERO_NAMES_MALE;
}

export function pickRandomHeroName(gender, except = "") {
  const pool = heroNamePool(gender);
  const choices = except ? pool.filter((n) => n !== except) : pool;
  if (!choices.length) return pool[0] || "任平生";
  return choices[Math.floor(Math.random() * choices.length)];
}

export function isPooledHeroName(name, gender) {
  const n = String(name || "").trim();
  if (!n) return false;
  if (gender === "female" || gender === "male") return heroNamePool(gender).includes(n);
  return HERO_NAME_POOL.includes(n);
}
