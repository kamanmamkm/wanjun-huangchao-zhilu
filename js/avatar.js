/**
 * 漫畫風角色肖像（日系／港漫感：大眼、俐落線條、有型髮型與衣裝）
 */
let avatarSeq = 0;

const GLOW = [0, 0.06, 0.12, 0.18, 0.25, 0.32, 0.4, 0.5, 0.58];

function mangaEyes(L, mood = "bright") {
  // mood: bright | cool | gentle | fierce
  const y = 58;
  const open = mood === "fierce" ? 9 : mood === "gentle" ? 11.5 : 10.5;
  const iris = mood === "cool" ? 5.2 : 6.2;
  const brow =
    mood === "fierce"
      ? `<path d="M32 44 L50 40" stroke="${L.hair}" stroke-width="2.8" stroke-linecap="round"/>
         <path d="M88 44 L70 40" stroke="${L.hair}" stroke-width="2.8" stroke-linecap="round"/>`
      : mood === "cool"
        ? `<path d="M34 46 Q42 42 50 45" fill="none" stroke="${L.hair}" stroke-width="2.4" stroke-linecap="round"/>
           <path d="M86 46 Q78 42 70 45" fill="none" stroke="${L.hair}" stroke-width="2.4" stroke-linecap="round"/>`
        : `<path d="M34 45 Q42 40 51 45" fill="none" stroke="${L.hair}" stroke-width="2.2" stroke-linecap="round"/>
           <path d="M86 45 Q78 40 69 45" fill="none" stroke="${L.hair}" stroke-width="2.2" stroke-linecap="round"/>`;

  return `
    ${brow}
    <!-- 左眼 -->
    <ellipse cx="43" cy="${y}" rx="12" ry="${open}" fill="#fff" stroke="#2a1810" stroke-width="1.6"/>
    <ellipse cx="44" cy="${y + 0.5}" rx="${iris}" ry="${iris + 0.8}" fill="${L.eye}"/>
    <ellipse cx="44" cy="${y + 0.5}" rx="3.2" ry="3.6" fill="#0d0a08"/>
    <circle cx="40" cy="${y - 3}" r="3.8" fill="#fff"/>
    <circle cx="47" cy="${y + 3}" r="1.6" fill="#fff" opacity=".85"/>
    ${mood === "gentle" ? `<path d="M33 ${y + 2} Q43 ${y + 8} 53 ${y + 2}" fill="none" stroke="#2a1810" stroke-width="1.2"/>` : ""}
    <!-- 右眼 -->
    <ellipse cx="77" cy="${y}" rx="12" ry="${open}" fill="#fff" stroke="#2a1810" stroke-width="1.6"/>
    <ellipse cx="78" cy="${y + 0.5}" rx="${iris}" ry="${iris + 0.8}" fill="${L.eye}"/>
    <ellipse cx="78" cy="${y + 0.5}" rx="3.2" ry="3.6" fill="#0d0a08"/>
    <circle cx="74" cy="${y - 3}" r="3.8" fill="#fff"/>
    <circle cx="81" cy="${y + 3}" r="1.6" fill="#fff" opacity=".85"/>
    ${mood === "gentle" ? `<path d="M67 ${y + 2} Q77 ${y + 8} 87 ${y + 2}" fill="none" stroke="#2a1810" stroke-width="1.2"/>` : ""}
  `;
}

function mangaFace(L, opts = {}) {
  const mood = opts.mood || "bright";
  const mouth = opts.mouth || "smile";
  let mouthSvg = `<path d="M50 78 Q60 86 70 78" fill="none" stroke="${L.lip}" stroke-width="2.6" stroke-linecap="round"/>`;
  if (mouth === "grin") {
    mouthSvg = `<path d="M48 77 Q60 90 72 77" fill="${L.lip}" opacity=".35"/><path d="M48 77 Q60 88 72 77" fill="none" stroke="${L.lip}" stroke-width="2.4" stroke-linecap="round"/>`;
  } else if (mouth === "smirk") {
    mouthSvg = `<path d="M52 80 Q62 84 72 76" fill="none" stroke="${L.lip}" stroke-width="2.5" stroke-linecap="round"/>`;
  } else if (mouth === "dot") {
    mouthSvg = `<ellipse cx="60" cy="80" rx="3" ry="2.2" fill="${L.lip}"/>`;
  } else if (mouth === "cat") {
    mouthSvg = `<path d="M50 78 Q55 85 60 78 Q65 85 70 78" fill="none" stroke="${L.lip}" stroke-width="2.4" stroke-linecap="round"/>`;
  }

  return `
    <!-- 臉型（略尖下巴＝漫畫感） -->
    <path d="M28 50 Q30 22 60 18 Q90 22 92 50 Q94 78 60 96 Q26 78 28 50 Z" fill="${L.skin}" stroke="#2a1810" stroke-width="1.4"/>
    <ellipse cx="26" cy="58" rx="5" ry="7" fill="${L.skin}" stroke="#2a1810" stroke-width="1"/>
    <ellipse cx="94" cy="58" rx="5" ry="7" fill="${L.skin}" stroke="#2a1810" stroke-width="1"/>
    <ellipse cx="34" cy="72" rx="8" ry="4.5" fill="#ff7a90" opacity=".4"/>
    <ellipse cx="86" cy="72" rx="8" ry="4.5" fill="#ff7a90" opacity=".4"/>
    ${mangaEyes(L, mood)}
    <!-- 鼻子 -->
    <path d="M60 64 L58 72" fill="none" stroke="#c48a78" stroke-width="1.3" stroke-linecap="round"/>
    ${mouthSvg}
    ${
      opts.beard
        ? `<path d="M40 86 Q60 112 80 86" fill="none" stroke="${L.hair}" stroke-width="3" stroke-linecap="round"/>
           <path d="M56 82 Q60 92 64 82" fill="${L.hair}"/>`
        : ""
    }
  `;
}

function frame(uid, L, era, glow, inner) {
  return `
    <defs>
      <linearGradient id="${uid}-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#fffef9"/>
        <stop offset="100%" stop-color="#efe0c0"/>
      </linearGradient>
      <linearGradient id="${uid}-shine" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fff" stop-opacity=".5"/>
        <stop offset="40%" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
      <filter id="${uid}-s"><feDropShadow dx="0" dy="2" stdDeviation="1.4" flood-opacity=".22"/></filter>
    </defs>
    <rect x="2" y="2" width="116" height="142" rx="18" fill="url(#${uid}-bg)" stroke="${L.accent}" stroke-width="3"/>
    <rect x="2" y="2" width="116" height="142" rx="18" fill="url(#${uid}-shine)"/>
    <rect x="7" y="7" width="106" height="132" rx="14" fill="none" stroke="${L.robe}" stroke-width="1" opacity=".2"/>
    ${glow > 0.2 ? `<circle cx="60" cy="55" r="46" fill="${L.accent}" opacity="${glow * 0.14}"/>` : ""}
    <g filter="url(#${uid}-s)">${inner}</g>
    <text x="60" y="138" text-anchor="middle" font-size="7.5" fill="${L.robe2}" font-family="sans-serif" letter-spacing="0.5">${era}</text>
  `;
}

function bodyArmor(L) {
  return `
    <path d="M32 100 L46 90 L60 94 L74 90 L88 100 L84 136 H36 Z" fill="${L.robe2}" stroke="#2a1810" stroke-width="1.2"/>
    <path d="M40 104 H80" stroke="${L.accent}" stroke-width="3.5"/>
    <path d="M42 112 H78" stroke="${L.accent}" stroke-width="2.4"/>
    <path d="M44 120 H76" stroke="${L.accent}" stroke-width="2"/>
    <path d="M28 98 L16 108 L34 114 Z" fill="${L.accent}" stroke="#2a1810" stroke-width="1"/>
    <path d="M92 98 L104 108 L86 114 Z" fill="${L.accent}" stroke="#2a1810" stroke-width="1"/>
  `;
}

function bodyRobe(L) {
  return `
    <path d="M34 100 Q48 88 60 86 Q72 88 86 100 L82 136 H38 Z" fill="${L.robe}" stroke="#2a1810" stroke-width="1.2"/>
    <path d="M48 94 L60 112 L72 94" fill="${L.robe2}" opacity=".75"/>
    <path d="M38 108 Q60 100 82 108" fill="none" stroke="${L.accent}" stroke-width="1.6"/>
  `;
}

function drawHanxin(L) {
  return `
    ${bodyArmor(L)}
    <path d="M26 48 C32 14 88 14 94 48" fill="${L.hair}" stroke="#2a1810" stroke-width="1"/>
    ${mangaFace(L, { mood: "cool", mouth: "smirk" })}
    <path d="M24 46 C30 12 90 12 96 46 L88 56 H32 Z" fill="${L.robe2}" stroke="#2a1810" stroke-width="1.4"/>
    <path d="M50 16 L60 0 L70 16" fill="${L.accent}" stroke="#2a1810" stroke-width="1"/>
    <rect x="53" y="16" width="14" height="12" rx="1" fill="${L.accent}" stroke="#2a1810" stroke-width="1"/>
    <!-- 劍 -->
    <rect x="98" y="86" width="6" height="42" rx="1" fill="${L.accent}" stroke="#2a1810" stroke-width="1"/>
    <rect x="94" y="82" width="14" height="8" rx="2" fill="${L.robe2}" stroke="#2a1810" stroke-width="1"/>
  `;
}

function drawZhuge(L) {
  return `
    ${bodyRobe(L)}
    <path d="M26 104 Q6 120 20 132 L36 110 Z" fill="${L.robe2}" stroke="#2a1810" stroke-width="1"/>
    <path d="M94 104 Q114 120 100 132 L84 110 Z" fill="${L.robe2}" stroke="#2a1810" stroke-width="1"/>
    <path d="M28 48 C34 18 86 18 92 48" fill="${L.hair}" stroke="#2a1810" stroke-width="1"/>
    ${mangaFace(L, { mood: "gentle", mouth: "smile", beard: true })}
    <ellipse cx="60" cy="32" rx="40" ry="16" fill="${L.robe}" stroke="#2a1810" stroke-width="1.4"/>
    <path d="M30 34 Q60 4 90 34" fill="none" stroke="${L.accent}" stroke-width="2.8"/>
    <circle cx="60" cy="12" r="5.5" fill="${L.accent}" stroke="#2a1810" stroke-width="1"/>
    <g transform="translate(92,92) rotate(-24)">
      <rect x="0" y="10" width="4" height="28" fill="#6b4a20" stroke="#2a1810" stroke-width="0.8"/>
      <path d="M-16 10 Q2 -12 20 10 Z" fill="${L.accent}" stroke="#2a1810" stroke-width="1"/>
      <path d="M-10 10 L2 0 L14 10" fill="none" stroke="#2a1810" stroke-width="0.8"/>
    </g>
  `;
}

function drawYuefei(L) {
  return `
    <path d="M16 134 Q28 88 46 84 L60 90 L74 84 Q92 88 104 134 Z" fill="${L.robe}" stroke="#2a1810" stroke-width="1.2"/>
    ${bodyArmor(L)}
    <path d="M28 48 C34 16 86 16 92 48" fill="${L.hair}" stroke="#2a1810" stroke-width="1"/>
    ${mangaFace(L, { mood: "fierce", mouth: "grin" })}
    <path d="M22 48 L34 8 H86 L98 48 Z" fill="${L.robe2}" stroke="#2a1810" stroke-width="1.4"/>
    <path d="M50 8 L60 -6 L70 8" fill="${L.accent}" stroke="#2a1810" stroke-width="1"/>
    <line x1="104" y1="44" x2="108" y2="126" stroke="#4a3020" stroke-width="4.5"/>
    <path d="M99 40 L108 18 L117 40 Z" fill="${L.accent}" stroke="#2a1810" stroke-width="1"/>
  `;
}

function drawZhenghe(L) {
  return `
    ${bodyRobe(L)}
    <path d="M32 110 H88" stroke="${L.accent}" stroke-width="3.5"/>
    <ellipse cx="22" cy="114" rx="12" ry="16" fill="${L.robe2}" stroke="#2a1810" stroke-width="1"/>
    <ellipse cx="98" cy="114" rx="12" ry="16" fill="${L.robe2}" stroke="#2a1810" stroke-width="1"/>
    <path d="M28 48 C34 18 86 18 92 48" fill="${L.hair}" stroke="#2a1810" stroke-width="1"/>
    ${mangaFace(L, { mood: "cool", mouth: "smile" })}
    <rect x="32" y="24" width="56" height="22" rx="5" fill="${L.robe2}" stroke="#2a1810" stroke-width="1.4"/>
    <path d="M32 30 L8 12 L36 38" fill="${L.accent}" stroke="#2a1810" stroke-width="1"/>
    <path d="M88 30 L112 12 L84 38" fill="${L.accent}" stroke="#2a1810" stroke-width="1"/>
    <circle cx="28" cy="66" r="3.5" fill="${L.accent}" stroke="#2a1810" stroke-width="0.8"/>
    <circle cx="92" cy="66" r="3.5" fill="${L.accent}" stroke="#2a1810" stroke-width="0.8"/>
  `;
}

function drawSimaqian(L) {
  return `
    ${bodyRobe(L)}
    <path d="M28 48 C34 18 86 18 92 48" fill="${L.hair}" stroke="#2a1810" stroke-width="1"/>
    ${mangaFace(L, { mood: "gentle", mouth: "dot", beard: true })}
    <rect x="42" y="10" width="36" height="30" rx="5" fill="${L.hair}" stroke="#2a1810" stroke-width="1.2"/>
    <rect x="48" y="2" width="24" height="14" rx="3" fill="${L.robe2}" stroke="#2a1810" stroke-width="1"/>
    <rect x="54" y="-4" width="12" height="10" rx="2" fill="${L.accent}" stroke="#2a1810" stroke-width="1"/>
    <rect x="90" y="96" width="16" height="28" rx="2" fill="${L.accent}" stroke="#2a1810" stroke-width="1"/>
    <line x1="94" y1="104" x2="102" y2="104" stroke="${L.robe2}" stroke-width="1.2"/>
    <line x1="94" y1="110" x2="102" y2="110" stroke="${L.robe2}" stroke-width="1.2"/>
  `;
}

function drawSunwu(L) {
  return `
    ${bodyArmor(L)}
    <path d="M28 48 C34 16 86 16 92 48" fill="${L.hair}" stroke="#2a1810" stroke-width="1"/>
    ${mangaFace(L, { mood: "cool", mouth: "smirk" })}
    <path d="M26 48 Q60 2 94 48" fill="${L.robe2}" stroke="#2a1810" stroke-width="1.5"/>
    <circle cx="60" cy="24" r="9" fill="${L.accent}" stroke="#2a1810" stroke-width="1.2"/>
    <circle cx="60" cy="24" r="4" fill="${L.robe}"/>
    <g transform="translate(6,78) rotate(-10)">
      <rect width="18" height="26" rx="3" fill="${L.accent}" stroke="#2a1810" stroke-width="1"/>
      <text x="9" y="17" text-anchor="middle" font-size="9" fill="${L.robe2}" font-family="sans-serif">兵</text>
    </g>
  `;
}

function drawWuzetian(L) {
  return `
    <path d="M18 136 Q36 90 60 86 Q84 90 102 136 Z" fill="${L.robe}" stroke="#2a1810" stroke-width="1.2"/>
    <path d="M34 100 Q60 122 86 100" fill="${L.robe2}" opacity=".9"/>
    <circle cx="46" cy="106" r="4.5" fill="#fff3c4" stroke="#2a1810" stroke-width="0.8"/>
    <circle cx="74" cy="106" r="4.5" fill="#fff3c4" stroke="#2a1810" stroke-width="0.8"/>
    <path d="M26 48 C34 14 86 14 94 48" fill="${L.hair}" stroke="#2a1810" stroke-width="1"/>
    <ellipse cx="60" cy="16" rx="16" ry="18" fill="${L.hair}" stroke="#2a1810" stroke-width="1"/>
    <path d="M18 54 Q4 100 14 132" fill="${L.hair}" stroke="#2a1810" stroke-width="1"/>
    <path d="M102 54 Q116 100 106 132" fill="${L.hair}" stroke="#2a1810" stroke-width="1"/>
    ${mangaFace(L, { mood: "fierce", mouth: "smirk" })}
    <path d="M38 32 Q60 -8 82 32" fill="${L.accent}" stroke="#2a1810" stroke-width="1.2"/>
    <circle cx="60" cy="10" r="7" fill="#fff6c8" stroke="#2a1810" stroke-width="1"/>
    <path d="M28 28 L4 0 L42 26" fill="${L.robe}" stroke="#2a1810" stroke-width="1"/>
    <path d="M92 28 L116 0 L78 26" fill="${L.robe}" stroke="#2a1810" stroke-width="1"/>
  `;
}

function drawMulan(L) {
  return `
    ${bodyArmor(L)}
    <path d="M28 48 C34 18 86 18 92 48" fill="${L.hair}" stroke="#2a1810" stroke-width="1"/>
    <ellipse cx="60" cy="22" rx="10" ry="12" fill="${L.hair}" stroke="#2a1810" stroke-width="1"/>
    <path d="M24 56 Q12 95 22 122" fill="${L.hair}" stroke="#2a1810" stroke-width="1"/>
    <path d="M96 56 Q108 95 98 122" fill="${L.hair}" stroke="#2a1810" stroke-width="1"/>
    ${mangaFace(L, { mood: "bright", mouth: "grin" })}
    <path d="M28 46 L40 10 H80 L92 46 Z" fill="${L.robe2}" stroke="#2a1810" stroke-width="1.4"/>
    <rect x="52" y="6" width="16" height="12" rx="2" fill="${L.accent}" stroke="#2a1810" stroke-width="1"/>
    <g transform="translate(98,80) rotate(12)">
      <rect width="7" height="44" rx="1" fill="${L.accent}" stroke="#2a1810" stroke-width="1"/>
      <path d="M-2 0 L3.5 -16 L9 0 Z" fill="${L.robe2}" stroke="#2a1810" stroke-width="1"/>
    </g>
  `;
}

function drawCaiwenji(L) {
  return `
    ${bodyRobe(L)}
    <path d="M28 48 C34 18 86 18 92 48" fill="${L.hair}" stroke="#2a1810" stroke-width="1"/>
    <circle cx="24" cy="56" r="12" fill="${L.hair}" stroke="#2a1810" stroke-width="1"/>
    <circle cx="96" cy="56" r="12" fill="${L.hair}" stroke="#2a1810" stroke-width="1"/>
    <path d="M14 58 Q0 100 10 128" fill="${L.hair}" stroke="#2a1810" stroke-width="1"/>
    <path d="M106 58 Q120 100 110 128" fill="${L.hair}" stroke="#2a1810" stroke-width="1"/>
    ${mangaFace(L, { mood: "gentle", mouth: "cat" })}
    <circle cx="22" cy="46" r="4.5" fill="${L.accent}" stroke="#2a1810" stroke-width="0.8"/>
    <circle cx="98" cy="46" r="4.5" fill="${L.accent}" stroke="#2a1810" stroke-width="0.8"/>
    <ellipse cx="14" cy="110" rx="14" ry="18" fill="${L.accent}" stroke="#2a1810" stroke-width="1" opacity=".95"/>
    <rect x="10" y="92" width="8" height="20" rx="2" fill="${L.robe2}" stroke="#2a1810" stroke-width="0.8"/>
  `;
}

function drawLiqingzhao(L) {
  return `
    ${bodyRobe(L)}
    <path d="M28 48 C34 18 86 18 92 48" fill="${L.hair}" stroke="#2a1810" stroke-width="1"/>
    <ellipse cx="36" cy="28" rx="14" ry="12" fill="${L.hair}" stroke="#2a1810" stroke-width="1"/>
    <ellipse cx="84" cy="28" rx="14" ry="12" fill="${L.hair}" stroke="#2a1810" stroke-width="1"/>
    <path d="M18 56 Q6 98 14 124" fill="${L.hair}" stroke="#2a1810" stroke-width="1"/>
    <path d="M102 56 Q114 98 106 124" fill="${L.hair}" stroke="#2a1810" stroke-width="1"/>
    ${mangaFace(L, { mood: "gentle", mouth: "smile" })}
    <circle cx="36" cy="28" r="4" fill="${L.accent}" stroke="#2a1810" stroke-width="0.8"/>
    <circle cx="84" cy="28" r="4" fill="${L.accent}" stroke="#2a1810" stroke-width="0.8"/>
    <g transform="translate(88,94) rotate(14)">
      <rect width="18" height="26" rx="2" fill="#fffef8" stroke="#2a1810" stroke-width="1.2"/>
      <rect x="20" y="0" width="3.5" height="30" fill="#1a120c"/>
      <path d="M20 0 L23.5 -8 L27 0" fill="${L.accent}" stroke="#2a1810" stroke-width="0.8"/>
    </g>
  `;
}

function drawWangzhaojun(L) {
  return `
    <path d="M26 102 Q42 88 60 86 Q78 88 94 102 L90 136 H30 Z" fill="${L.robe}" stroke="#2a1810" stroke-width="1.2"/>
    <path d="M22 108 Q60 92 98 108 L102 136 H18 Z" fill="${L.robe2}" opacity=".85" stroke="#2a1810" stroke-width="1"/>
    <path d="M28 48 C34 16 86 16 92 48" fill="${L.hair}" stroke="#2a1810" stroke-width="1"/>
    <path d="M14 54 Q0 102 10 134" fill="${L.hair}" stroke="#2a1810" stroke-width="1"/>
    <path d="M106 54 Q120 102 110 134" fill="${L.hair}" stroke="#2a1810" stroke-width="1"/>
    ${mangaFace(L, { mood: "gentle", mouth: "dot" })}
    <path d="M20 46 Q60 0 100 46" fill="${L.robe2}" stroke="#2a1810" stroke-width="1.3"/>
    <path d="M28 46 Q60 14 92 46" fill="${L.accent}" opacity=".55"/>
    <path d="M98 40 Q112 30 108 48" fill="none" stroke="#fff8e8" stroke-width="3"/>
  `;
}

function drawBanzhao(L) {
  return `
    ${bodyRobe(L)}
    <path d="M28 48 C34 18 86 18 92 48" fill="${L.hair}" stroke="#2a1810" stroke-width="1"/>
    <circle cx="60" cy="22" r="16" fill="${L.hair}" stroke="#2a1810" stroke-width="1"/>
    <path d="M20 56 Q8 98 16 122" fill="${L.hair}" stroke="#2a1810" stroke-width="1"/>
    <path d="M100 56 Q112 98 104 122" fill="${L.hair}" stroke="#2a1810" stroke-width="1"/>
    ${mangaFace(L, { mood: "bright", mouth: "smile" })}
    <circle cx="60" cy="18" r="4.5" fill="${L.accent}" stroke="#2a1810" stroke-width="0.8"/>
    <g transform="translate(86,96)">
      <rect width="22" height="30" rx="3" fill="${L.accent}" stroke="#2a1810" stroke-width="1.2"/>
      <rect x="3" y="4" width="16" height="22" fill="#fffef8"/>
      <line x1="6" y1="10" x2="16" y2="10" stroke="${L.robe2}" stroke-width="1"/>
      <line x1="6" y1="16" x2="16" y2="16" stroke="${L.robe2}" stroke-width="1"/>
    </g>
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

export function renderAvatar(character, rankId = 0, size = "md") {
  if (!character?.look) {
    return `<div class="avatar-fallback" style="background:${character?.color || "#444"}">${character?.name?.[0] || "?"}</div>`;
  }
  const L = character.look;
  const rank = Math.min(8, Math.max(0, rankId));
  const dims = size === "lg" ? 248 : size === "sm" ? 104 : 148;
  const uid = `av-${character.id}-${++avatarSeq}`;
  const draw = DRAW[character.id] || drawHanxin;
  return `
  <svg class="avatar-svg avatar-${size}" viewBox="0 -10 120 156" width="${dims}" height="${Math.round(dims * 1.24)}" aria-label="${character.name}" role="img">
    ${frame(uid, L, character.era, GLOW[rank], draw(L))}
  </svg>`;
}
