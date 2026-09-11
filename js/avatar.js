/**
 * 有型有款的古代人物肖像（每位獨立造型）
 * 等級愈高，金飾／氣場愈強
 */
let avatarSeq = 0;

function frame(uid, accent, robe, robe2, inner, era, glow) {
  return `
    <defs>
      <linearGradient id="${uid}-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${robe2}"/>
        <stop offset="100%" stop-color="${robe}"/>
      </linearGradient>
      <linearGradient id="${uid}-silk" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#fff8e8"/>
        <stop offset="55%" stop-color="#f0e0c0"/>
        <stop offset="100%" stop-color="#e2c898"/>
      </linearGradient>
      <filter id="${uid}-s"><feDropShadow dx="0" dy="2" stdDeviation="1.6" flood-opacity=".28"/></filter>
    </defs>
    <rect x="2" y="2" width="116" height="140" rx="16" fill="url(#${uid}-bg)" opacity=".3"/>
    <rect x="2" y="2" width="116" height="140" rx="16" fill="url(#${uid}-silk)" stroke="${accent}" stroke-width="2.8"/>
    <rect x="7" y="7" width="106" height="130" rx="12" fill="none" stroke="${accent}" stroke-width="1" opacity=".45"/>
    ${glow > 0 ? `<circle cx="60" cy="64" r="48" fill="${accent}" opacity="${glow * 0.18}"/>` : ""}
    <g filter="url(#${uid}-s)">${inner}</g>
    <text x="60" y="138" text-anchor="middle" font-size="7.5" fill="${robe2}" font-family="Georgia, serif" letter-spacing="1">${era}</text>
  `;
}

function eyes(cx1, cx2, cy, eye, mood = "normal") {
  // mood: normal | sharp | soft | fierce
  const h = mood === "sharp" || mood === "fierce" ? 4.1 : mood === "soft" ? 5.6 : 5.1;
  const browY = mood === "fierce" ? cy - 10 : cy - 8;
  return `
    <ellipse cx="${cx1}" cy="${cy}" rx="5.4" ry="${h}" fill="#fff"/>
    <ellipse cx="${cx2}" cy="${cy}" rx="5.4" ry="${h}" fill="#fff"/>
    <circle cx="${cx1 + (mood === "fierce" ? 1.2 : 0.5)}" cy="${cy}" r="${mood === "soft" ? 2.4 : 2.7}" fill="${eye}"/>
    <circle cx="${cx2 + (mood === "fierce" ? 1.2 : 0.5)}" cy="${cy}" r="${mood === "soft" ? 2.4 : 2.7}" fill="${eye}"/>
    <circle cx="${cx1 + 1.5}" cy="${cy - 1.1}" r="1.1" fill="#fff"/>
    <circle cx="${cx2 + 1.5}" cy="${cy - 1.1}" r="1.1" fill="#fff"/>
    ${mood === "fierce" ? `<path d="M${cx1 - 6} ${browY + 2} L${cx1 + 5} ${browY}" stroke="${eye}" stroke-width="2.2" stroke-linecap="round"/><path d="M${cx2 + 6} ${browY + 2} L${cx2 - 5} ${browY}" stroke="${eye}" stroke-width="2.2" stroke-linecap="round"/>` : ""}
  `;
}

/** —— 男角 —— */
function drawHanxin(L, rank) {
  const rich = rank >= 5;
  return `
    <!-- 披風 -->
    <path d="M18 130 Q28 86 44 78 L60 84 L76 78 Q92 86 102 130 Z" fill="${L.robe2}"/>
    <!-- 甲 -->
    <path d="M34 86 L48 76 L60 82 L72 76 L86 86 L82 130 H38 Z" fill="${L.robe}"/>
    <path d="M40 92 H80" stroke="${L.accent}" stroke-width="3"/>
    <path d="M42 100 H78" stroke="${L.accent}" stroke-width="2"/>
    <path d="M44 108 H76" stroke="${L.accent}" stroke-width="2"/>
    <rect x="52" y="88" width="16" height="20" rx="2" fill="${L.accent}" opacity=".85"/>
    ${rich ? `<circle cx="60" cy="96" r="4" fill="#ffe9a0"/>` : ""}
    <!-- 肩甲 -->
    <path d="M30 84 L18 96 L34 100 Z" fill="${L.accent}"/>
    <path d="M90 84 L102 96 L86 100 Z" fill="${L.accent}"/>
    <!-- 髮 -->
    <path d="M34 58 C36 30 84 30 86 58" fill="${L.hair}"/>
    <!-- 盔 -->
    <path d="M28 50 C32 18 88 18 92 50 L84 58 H36 Z" fill="${L.robe2}" stroke="${L.accent}" stroke-width="2"/>
    <path d="M50 20 L60 4 L70 20" fill="${L.accent}"/>
    <rect x="54" y="20" width="12" height="14" fill="${L.accent}"/>
    <!-- 臉：英氣 -->
    <ellipse cx="60" cy="62" rx="24" ry="27" fill="${L.skin}"/>
    <path d="M42 52 Q49 47 55 52" fill="none" stroke="${L.hair}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M65 52 Q71 47 78 52" fill="none" stroke="${L.hair}" stroke-width="2.4" stroke-linecap="round"/>
    ${eyes(49, 71, 60, L.eye, "sharp")}
    <path d="M60 62 L58 70 Q60 72 62 70" fill="none" stroke="${L.eye}" stroke-width="1.2" opacity=".5"/>
    <path d="M52 76 Q60 81 68 76" fill="none" stroke="${L.lip}" stroke-width="2.2" stroke-linecap="round"/>
    <!-- 劍柄 -->
    <rect x="96" y="70" width="7" height="42" rx="1" fill="${L.accent}"/>
    <rect x="92" y="66" width="15" height="8" rx="2" fill="${L.robe2}"/>
  `;
}

function drawZhuge(L, rank) {
  const rich = rank >= 5;
  return `
    <!-- 道袍 -->
    <path d="M24 132 Q40 82 60 76 Q80 82 96 132 Z" fill="${L.robe}"/>
    <path d="M44 86 L60 112 L76 86" fill="${L.robe2}" opacity=".75"/>
    <path d="M36 100 Q60 92 84 100" fill="none" stroke="${L.accent}" stroke-width="1.8"/>
    ${rich ? `<circle cx="60" cy="98" r="5" fill="${L.accent}"/>` : ""}
    <!-- 寬袖 -->
    <path d="M24 100 Q8 118 22 128 L34 110 Z" fill="${L.robe2}"/>
    <path d="M96 100 Q112 118 98 128 L86 110 Z" fill="${L.robe2}"/>
    <!-- 髮+綸巾 -->
    <path d="M34 56 C36 32 84 32 86 56" fill="${L.hair}"/>
    <ellipse cx="60" cy="36" rx="38" ry="18" fill="${L.robe}" stroke="${L.accent}" stroke-width="2"/>
    <path d="M32 38 Q60 6 88 38" fill="none" stroke="${L.accent}" stroke-width="2.5"/>
    <circle cx="60" cy="14" r="5" fill="${L.accent}"/>
    <path d="M20 42 Q12 58 26 62" fill="${L.robe}" opacity=".9"/>
    <path d="M100 42 Q108 58 94 62" fill="${L.robe}" opacity=".9"/>
    <!-- 臉：儒雅+鬚 -->
    <ellipse cx="60" cy="62" rx="23" ry="26" fill="${L.skin}"/>
    <path d="M44 52 Q50 48 55 52" fill="none" stroke="${L.hair}" stroke-width="1.8"/>
    <path d="M65 52 Q70 48 76 52" fill="none" stroke="${L.hair}" stroke-width="1.8"/>
    ${eyes(49, 71, 60, L.eye, "soft")}
    <path d="M58 64 Q60 70 62 64" fill="none" stroke="${L.eye}" stroke-width="1" opacity=".45"/>
    <path d="M52 75 Q60 79 68 75" fill="none" stroke="${L.lip}" stroke-width="1.8"/>
    <path d="M44 78 Q60 104 76 78 Q60 92 44 78" fill="${L.hair}"/>
    <path d="M56 72 H64 V80 H56 Z" fill="${L.hair}"/>
    <!-- 羽扇 -->
    <g transform="translate(88,88) rotate(-25)">
      <rect x="0" y="8" width="4" height="28" fill="#8B6914"/>
      <path d="M-10 8 Q2 -6 14 8 Z" fill="${L.accent}"/>
      <path d="M-8 8 L2 2 L12 8" fill="none" stroke="${L.robe2}" stroke-width="1"/>
    </g>
  `;
}

function drawYuefei(L, rank) {
  return `
    <!-- 紅披風 -->
    <path d="M14 132 Q26 78 48 72 L60 80 L72 72 Q94 78 106 132 Z" fill="${L.robe}"/>
    <!-- 鎧甲 -->
    <path d="M36 84 L50 74 L60 80 L70 74 L84 84 L80 132 H40 Z" fill="${L.robe2}"/>
    <path d="M42 90 H78" stroke="${L.accent}" stroke-width="3.5"/>
    <path d="M44 98 H76" stroke="${L.accent}" stroke-width="2.5"/>
    <path d="M46 106 H74" stroke="${L.accent}" stroke-width="2.5"/>
    <polygon points="60,86 66,98 60,110 54,98" fill="${L.accent}"/>
    <!-- 肩甲 -->
    <ellipse cx="32" cy="88" rx="12" ry="9" fill="${L.accent}"/>
    <ellipse cx="88" cy="88" rx="12" ry="9" fill="${L.accent}"/>
    <!-- 盔 -->
    <path d="M34 56 C36 28 84 28 86 56" fill="${L.hair}"/>
    <path d="M26 52 L36 14 H84 L94 52 Z" fill="${L.robe2}" stroke="${L.accent}" stroke-width="2"/>
    <path d="M50 14 L60 -2 L70 14" fill="${L.accent}"/>
    <rect x="44" y="28" width="32" height="12" fill="${L.accent}"/>
    <!-- 臉：剛毅 -->
    <ellipse cx="60" cy="64" rx="24" ry="26" fill="${L.skin}"/>
    <path d="M42 54 Q48 48 55 53" fill="none" stroke="${L.hair}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M65 53 Q72 48 78 54" fill="none" stroke="${L.hair}" stroke-width="2.6" stroke-linecap="round"/>
    ${eyes(49, 71, 62, L.eye, "fierce")}
    <path d="M60 64 L57 72 Q60 74 63 72" fill="${L.skin}" stroke="${L.eye}" stroke-width=".8" opacity=".5"/>
    <path d="M50 80 Q60 78 70 80" fill="none" stroke="${L.lip}" stroke-width="2.6" stroke-linecap="round"/>
    <!-- 槍 -->
    <line x1="104" y1="40" x2="108" y2="128" stroke="#6e5430" stroke-width="4"/>
    <path d="M100 36 L108 20 L116 36 Z" fill="${L.accent}"/>
  `;
}

function drawZhenghe(L, rank) {
  const rich = rank >= 4;
  return `
    <!-- 官袍 -->
    <path d="M22 132 Q38 80 60 74 Q82 80 98 132 Z" fill="${L.robe}"/>
    <path d="M42 84 L60 120 L78 84" fill="${L.robe2}"/>
    <path d="M30 98 H90" stroke="${L.accent}" stroke-width="4"/>
    <path d="M34 108 H86" stroke="${L.accent}" stroke-width="3"/>
    <path d="M38 116 H82" stroke="${L.accent}" stroke-width="2"/>
    ${rich ? `<circle cx="60" cy="94" r="6" fill="${L.accent}"/><circle cx="60" cy="94" r="3" fill="#fff3c4"/>` : ""}
    <!-- 闊袖 -->
    <ellipse cx="22" cy="112" rx="12" ry="18" fill="${L.robe2}"/>
    <ellipse cx="98" cy="112" rx="12" ry="18" fill="${L.robe2}"/>
    <!-- 烏紗翅帽 -->
    <path d="M34 54 C36 30 84 30 86 54" fill="${L.hair}"/>
    <rect x="32" y="28" width="56" height="22" rx="4" fill="${L.robe2}" stroke="${L.accent}" stroke-width="1.5"/>
    <path d="M32 34 L8 16 L36 40" fill="${L.accent}"/>
    <path d="M88 34 L112 16 L84 40" fill="${L.accent}"/>
    <rect x="50" y="20" width="20" height="12" fill="${L.robe}"/>
    <!-- 臉：沉穩深膚 -->
    <ellipse cx="60" cy="64" rx="24" ry="27" fill="${L.skin}"/>
    <path d="M44 54 Q50 50 55 54" fill="none" stroke="${L.hair}" stroke-width="2"/>
    <path d="M65 54 Q70 50 76 54" fill="none" stroke="${L.hair}" stroke-width="2"/>
    ${eyes(49, 71, 62, L.eye, "normal")}
    <path d="M58 66 Q60 72 62 66" fill="none" stroke="${L.eye}" stroke-width="1.1" opacity=".5"/>
    <path d="M52 78 Q60 82 68 78" fill="none" stroke="${L.lip}" stroke-width="2"/>
    <!-- 耳飾 -->
    <circle cx="34" cy="68" r="3" fill="${L.accent}"/>
    <circle cx="86" cy="68" r="3" fill="${L.accent}"/>
  `;
}

function drawSimaqian(L, rank) {
  return `
    <!-- 深衣 -->
    <path d="M26 132 Q42 84 60 78 Q78 84 94 132 Z" fill="${L.robe}"/>
    <path d="M46 88 L60 110 L74 88" fill="${L.robe2}" opacity=".8"/>
    <path d="M38 102 H82" stroke="${L.accent}" stroke-width="1.8"/>
    <!-- 袖中竹簡 -->
    <g transform="translate(86,96)">
      <rect x="0" y="0" width="16" height="28" rx="2" fill="${L.accent}"/>
      <line x1="4" y1="6" x2="12" y2="6" stroke="${L.robe2}" stroke-width="1"/>
      <line x1="4" y1="12" x2="12" y2="12" stroke="${L.robe2}" stroke-width="1"/>
      <line x1="4" y1="18" x2="12" y2="18" stroke="${L.robe2}" stroke-width="1"/>
    </g>
    <!-- 進賢冠 -->
    <path d="M34 56 C36 32 84 32 86 56" fill="${L.hair}"/>
    <rect x="42" y="14" width="36" height="30" rx="4" fill="${L.hair}"/>
    <rect x="48" y="6" width="24" height="14" fill="${L.robe2}"/>
    <rect x="54" y="0" width="12" height="10" fill="${L.accent}"/>
    <!-- 臉：文士長鬚 -->
    <ellipse cx="60" cy="62" rx="23" ry="26" fill="${L.skin}"/>
    <path d="M44 52 Q50 48 55 52" fill="none" stroke="${L.hair}" stroke-width="1.6"/>
    <path d="M65 52 Q70 48 76 52" fill="none" stroke="${L.hair}" stroke-width="1.6"/>
    ${eyes(49, 71, 60, L.eye, "soft")}
    <path d="M52 74 Q60 77 68 74" fill="none" stroke="${L.lip}" stroke-width="1.6"/>
    <path d="M42 78 Q60 112 78 78 Q60 96 42 78" fill="${L.hair}"/>
    <path d="M55 70 H65 V82 H55 Z" fill="${L.hair}"/>
  `;
}

function drawSunwu(L, rank) {
  return `
    <!-- 戎服 -->
    <path d="M24 132 Q36 84 60 78 Q84 84 96 132 Z" fill="${L.robe}"/>
    <path d="M40 88 L60 108 L80 88" fill="${L.robe2}"/>
    <path d="M34 100 H86" stroke="${L.accent}" stroke-width="3"/>
    <path d="M38 110 H82" stroke="${L.accent}" stroke-width="2"/>
    <!-- 護臂 -->
    <rect x="16" y="100" width="14" height="26" rx="3" fill="${L.robe2}" stroke="${L.accent}" stroke-width="1.5"/>
    <rect x="90" y="100" width="14" height="26" rx="3" fill="${L.robe2}" stroke="${L.accent}" stroke-width="1.5"/>
    <!-- 青銅胄 -->
    <path d="M34 56 C36 30 84 30 86 56" fill="${L.hair}"/>
    <path d="M28 50 Q60 8 92 50" fill="${L.robe2}" stroke="${L.accent}" stroke-width="2.5"/>
    <circle cx="60" cy="28" r="8" fill="${L.accent}"/>
    <circle cx="60" cy="28" r="3.5" fill="${L.robe}"/>
    <path d="M36 48 H84" stroke="${L.accent}" stroke-width="2"/>
    <!-- 臉：謀略目光 -->
    <ellipse cx="60" cy="64" rx="24" ry="26" fill="${L.skin}"/>
    <path d="M42 54 Q49 48 56 53" fill="none" stroke="${L.hair}" stroke-width="2.3"/>
    <path d="M64 53 Q71 48 78 54" fill="none" stroke="${L.hair}" stroke-width="2.3"/>
    ${eyes(49, 71, 62, L.eye, "sharp")}
    <path d="M60 64 L58 72 Q60 74 62 72" fill="none" stroke="${L.eye}" stroke-width="1" opacity=".5"/>
    <path d="M52 78 Q60 80 68 78" fill="none" stroke="${L.lip}" stroke-width="2"/>
    <!-- 《兵法》簡 -->
    <g transform="translate(8,70) rotate(-12)">
      <rect width="14" height="22" rx="1" fill="${L.accent}"/>
      <text x="7" y="14" text-anchor="middle" font-size="7" fill="${L.robe2}">兵</text>
    </g>
  `;
}

/** —— 女角 —— */
function drawWuzetian(L, rank) {
  return `
    <!-- 鳳袍 -->
    <path d="M16 134 Q34 78 60 72 Q86 78 104 134 Z" fill="${L.robe}"/>
    <path d="M34 88 Q60 118 86 88" fill="${L.robe2}" opacity=".9"/>
    <path d="M26 104 H94" stroke="${L.accent}" stroke-width="3"/>
    <path d="M30 114 H90" stroke="${L.accent}" stroke-width="2"/>
    <circle cx="46" cy="96" r="4" fill="#fff3c4"/>
    <circle cx="74" cy="96" r="4" fill="#fff3c4"/>
    <circle cx="60" cy="102" r="5" fill="${L.accent}"/>
    <!-- 廣袖 -->
    <path d="M18 100 Q0 120 16 132 L32 108 Z" fill="${L.robe2}"/>
    <path d="M102 100 Q120 120 104 132 L88 108 Z" fill="${L.robe2}"/>
    <!-- 高髻鳳冠 -->
    <path d="M34 58 C36 34 84 34 86 58" fill="${L.hair}"/>
    <ellipse cx="60" cy="22" rx="15" ry="18" fill="${L.hair}"/>
    <path d="M24 58 Q10 100 22 128" fill="${L.hair}"/>
    <path d="M96 58 Q110 100 98 128" fill="${L.hair}"/>
    <path d="M38 36 Q60 -4 82 36" fill="${L.accent}"/>
    <path d="M50 16 L60 -4 L70 16" fill="${L.robe2}"/>
    <circle cx="60" cy="14" r="6" fill="#fff6c8"/>
    <path d="M28 32 L6 4 L40 30" fill="${L.robe}"/>
    <path d="M92 32 L114 4 L80 30" fill="${L.robe}"/>
    <!-- 臉：威儀 -->
    <ellipse cx="60" cy="64" rx="24" ry="27" fill="${L.skin}"/>
    <ellipse cx="40" cy="72" rx="6" ry="3.5" fill="#e89a90" opacity=".4"/>
    <ellipse cx="80" cy="72" rx="6" ry="3.5" fill="#e89a90" opacity=".4"/>
    <path d="M44 52 Q50 47 56 52" fill="none" stroke="${L.hair}" stroke-width="2"/>
    <path d="M64 52 Q70 47 76 52" fill="none" stroke="${L.hair}" stroke-width="2"/>
    ${eyes(49, 71, 60, L.eye, "fierce")}
    <path d="M58 64 Q60 70 62 64" fill="none" stroke="${L.eye}" stroke-width="1" opacity=".4"/>
    <path d="M51 79 Q60 77 69 79" fill="none" stroke="${L.lip}" stroke-width="2.8" stroke-linecap="round"/>
  `;
}

function drawMulan(L, rank) {
  return `
    <!-- 戰袍 -->
    <path d="M24 132 Q36 84 48 76 L60 82 L72 76 Q84 84 96 132 Z" fill="${L.robe}"/>
    <path d="M38 86 L60 100 L82 86 L78 132 H42 Z" fill="${L.robe2}" opacity=".85"/>
    <rect x="44" y="90" width="32" height="10" fill="${L.accent}"/>
    <path d="M46 100 L52 128 M74 100 L68 128" stroke="${L.accent}" stroke-width="2.5"/>
    <!-- 肩甲 -->
    <path d="M28 82 L16 94 L34 98 Z" fill="${L.accent}"/>
    <path d="M92 82 L104 94 L86 98 Z" fill="${L.accent}"/>
    <!-- 盔＋束髮 -->
    <path d="M34 56 C36 32 84 32 86 56" fill="${L.hair}"/>
    <ellipse cx="60" cy="28" rx="9" ry="11" fill="${L.hair}"/>
    <path d="M30 48 L40 16 H80 L90 48 Z" fill="${L.robe2}" stroke="${L.accent}" stroke-width="2"/>
    <rect x="52" y="10" width="16" height="12" fill="${L.accent}"/>
    <path d="M32 58 Q22 90 30 115" fill="${L.hair}"/>
    <path d="M88 58 Q98 90 90 115" fill="${L.hair}"/>
    <!-- 臉：英氣女將 -->
    <ellipse cx="60" cy="64" rx="23" ry="26" fill="${L.skin}"/>
    <ellipse cx="42" cy="72" rx="5" ry="3" fill="#e89a90" opacity=".35"/>
    <ellipse cx="78" cy="72" rx="5" ry="3" fill="#e89a90" opacity=".35"/>
    <path d="M44 54 Q50 49 55 54" fill="none" stroke="${L.hair}" stroke-width="2.2"/>
    <path d="M65 54 Q70 49 76 54" fill="none" stroke="${L.hair}" stroke-width="2.2"/>
    ${eyes(49, 71, 62, L.eye, "sharp")}
    <path d="M52 78 Q60 82 68 78" fill="none" stroke="${L.lip}" stroke-width="2.2"/>
    <!-- 刀 -->
    <g transform="translate(98,68) rotate(8)">
      <rect x="0" y="0" width="6" height="48" fill="${L.accent}"/>
      <path d="M-2 0 L3 -14 L8 0 Z" fill="${L.robe2}"/>
    </g>
  `;
}

function drawCaiwenji(L, rank) {
  return `
    <!-- 漢服 -->
    <path d="M26 132 Q42 84 60 78 Q78 84 94 132 Z" fill="${L.robe}"/>
    <path d="M44 88 L60 108 L76 88" fill="${L.robe2}" opacity=".75"/>
    <path d="M34 100 Q60 90 86 100" fill="none" stroke="${L.accent}" stroke-width="2"/>
    <!-- 髮：側髻垂鬟 -->
    <path d="M34 56 C36 30 84 30 86 56" fill="${L.hair}"/>
    <circle cx="32" cy="60" r="9" fill="${L.hair}"/>
    <circle cx="88" cy="60" r="9" fill="${L.hair}"/>
    <path d="M24 58 Q6 95 18 125" fill="${L.hair}"/>
    <path d="M96 58 Q114 95 102 125" fill="${L.hair}"/>
    <circle cx="28" cy="52" r="4" fill="${L.accent}"/>
    <circle cx="92" cy="52" r="4" fill="${L.accent}"/>
    <!-- 臉：才情柔美 -->
    <ellipse cx="60" cy="64" rx="24" ry="27" fill="${L.skin}"/>
    <ellipse cx="40" cy="72" rx="6" ry="3.5" fill="#e89a90" opacity=".42"/>
    <ellipse cx="80" cy="72" rx="6" ry="3.5" fill="#e89a90" opacity=".42"/>
    <path d="M44 54 Q50 49 56 54" fill="none" stroke="${L.hair}" stroke-width="1.8"/>
    <path d="M64 54 Q70 49 76 54" fill="none" stroke="${L.hair}" stroke-width="1.8"/>
    ${eyes(49, 71, 62, L.eye, "soft")}
    <path d="M52 80 Q60 86 68 80" fill="none" stroke="${L.lip}" stroke-width="2.5" stroke-linecap="round"/>
    <!-- 胡笳／琴 -->
    <g transform="translate(10,88)">
      <ellipse cx="12" cy="20" rx="14" ry="18" fill="${L.accent}" opacity=".9"/>
      <rect x="8" y="0" width="8" height="22" fill="${L.robe2}"/>
      <line x1="4" y1="16" x2="20" y2="16" stroke="${L.robe2}" stroke-width="1"/>
      <line x1="4" y1="22" x2="20" y2="22" stroke="${L.robe2}" stroke-width="1"/>
    </g>
  `;
}

function drawLiqingzhao(L, rank) {
  return `
    <!-- 宋裝 -->
    <path d="M28 132 Q44 84 60 78 Q76 84 92 132 Z" fill="${L.robe}"/>
    <path d="M46 88 L60 106 L74 88" fill="${L.robe2}" opacity=".7"/>
    <path d="M36 102 Q60 94 84 102" fill="none" stroke="${L.accent}" stroke-width="1.8"/>
    <!-- 雙鬟 -->
    <path d="M34 56 C36 32 84 32 86 56" fill="${L.hair}"/>
    <ellipse cx="42" cy="34" rx="11" ry="9" fill="${L.hair}"/>
    <ellipse cx="78" cy="34" rx="11" ry="9" fill="${L.hair}"/>
    <path d="M26 58 Q12 95 22 122" fill="${L.hair}"/>
    <path d="M94 58 Q108 95 98 122" fill="${L.hair}"/>
    <circle cx="42" cy="34" r="3" fill="${L.accent}"/>
    <circle cx="78" cy="34" r="3" fill="${L.accent}"/>
    <!-- 臉：清麗 -->
    <ellipse cx="60" cy="64" rx="23" ry="27" fill="${L.skin}"/>
    <ellipse cx="40" cy="72" rx="6" ry="3.5" fill="#e89a90" opacity=".4"/>
    <ellipse cx="80" cy="72" rx="6" ry="3.5" fill="#e89a90" opacity=".4"/>
    <path d="M44 54 Q50 50 55 54" fill="none" stroke="${L.hair}" stroke-width="1.7"/>
    <path d="M65 54 Q70 50 76 54" fill="none" stroke="${L.hair}" stroke-width="1.7"/>
    ${eyes(49, 71, 62, L.eye, "soft")}
    <path d="M52 80 Q60 85 68 80" fill="none" stroke="${L.lip}" stroke-width="2.4" stroke-linecap="round"/>
    <!-- 詞箋筆 -->
    <g transform="translate(88,92) rotate(15)">
      <rect x="0" y="4" width="18" height="24" rx="1" fill="#f7f0dc" stroke="${L.accent}"/>
      <line x1="4" y1="10" x2="14" y2="10" stroke="${L.robe2}" stroke-width="1"/>
      <line x1="4" y1="15" x2="14" y2="15" stroke="${L.robe2}" stroke-width="1"/>
      <rect x="20" y="0" width="3" height="30" fill="#2a2018"/>
      <path d="M20 0 L23 -6 L26 0" fill="${L.accent}"/>
    </g>
  `;
}

function drawWangzhaojun(L, rank) {
  return `
    <!-- 出塞裝＋斗篷 -->
    <path d="M18 134 Q34 82 60 76 Q86 82 102 134 Z" fill="${L.robe}"/>
    <path d="M24 100 Q60 86 96 100 L100 134 H20 Z" fill="${L.robe2}" opacity=".82"/>
    <path d="M32 112 H88" stroke="${L.accent}" stroke-width="2.5"/>
    <ellipse cx="20" cy="110" rx="14" ry="20" fill="${L.robe2}"/>
    <ellipse cx="100" cy="110" rx="14" ry="20" fill="${L.robe2}"/>
    <!-- 長髮＋皮帽 -->
    <path d="M34 56 C36 30 84 30 86 56" fill="${L.hair}"/>
    <path d="M22 58 Q4 105 16 136" fill="${L.hair}"/>
    <path d="M98 58 Q116 105 104 136" fill="${L.hair}"/>
    <path d="M20 50 Q60 4 100 50" fill="${L.robe2}"/>
    <path d="M28 50 Q60 16 92 50" fill="${L.accent}" opacity=".6"/>
    <!-- 臉：清冷美 -->
    <ellipse cx="60" cy="64" rx="24" ry="27" fill="${L.skin}"/>
    <ellipse cx="40" cy="72" rx="6" ry="3.5" fill="#e89a90" opacity=".35"/>
    <ellipse cx="80" cy="72" rx="6" ry="3.5" fill="#e89a90" opacity=".35"/>
    <path d="M44 54 Q50 49 56 54" fill="none" stroke="${L.hair}" stroke-width="1.8"/>
    <path d="M64 54 Q70 49 76 54" fill="none" stroke="${L.hair}" stroke-width="1.8"/>
    ${eyes(49, 71, 62, L.eye, "soft")}
    <path d="M52 80 Q60 84 68 80" fill="none" stroke="${L.lip}" stroke-width="2.3"/>
    <!-- 月牙飾 -->
    <path d="M96 48 Q108 40 104 56" fill="none" stroke="#e8e0d0" stroke-width="2.5"/>
  `;
}

function drawBanzhao(L, rank) {
  return `
    <!-- 女史深衣 -->
    <path d="M26 132 Q42 84 60 78 Q78 84 94 132 Z" fill="${L.robe}"/>
    <path d="M46 88 L60 108 L74 88" fill="${L.robe2}" opacity=".75"/>
    <path d="M36 102 H84" stroke="${L.accent}" stroke-width="1.8"/>
    <!-- 書卷 -->
    <g transform="translate(84,94)">
      <rect x="0" y="0" width="20" height="28" rx="2" fill="${L.accent}"/>
      <rect x="3" y="4" width="14" height="20" fill="#f7f0dc"/>
      <line x1="5" y1="9" x2="15" y2="9" stroke="${L.robe2}" stroke-width="1"/>
      <line x1="5" y1="14" x2="15" y2="14" stroke="${L.robe2}" stroke-width="1"/>
      <line x1="5" y1="19" x2="13" y2="19" stroke="${L.robe2}" stroke-width="1"/>
    </g>
    <!-- 髮髻端莊 -->
    <path d="M34 56 C36 32 84 32 86 56" fill="${L.hair}"/>
    <circle cx="60" cy="28" r="13" fill="${L.hair}"/>
    <path d="M28 58 Q16 95 26 120" fill="${L.hair}"/>
    <path d="M92 58 Q104 95 94 120" fill="${L.hair}"/>
    <circle cx="60" cy="24" r="4" fill="${L.accent}"/>
    <!-- 臉：端莊睿智 -->
    <ellipse cx="60" cy="64" rx="23" ry="26" fill="${L.skin}"/>
    <ellipse cx="42" cy="72" rx="5" ry="3" fill="#e89a90" opacity=".35"/>
    <ellipse cx="78" cy="72" rx="5" ry="3" fill="#e89a90" opacity=".35"/>
    <path d="M44 54 Q50 50 55 54" fill="none" stroke="${L.hair}" stroke-width="1.8"/>
    <path d="M65 54 Q70 50 76 54" fill="none" stroke="${L.hair}" stroke-width="1.8"/>
    ${eyes(49, 71, 62, L.eye, "normal")}
    <path d="M52 78 Q60 82 68 78" fill="none" stroke="${L.lip}" stroke-width="2.1"/>
  `;
}

const DRAW = {
  hanxin: drawHanxin,
  zhuge: drawZhuge,
  yuefei: drawYuefei,
  zhenghe: drawZhenghe,
  simaqian: drawSimaqian,
  sunwu: drawSunwu,
  wuzetian: drawWuzetian,
  mulan: drawMulan,
  caiwenji: drawCaiwenji,
  liqingzhao: drawLiqingzhao,
  wangzhaojun: drawWangzhaojun,
  banzhao: drawBanzhao,
};

const GLOW = [0, 0, 0.1, 0.15, 0.22, 0.3, 0.38, 0.48, 0.58];

export function renderAvatar(character, rankId = 0, size = "md") {
  if (!character?.look) {
    return `<div class="avatar-fallback" style="background:${character?.color || "#444"}">${character?.name?.[0] || "?"}</div>`;
  }
  const L = character.look;
  const rank = Math.min(8, Math.max(0, rankId));
  const dims = size === "lg" ? 220 : size === "sm" ? 92 : 128;
  const uid = `av-${character.id}-${++avatarSeq}`;
  const draw = DRAW[character.id];
  const inner = draw ? draw(L, rank) : drawHanxin(L, rank);

  return `
  <svg class="avatar-svg avatar-${size}" viewBox="0 -6 120 152" width="${dims}" height="${Math.round(dims * 1.2)}" aria-label="${character.name}" role="img">
    ${frame(uid, L.accent, L.robe, L.robe2, inner, character.era, GLOW[rank])}
  </svg>`;
}
