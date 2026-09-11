/** 依角色 look 繪製 SVG 人像；rankId 越高衣裝越華貴 */

let avatarSeq = 0;

const RANK_TRIM = [
  { collar: "#8a7a60", jewel: "none", glow: 0 },
  { collar: "#9a8a68", jewel: "none", glow: 0 },
  { collar: "#a09070", jewel: "dot", glow: 0 },
  { collar: "#b8a070", jewel: "dot", glow: 0.15 },
  { collar: "#c6a35a", jewel: "jade", glow: 0.2 },
  { collar: "#d4b45a", jewel: "jade", glow: 0.28 },
  { collar: "#e0c46a", jewel: "gold", glow: 0.35 },
  { collar: "#f0d878", jewel: "gold", glow: 0.45 },
  { collar: "#ffe9a0", jewel: "crown", glow: 0.55 },
];

function hatSvg(look, trim) {
  const { hat, hair, accent, robe, robe2 } = look;
  switch (hat) {
    case "helmet":
      return `
        <path d="M28 38 C32 18, 88 18, 92 38 L88 46 H32 Z" fill="${robe2}" stroke="${accent}" stroke-width="1.5"/>
        <path d="M48 20 L60 8 L72 20" fill="none" stroke="${accent}" stroke-width="2"/>
        <rect x="54" y="20" width="12" height="10" fill="${accent}"/>`;
    case "lunjin":
      return `
        <ellipse cx="60" cy="30" rx="34" ry="14" fill="${hair}"/>
        <path d="M30 34 Q60 10 90 34" fill="${robe}" opacity=".9"/>
        <path d="M38 28 Q60 4 82 28" fill="none" stroke="${accent}" stroke-width="2"/>
        <circle cx="60" cy="14" r="4" fill="${accent}"/>`;
    case "warrior":
      return `
        <path d="M26 40 L34 18 H86 L94 40 Z" fill="${robe2}" stroke="${accent}" stroke-width="1.5"/>
        <path d="M50 18 L60 6 L70 18" fill="${accent}"/>
        <rect x="40" y="36" width="40" height="8" fill="${robe}"/>`;
    case "winged":
      return `
        <path d="M28 38 H92 V46 H28 Z" fill="${robe2}"/>
        <path d="M36 38 L28 22 L44 34" fill="${accent}"/>
        <path d="M84 38 L92 22 L76 34" fill="${accent}"/>
        <rect x="48" y="28" width="24" height="12" rx="2" fill="${robe}"/>`;
    case "scholar":
      return `
        <rect x="40" y="16" width="40" height="22" rx="3" fill="${hair}"/>
        <rect x="46" y="10" width="28" height="10" fill="${robe2}"/>
        <rect x="54" y="4" width="12" height="10" fill="${accent}"/>`;
    case "bronze":
      return `
        <path d="M30 40 Q60 12 90 40" fill="${robe2}" stroke="${accent}" stroke-width="2"/>
        <circle cx="60" cy="24" r="6" fill="${accent}"/>`;
    case "phoenix":
      return `
        <path d="M40 34 Q60 4 80 34" fill="${accent}"/>
        <path d="M50 18 L60 2 L70 18" fill="${robe2}"/>
        <circle cx="60" cy="16" r="5" fill="#fff3c4"/>
        <path d="M34 30 L22 10 L40 28" fill="${robe}" opacity=".85"/>
        <path d="M86 30 L98 10 L80 28" fill="${robe}" opacity=".85"/>`;
    case "helm":
      return `
        <path d="M32 40 L40 20 H80 L88 40 Z" fill="${robe2}" stroke="${accent}" stroke-width="1.5"/>
        <rect x="52" y="14" width="16" height="10" fill="${accent}"/>`;
    case "fur":
      return `
        <path d="M24 42 Q60 8 96 42" fill="${robe2}" opacity=".9"/>
        <path d="M30 42 Q60 18 90 42" fill="${accent}" opacity=".55"/>`;
    default:
      return trim.jewel === "crown"
        ? `<path d="M42 34 L50 16 L60 28 L70 16 L78 34 Z" fill="${trim.collar}" stroke="#8a6a2e" stroke-width="1"/>`
        : "";
  }
}

function hairSvg(look) {
  const { gender, hair, hairdo } = look;
  if (gender === "male") {
    return `
      <ellipse cx="60" cy="48" rx="30" ry="26" fill="${hair}"/>
      <path d="M30 52 Q28 78 36 86" fill="${hair}"/>
      <path d="M90 52 Q92 78 84 86" fill="${hair}"/>`;
  }
  switch (hairdo) {
    case "high":
      return `
        <ellipse cx="60" cy="50" rx="28" ry="24" fill="${hair}"/>
        <ellipse cx="60" cy="28" rx="16" ry="18" fill="${hair}"/>
        <path d="M44 40 Q30 70 34 100" fill="${hair}"/>
        <path d="M76 40 Q90 70 86 100" fill="${hair}"/>`;
    case "topknot":
      return `
        <ellipse cx="60" cy="52" rx="26" ry="22" fill="${hair}"/>
        <ellipse cx="60" cy="30" rx="10" ry="12" fill="${hair}"/>
        <path d="M48 48 Q40 80 44 100" fill="${hair}"/>
        <path d="M72 48 Q80 80 76 100" fill="${hair}"/>`;
    case "side":
      return `
        <ellipse cx="60" cy="50" rx="28" ry="24" fill="${hair}"/>
        <path d="M32 55 Q18 90 28 110" fill="${hair}"/>
        <path d="M88 55 Q102 90 92 110" fill="${hair}"/>
        <circle cx="36" cy="58" r="5" fill="${hair}"/>`;
    case "song":
      return `
        <ellipse cx="60" cy="50" rx="28" ry="24" fill="${hair}"/>
        <path d="M34 50 Q22 85 30 115" fill="${hair}"/>
        <path d="M86 50 Q98 85 90 115" fill="${hair}"/>
        <ellipse cx="48" cy="36" rx="8" ry="6" fill="${hair}"/>
        <ellipse cx="72" cy="36" rx="8" ry="6" fill="${hair}"/>`;
    case "long":
      return `
        <ellipse cx="60" cy="50" rx="28" ry="24" fill="${hair}"/>
        <path d="M30 55 Q16 100 26 130" fill="${hair}"/>
        <path d="M90 55 Q104 100 94 130" fill="${hair}"/>`;
    case "bun":
    default:
      return `
        <ellipse cx="60" cy="50" rx="28" ry="24" fill="${hair}"/>
        <circle cx="60" cy="32" r="12" fill="${hair}"/>
        <path d="M34 55 Q24 90 32 110" fill="${hair}"/>
        <path d="M86 55 Q96 90 88 110" fill="${hair}"/>`;
  }
}

function clothesSvg(look, trim, rankId) {
  const { style, robe, robe2, accent, gender } = look;
  const rich = rankId >= 5;
  const imperial = rankId >= 7;

  let base = `
    <path d="M28 118 Q36 92 48 86 L60 90 L72 86 Q84 92 92 118 Z" fill="${robe}"/>
    <path d="M48 86 L60 96 L72 86" fill="${robe2}"/>
    <path d="M40 118 L48 96 L60 108 L72 96 L80 118" fill="${robe2}" opacity=".55"/>`;

  if (style === "general" || style === "armor" || style === "warrior") {
    base = `
      <path d="M26 118 L34 88 L48 82 L60 88 L72 82 L86 88 L94 118 Z" fill="${robe2}"/>
      <path d="M36 90 L60 100 L84 90" fill="${robe}"/>
      <rect x="42" y="92" width="36" height="10" fill="${accent}" opacity=".8"/>
      <path d="M40 102 L48 118 M80 102 L72 118" stroke="${accent}" stroke-width="2"/>
      ${rich ? `<circle cx="60" cy="96" r="4" fill="${trim.collar}"/>` : ""}`;
  } else if (style === "admiral") {
    base = `
      <path d="M28 118 Q40 86 60 84 Q80 86 92 118 Z" fill="${robe}"/>
      <path d="M44 88 L60 110 L76 88" fill="${robe2}"/>
      <path d="M36 100 H84" stroke="${accent}" stroke-width="3"/>
      <path d="M40 108 H80" stroke="${accent}" stroke-width="2"/>
      ${imperial ? `<circle cx="60" cy="94" r="5" fill="${trim.collar}"/>` : ""}`;
  } else if (style === "empress") {
    base = `
      <path d="M24 120 Q38 84 60 82 Q82 84 96 120 Z" fill="${robe}"/>
      <path d="M40 90 Q60 108 80 90" fill="${robe2}" opacity=".85"/>
      <path d="M34 104 H86" stroke="${accent}" stroke-width="2"/>
      <path d="M38 112 H82" stroke="${accent}" stroke-width="1.5"/>
      ${rich ? `<circle cx="52" cy="96" r="3" fill="#fff3c4"/><circle cx="68" cy="96" r="3" fill="#fff3c4"/>` : ""}`;
  } else if (style === "heqin") {
    base = `
      <path d="M22 120 Q36 86 60 84 Q84 86 98 120 Z" fill="${robe}"/>
      <path d="M30 100 Q60 92 90 100 L94 120 H26 Z" fill="${robe2}" opacity=".75"/>
      <path d="M36 108 H84" stroke="${accent}" stroke-width="2"/>`;
  } else if (style === "poet" || style === "musician" || (style === "scholar" && gender === "female")) {
    base = `
      <path d="M30 120 Q42 86 60 84 Q78 86 90 120 Z" fill="${robe}"/>
      <path d="M46 88 L60 104 L74 88" fill="${robe2}" opacity=".7"/>
      <path d="M38 100 Q60 92 82 100" fill="none" stroke="${accent}" stroke-width="1.5"/>
      ${rich ? `<circle cx="60" cy="96" r="3" fill="${trim.collar}"/>` : ""}`;
  } else if (style === "scholar" || style === "historian" || style === "strategist") {
    base = `
      <path d="M30 118 Q40 88 60 86 Q80 88 90 118 Z" fill="${robe}"/>
      <path d="M48 88 L60 102 L72 88" fill="${robe2}"/>
      <path d="M42 104 H78" stroke="${accent}" stroke-width="1.5"/>
      ${look.beard ? "" : ""}
      ${rich ? `<rect x="56" y="92" width="8" height="6" fill="${trim.collar}"/>` : ""}`;
  }

  // 等級飾邊
  if (rankId >= 3) {
    base += `<path d="M34 114 H86" stroke="${trim.collar}" stroke-width="2" opacity=".7"/>`;
  }
  if (trim.jewel === "jade" || trim.jewel === "gold" || trim.jewel === "crown") {
    base += `<circle cx="60" cy="100" r="3.5" fill="${trim.collar}" stroke="#5a4020" stroke-width="0.8"/>`;
  }
  return base;
}

function faceSvg(look) {
  const { skin, eye, lip, beard, gender } = look;
  return `
    <ellipse cx="60" cy="62" rx="24" ry="28" fill="${skin}"/>
    <ellipse cx="50" cy="60" rx="3.2" ry="3.6" fill="${eye}"/>
    <ellipse cx="70" cy="60" rx="3.2" ry="3.6" fill="${eye}"/>
    <circle cx="51.2" cy="59.2" r="1" fill="#fff" opacity=".7"/>
    <circle cx="71.2" cy="59.2" r="1" fill="#fff" opacity=".7"/>
    <path d="M48 58 Q50 55 52 58" fill="none" stroke="${eye}" stroke-width="1.2"/>
    <path d="M68 58 Q70 55 72 58" fill="none" stroke="${eye}" stroke-width="1.2"/>
    <path d="M58 66 Q60 69 62 66" fill="none" stroke="${skin}" stroke-width="1.5" opacity=".5"/>
    <path d="M54 76 Q60 ${gender === "female" ? 80 : 78} 66 76" fill="none" stroke="${lip}" stroke-width="${gender === "female" ? 2.2 : 1.6}" stroke-linecap="round"/>
    ${
      beard
        ? `<path d="M48 78 Q60 96 72 78 Q60 86 48 78" fill="${look.hair}" opacity=".85"/>`
        : ""
    }
    ${gender === "female" ? `<ellipse cx="44" cy="70" rx="5" ry="3" fill="#e89a90" opacity=".35"/><ellipse cx="76" cy="70" rx="5" ry="3" fill="#e89a90" opacity=".35"/>` : ""}
  `;
}

/**
 * @param {object} character - CHARACTERS item
 * @param {number} rankId - 0..8
 * @param {"sm"|"md"|"lg"} size
 */
export function renderAvatar(character, rankId = 0, size = "md") {
  const look = character?.look;
  if (!look) {
    return `<div class="avatar-fallback" style="background:${character?.color || "#444"}">?</div>`;
  }
  const trim = RANK_TRIM[Math.min(RANK_TRIM.length - 1, Math.max(0, rankId))];
  const dims = size === "lg" ? 168 : size === "sm" ? 64 : 104;
  const uid = `av-${character.id}-${++avatarSeq}`;
  const glow =
    trim.glow > 0
      ? `<circle cx="60" cy="70" r="52" fill="${trim.collar}" opacity="${trim.glow * 0.25}"/>`
      : "";

  return `
  <svg class="avatar-svg avatar-${size}" viewBox="0 0 120 130" width="${dims}" height="${Math.round(dims * 1.08)}" aria-label="${character.name}" role="img">
    <defs>
      <linearGradient id="${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${look.robe2}" stop-opacity=".35"/>
        <stop offset="100%" stop-color="${look.robe}" stop-opacity=".15"/>
      </linearGradient>
    </defs>
    <rect x="4" y="4" width="112" height="122" rx="12" fill="url(#${uid})" stroke="${look.accent}" stroke-width="1.5" opacity=".9"/>
    ${glow}
    ${hairSvg(look)}
    ${clothesSvg(look, trim, rankId)}
    ${faceSvg(look)}
    ${hatSvg(look, trim)}
  </svg>`;
}
