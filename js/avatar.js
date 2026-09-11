/** 清晰可辨的古代人物 SVG 人像；每人樣貌／衣裝明顯不同，等級愈高飾物愈華麗 */

let avatarSeq = 0;

const RANK_TRIM = [
  { jewel: false, trim: "#8a7a60", glow: 0 },
  { jewel: false, trim: "#9a8a68", glow: 0 },
  { jewel: false, trim: "#a89870", glow: 0.1 },
  { jewel: true, trim: "#b8a878", glow: 0.15 },
  { jewel: true, trim: "#c6a35a", glow: 0.22 },
  { jewel: true, trim: "#d4b45a", glow: 0.3 },
  { jewel: true, trim: "#e0c46a", glow: 0.38 },
  { jewel: true, trim: "#f0d878", glow: 0.48 },
  { jewel: true, trim: "#ffe9a0", glow: 0.58 },
];

function face(look) {
  const { skin, eye, lip, gender, hair } = look;
  const blush = gender === "female";
  return `
    <!-- 臉 -->
    <ellipse cx="60" cy="58" rx="26" ry="30" fill="${skin}"/>
    <!-- 耳 -->
    <ellipse cx="33" cy="60" rx="5" ry="7" fill="${skin}"/>
    <ellipse cx="87" cy="60" rx="5" ry="7" fill="${skin}"/>
    <!-- 眉 -->
    <path d="M42 50 Q50 46 56 50" fill="none" stroke="${hair}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M64 50 Q70 46 78 50" fill="none" stroke="${hair}" stroke-width="2.2" stroke-linecap="round"/>
    <!-- 眼 -->
    <ellipse cx="49" cy="58" rx="5" ry="5.5" fill="#fff"/>
    <ellipse cx="71" cy="58" rx="5" ry="5.5" fill="#fff"/>
    <circle cx="50" cy="58" r="2.8" fill="${eye}"/>
    <circle cx="72" cy="58" r="2.8" fill="${eye}"/>
    <circle cx="51" cy="57" r="1" fill="#fff"/>
    <circle cx="73" cy="57" r="1" fill="#fff"/>
    <!-- 鼻 -->
    <path d="M60 60 L57 68 Q60 70 63 68 Z" fill="${skin}" stroke="${eye}" stroke-width="0.8" opacity=".55"/>
    <!-- 嘴 -->
    <path d="M52 76 Q60 ${blush ? 82 : 80} 68 76" fill="none" stroke="${lip}" stroke-width="${blush ? 2.4 : 2}" stroke-linecap="round"/>
    ${blush ? `<ellipse cx="40" cy="70" rx="6" ry="3.5" fill="#e89a90" opacity=".4"/><ellipse cx="80" cy="70" rx="6" ry="3.5" fill="#e89a90" opacity=".4"/>` : ""}
    ${
      look.beard
        ? `<path d="M42 78 Q60 102 78 78 Q60 90 42 78" fill="${hair}"/><path d="M56 72 H64 V78 H56 Z" fill="${hair}"/>`
        : ""
    }
  `;
}

function hairMale(look) {
  const { hair, hat } = look;
  // 頂髮（帽子底下仍要有）
  return `
    <path d="M34 55 C34 28, 86 28, 86 55 L86 62 C86 40, 34 40, 34 62 Z" fill="${hair}"/>
    ${hat === "lunjin" || hat === "scholar" ? "" : `<path d="M30 58 Q28 78 36 88" fill="${hair}"/><path d="M90 58 Q92 78 84 88" fill="${hair}"/>`}
  `;
}

function hairFemale(look) {
  const { hair, hairdo } = look;
  const base = `<path d="M34 55 C36 28, 84 28, 86 55" fill="${hair}"/>`;
  switch (hairdo) {
    case "high":
      return `${base}
        <ellipse cx="60" cy="22" rx="14" ry="16" fill="${hair}"/>
        <path d="M28 58 Q14 95 24 125" fill="${hair}"/>
        <path d="M92 58 Q106 95 96 125" fill="${hair}"/>
        <circle cx="60" cy="14" r="5" fill="${look.accent}"/>`;
    case "topknot":
      return `${base}
        <ellipse cx="60" cy="26" rx="9" ry="11" fill="${hair}"/>
        <path d="M32 58 Q22 90 30 115" fill="${hair}"/>
        <path d="M88 58 Q98 90 90 115" fill="${hair}"/>`;
    case "side":
      return `${base}
        <path d="M28 55 Q10 90 22 120" fill="${hair}"/>
        <path d="M92 55 Q110 90 98 120" fill="${hair}"/>
        <circle cx="32" cy="62" r="7" fill="${hair}"/>
        <circle cx="88" cy="62" r="7" fill="${hair}"/>`;
    case "song":
      return `${base}
        <ellipse cx="42" cy="36" rx="10" ry="8" fill="${hair}"/>
        <ellipse cx="78" cy="36" rx="10" ry="8" fill="${hair}"/>
        <path d="M28 58 Q16 95 26 122" fill="${hair}"/>
        <path d="M92 58 Q104 95 94 122" fill="${hair}"/>`;
    case "long":
      return `${base}
        <path d="M26 55 Q8 100 20 135" fill="${hair}"/>
        <path d="M94 55 Q112 100 100 135" fill="${hair}"/>`;
    default:
      return `${base}
        <circle cx="60" cy="28" r="12" fill="${hair}"/>
        <path d="M30 58 Q18 95 28 118" fill="${hair}"/>
        <path d="M90 58 Q102 95 92 118" fill="${hair}"/>`;
  }
}

function hat(look, trim) {
  const { hat: h, robe, robe2, accent, hair } = look;
  switch (h) {
    case "helmet":
      return `
        <path d="M28 42 C30 16, 90 16, 92 42 L86 50 H34 Z" fill="${robe2}" stroke="${accent}" stroke-width="2"/>
        <path d="M48 18 L60 4 L72 18" fill="${accent}"/>
        <rect x="52" y="18" width="16" height="12" rx="1" fill="${accent}"/>
        <path d="M34 48 H86" stroke="${accent}" stroke-width="2"/>`;
    case "lunjin":
      return `
        <ellipse cx="60" cy="34" rx="36" ry="16" fill="${robe}" stroke="${accent}" stroke-width="1.5"/>
        <path d="M34 36 Q60 8 86 36" fill="none" stroke="${accent}" stroke-width="2.5"/>
        <circle cx="60" cy="16" r="5" fill="${accent}"/>
        <path d="M24 40 Q18 55 28 58" fill="${robe}" opacity=".85"/>
        <path d="M96 40 Q102 55 92 58" fill="${robe}" opacity=".85"/>`;
    case "warrior":
      return `
        <path d="M24 46 L34 14 H86 L96 46 Z" fill="${robe2}" stroke="${accent}" stroke-width="2"/>
        <path d="M48 14 L60 0 L72 14" fill="${accent}"/>
        <rect x="44" y="28" width="32" height="10" fill="${accent}" opacity=".85"/>`;
    case "winged":
      return `
        <rect x="30" y="28" width="60" height="20" rx="3" fill="${robe2}" stroke="${accent}" stroke-width="1.5"/>
        <path d="M30 32 L12 18 L34 38" fill="${accent}"/>
        <path d="M90 32 L108 18 L86 38" fill="${accent}"/>
        <rect x="50" y="22" width="20" height="10" fill="${robe}"/>`;
    case "scholar":
      return `
        <rect x="42" y="12" width="36" height="28" rx="4" fill="${hair}"/>
        <rect x="48" y="6" width="24" height="12" fill="${robe2}"/>
        <rect x="54" y="0" width="12" height="10" fill="${accent}"/>`;
    case "bronze":
      return `
        <path d="M28 44 Q60 8 92 44" fill="${robe2}" stroke="${accent}" stroke-width="2.5"/>
        <circle cx="60" cy="26" r="7" fill="${accent}"/>
        <circle cx="60" cy="26" r="3" fill="${robe}"/>`;
    case "phoenix":
      return `
        <path d="M38 38 Q60 0 82 38" fill="${accent}"/>
        <path d="M50 18 L60 -2 L70 18" fill="${robe2}"/>
        <circle cx="60" cy="16" r="6" fill="#fff6c8"/>
        <path d="M30 34 L10 6 L40 32" fill="${robe}"/>
        <path d="M90 34 L110 6 L80 32" fill="${robe}"/>
        <path d="M44 34 H76" stroke="${robe2}" stroke-width="2"/>`;
    case "helm":
      return `
        <path d="M30 44 L40 16 H80 L90 44 Z" fill="${robe2}" stroke="${accent}" stroke-width="2"/>
        <rect x="52" y="10" width="16" height="12" fill="${accent}"/>`;
    case "fur":
      return `
        <path d="M20 48 Q60 6 100 48" fill="${robe2}"/>
        <path d="M28 48 Q60 18 92 48" fill="${accent}" opacity=".65"/>
        <circle cx="26" cy="46" r="5" fill="${accent}" opacity=".5"/>
        <circle cx="94" cy="46" r="5" fill="${accent}" opacity=".5"/>`;
    default:
      return trim.jewel
        ? `<path d="M44 36 L52 14 L60 28 L68 14 L76 36 Z" fill="${trim.trim}" stroke="#6a5020" stroke-width="1"/>`
        : "";
  }
}

function clothes(look, trim, rankId) {
  const { style, robe, robe2, accent, gender } = look;
  const rich = rankId >= 4;
  const imperial = rankId >= 7;

  if (style === "general" || style === "armor" || style === "warrior") {
    return `
      <path d="M22 128 L30 88 L48 78 L60 84 L72 78 L90 88 L98 128 Z" fill="${robe2}"/>
      <path d="M34 90 L60 102 L86 90 L82 128 H38 Z" fill="${robe}"/>
      <rect x="40" y="92" width="40" height="12" rx="2" fill="${accent}"/>
      <path d="M44 104 L50 128 M76 104 L70 128" stroke="${accent}" stroke-width="3"/>
      <circle cx="48" cy="86" r="4" fill="${accent}"/>
      <circle cx="72" cy="86" r="4" fill="${accent}"/>
      ${rich ? `<circle cx="60" cy="98" r="5" fill="${trim.trim}"/>` : ""}
      ${style === "warrior" ? `<path d="M86 100 L110 70 L104 68 L82 94 Z" fill="${accent}"/><circle cx="110" cy="68" r="4" fill="${robe}"/>` : ""}`;
  }

  if (style === "admiral") {
    return `
      <path d="M24 128 Q38 82 60 78 Q82 82 96 128 Z" fill="${robe}"/>
      <path d="M42 86 L60 118 L78 86" fill="${robe2}"/>
      <path d="M32 100 H88" stroke="${accent}" stroke-width="4"/>
      <path d="M36 110 H84" stroke="${accent}" stroke-width="3"/>
      <path d="M40 118 H80" stroke="${accent}" stroke-width="2"/>
      ${imperial ? `<circle cx="60" cy="92" r="6" fill="${trim.trim}"/>` : ""}
      <!-- 袖 -->
      <ellipse cx="26" cy="110" rx="10" ry="16" fill="${robe2}"/>
      <ellipse cx="94" cy="110" rx="10" ry="16" fill="${robe2}"/>`;
  }

  if (style === "empress") {
    return `
      <path d="M18 130 Q36 80 60 76 Q84 80 102 130 Z" fill="${robe}"/>
      <path d="M36 88 Q60 112 84 88" fill="${robe2}" opacity=".9"/>
      <path d="M28 104 H92" stroke="${accent}" stroke-width="3"/>
      <path d="M32 114 H88" stroke="${accent}" stroke-width="2"/>
      <circle cx="48" cy="96" r="4" fill="#fff3c4"/>
      <circle cx="72" cy="96" r="4" fill="#fff3c4"/>
      ${rich ? `<circle cx="60" cy="100" r="5" fill="${trim.trim}"/>` : ""}`;
  }

  if (style === "heqin") {
    return `
      <path d="M20 130 Q36 84 60 78 Q84 84 100 130 Z" fill="${robe}"/>
      <path d="M26 100 Q60 88 94 100 L98 130 H22 Z" fill="${robe2}" opacity=".8"/>
      <path d="M34 112 H86" stroke="${accent}" stroke-width="3"/>
      <ellipse cx="22" cy="108" rx="12" ry="18" fill="${robe2}"/>
      <ellipse cx="98" cy="108" rx="12" ry="18" fill="${robe2}"/>`;
  }

  if (style === "poet" || style === "musician" || (style === "scholar" && gender === "female")) {
    return `
      <path d="M26 130 Q42 84 60 78 Q78 84 94 130 Z" fill="${robe}"/>
      <path d="M44 86 L60 108 L76 86" fill="${robe2}" opacity=".75"/>
      <path d="M34 100 Q60 90 86 100" fill="none" stroke="${accent}" stroke-width="2"/>
      ${style === "musician" ? `<rect x="88" y="96" width="6" height="28" rx="2" fill="${accent}"/><path d="M84 96 Q100 90 104 100" fill="none" stroke="${accent}" stroke-width="2"/>` : ""}
      ${style === "poet" ? `<rect x="78" y="100" width="18" height="14" rx="1" fill="${accent}" opacity=".85"/>` : ""}
      ${rich ? `<circle cx="60" cy="96" r="4" fill="${trim.trim}"/>` : ""}`;
  }

  // scholar / historian / strategist
  return `
    <path d="M26 128 Q40 84 60 80 Q80 84 94 128 Z" fill="${robe}"/>
    <path d="M46 86 L60 106 L74 86" fill="${robe2}"/>
    <path d="M38 104 H82" stroke="${accent}" stroke-width="2"/>
    <path d="M42 112 H78" stroke="${accent}" stroke-width="1.5"/>
    ${style === "historian" || style === "strategist" ? `<rect x="82" y="98" width="14" height="20" rx="1" fill="${accent}"/><line x1="85" y1="104" x2="93" y2="104" stroke="${robe2}" stroke-width="1"/><line x1="85" y1="110" x2="93" y2="110" stroke="${robe2}" stroke-width="1"/>` : ""}
    ${look.style === "scholar" && look.gender === "male" ? `<path d="M78 100 L108 78" stroke="${accent}" stroke-width="3" stroke-linecap="round"/><path d="M100 70 Q112 74 108 86" fill="${accent}" opacity=".7"/>` : ""}
    ${rich ? `<rect x="55" y="92" width="10" height="8" fill="${trim.trim}"/>` : ""}
  `;
}

/**
 * @param {object} character
 * @param {number} rankId
 * @param {"sm"|"md"|"lg"} size
 */
export function renderAvatar(character, rankId = 0, size = "md") {
  const look = character?.look;
  if (!look) {
    return `<div class="avatar-fallback" style="background:${character?.color || "#444"}">${character?.name?.[0] || "?"}</div>`;
  }
  const trim = RANK_TRIM[Math.min(8, Math.max(0, rankId))];
  const dims = size === "lg" ? 200 : size === "sm" ? 88 : 120;
  const uid = `av-${character.id}-${++avatarSeq}`;
  const hair =
    look.gender === "female" ? hairFemale(look) : hairMale(look);

  return `
  <svg class="avatar-svg avatar-${size}" viewBox="0 -4 120 142" width="${dims}" height="${Math.round(dims * 1.15)}" aria-label="${character.name}" role="img">
    <defs>
      <linearGradient id="${uid}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${look.robe2}"/>
        <stop offset="100%" stop-color="${look.robe}"/>
      </linearGradient>
      <filter id="${uid}-s" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity=".25"/>
      </filter>
    </defs>
    <rect x="2" y="2" width="116" height="132" rx="14" fill="url(#${uid})" opacity=".25"/>
    <rect x="2" y="2" width="116" height="132" rx="14" fill="#f7ecd8" stroke="${look.accent}" stroke-width="2.5"/>
    <g filter="url(#${uid}-s)">
      ${hair}
      ${clothes(look, trim, rankId)}
      ${face(look)}
      ${hat(look, trim)}
    </g>
    <text x="60" y="131" text-anchor="middle" font-size="7" fill="${look.robe2}" font-family="sans-serif" opacity=".7">${character.era}</text>
  </svg>`;
}
