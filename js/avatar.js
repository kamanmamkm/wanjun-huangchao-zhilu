/**
 * 可愛 Q 版古代人物（大頭大眼、粉嫩臉頰；衣裝帽子各不相同）
 * 繪製順序：身體 → 後髮 → 臉 → 帽／前髮 → 道具
 */
let avatarSeq = 0;

function sparkleEyes(y, eyeColor) {
  return `
    <ellipse cx="42" cy="${y}" rx="11" ry="12" fill="#fff" stroke="#f0d0c0" stroke-width="0.6"/>
    <ellipse cx="78" cy="${y}" rx="11" ry="12" fill="#fff" stroke="#f0d0c0" stroke-width="0.6"/>
    <circle cx="44" cy="${y + 1}" r="6.5" fill="${eyeColor}"/>
    <circle cx="80" cy="${y + 1}" r="6.5" fill="${eyeColor}"/>
    <circle cx="41" cy="${y - 2.5}" r="3.4" fill="#fff"/>
    <circle cx="77" cy="${y - 2.5}" r="3.4" fill="#fff"/>
    <circle cx="47.5" cy="${y + 4}" r="1.7" fill="#fff" opacity=".95"/>
    <circle cx="83.5" cy="${y + 4}" r="1.7" fill="#fff" opacity=".95"/>
  `;
}

function cuteFace(L, opts = {}) {
  const y = opts.eyeY || 60;
  const mouth = opts.mouth || "smile";
  let mouthPath = `M49 ${y + 20} Q60 ${y + 28} 71 ${y + 20}`;
  if (mouth === "grin") mouthPath = `M46 ${y + 20} Q60 ${y + 31} 74 ${y + 20}`;
  if (mouth === "tiny") mouthPath = `M54 ${y + 22} Q60 ${y + 26} 66 ${y + 22}`;
  if (mouth === "cat") mouthPath = `M50 ${y + 20} Q55 ${y + 27} 60 ${y + 20} Q65 ${y + 27} 70 ${y + 20}`;

  return `
    <ellipse cx="60" cy="58" rx="33" ry="35" fill="${L.skin}"/>
    <ellipse cx="27" cy="60" rx="6.5" ry="8.5" fill="${L.skin}"/>
    <ellipse cx="93" cy="60" rx="6.5" ry="8.5" fill="${L.skin}"/>
    <ellipse cx="30" cy="72" rx="10" ry="5.5" fill="#ff8fa3" opacity=".5"/>
    <ellipse cx="90" cy="72" rx="10" ry="5.5" fill="#ff8fa3" opacity=".5"/>
    <path d="M36 47 Q45 40 53 47" fill="none" stroke="${L.hair}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M67 47 Q75 40 84 47" fill="none" stroke="${L.hair}" stroke-width="2.6" stroke-linecap="round"/>
    ${sparkleEyes(y, L.eye)}
    <ellipse cx="60" cy="${y + 11}" rx="3.2" ry="2.4" fill="${L.skin}" stroke="${L.eye}" stroke-width="0.6" opacity=".3"/>
    <path d="${mouthPath}" fill="none" stroke="${L.lip}" stroke-width="3" stroke-linecap="round"/>
    ${
      opts.beard
        ? `<path d="M38 88 Q60 112 82 88 Q60 100 38 88" fill="${L.hair}" opacity=".88"/><ellipse cx="60" cy="86" rx="5" ry="4" fill="${L.hair}"/>`
        : ""
    }
  `;
}

function card(uid, L, era, glow, inner) {
  return `
    <defs>
      <linearGradient id="${uid}-g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fffef8"/>
        <stop offset="100%" stop-color="#f5e4c0"/>
      </linearGradient>
      <filter id="${uid}-s"><feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-opacity=".2"/></filter>
    </defs>
    <rect x="2" y="2" width="116" height="140" rx="24" fill="url(#${uid}-g)" stroke="${L.accent}" stroke-width="3.2"/>
    <rect x="8" y="8" width="104" height="128" rx="20" fill="none" stroke="${L.robe}" stroke-width="1.2" opacity=".22"/>
    ${glow > 0.2 ? `<circle cx="60" cy="58" r="44" fill="${L.accent}" opacity="${glow * 0.14}"/>` : ""}
    <g filter="url(#${uid}-s)">${inner}</g>
    <text x="60" y="136" text-anchor="middle" font-size="8" fill="${L.robe2}" font-family="sans-serif">${era}</text>
  `;
}

function bodyArmor(L) {
  return `
    <path d="M34 102 L46 93 L60 97 L74 93 L86 102 L82 134 H38 Z" fill="${L.robe2}"/>
    <path d="M40 106 H80" stroke="${L.accent}" stroke-width="3.2"/>
    <path d="M42 114 H78" stroke="${L.accent}" stroke-width="2.2"/>
    <ellipse cx="30" cy="106" rx="11" ry="9" fill="${L.accent}"/>
    <ellipse cx="90" cy="106" rx="11" ry="9" fill="${L.accent}"/>
  `;
}

function bodyRobe(L) {
  return `
    <path d="M36 102 Q48 92 60 90 Q72 92 84 102 L80 134 H40 Z" fill="${L.robe}"/>
    <path d="M48 98 L60 112 L72 98" fill="${L.robe2}" opacity=".7"/>
  `;
}

const GLOW = [0, 0.05, 0.1, 0.15, 0.22, 0.3, 0.38, 0.48, 0.55];

function drawHanxin(L) {
  return `
    ${bodyArmor(L)}
    <path d="M30 52 C34 22 86 22 90 52" fill="${L.hair}"/>
    ${cuteFace(L, { mouth: "grin" })}
    <path d="M28 48 C32 16 88 16 92 48 L84 58 H36 Z" fill="${L.robe2}" stroke="${L.accent}" stroke-width="2.2"/>
    <path d="M52 18 L60 2 L68 18" fill="${L.accent}"/>
    <rect x="54" y="18" width="12" height="12" rx="2" fill="${L.accent}"/>
    <rect x="97" y="90" width="7" height="38" rx="2" fill="${L.accent}"/>
  `;
}

function drawZhuge(L) {
  return `
    ${bodyRobe(L)}
    <path d="M28 104 Q8 120 22 130 L38 110 Z" fill="${L.robe2}"/>
    <path d="M92 104 Q112 120 98 130 L82 110 Z" fill="${L.robe2}"/>
    <path d="M32 50 C36 24 84 24 88 50" fill="${L.hair}"/>
    ${cuteFace(L, { mouth: "smile", beard: true })}
    <ellipse cx="60" cy="34" rx="38" ry="17" fill="${L.robe}" stroke="${L.accent}" stroke-width="2.2"/>
    <path d="M32 36 Q60 8 88 36" fill="none" stroke="${L.accent}" stroke-width="2.6"/>
    <circle cx="60" cy="14" r="5.5" fill="${L.accent}"/>
    <g transform="translate(92,94) rotate(-22)">
      <rect x="0" y="10" width="4" height="26" fill="#8B6914"/>
      <path d="M-14 10 Q2 -10 18 10 Z" fill="${L.accent}"/>
    </g>
  `;
}

function drawYuefei(L) {
  return `
    <path d="M18 132 Q28 90 46 88 L60 94 L74 88 Q92 90 102 132 Z" fill="${L.robe}"/>
    ${bodyArmor(L)}
    <path d="M30 50 C34 22 86 22 90 50" fill="${L.hair}"/>
    ${cuteFace(L, { mouth: "grin" })}
    <path d="M26 50 L36 10 H84 L94 50 Z" fill="${L.robe2}" stroke="${L.accent}" stroke-width="2.2"/>
    <path d="M52 10 L60 -4 L68 10" fill="${L.accent}"/>
    <line x1="104" y1="48" x2="108" y2="124" stroke="#6e5430" stroke-width="4.5"/>
    <path d="M99 44 L108 24 L117 44 Z" fill="${L.accent}"/>
  `;
}

function drawZhenghe(L) {
  return `
    ${bodyRobe(L)}
    <path d="M34 110 H86" stroke="${L.accent}" stroke-width="3.5"/>
    <ellipse cx="24" cy="114" rx="11" ry="15" fill="${L.robe2}"/>
    <ellipse cx="96" cy="114" rx="11" ry="15" fill="${L.robe2}"/>
    <path d="M32 50 C36 24 84 24 88 50" fill="${L.hair}"/>
    ${cuteFace(L, { mouth: "smile" })}
    <rect x="34" y="26" width="52" height="22" rx="7" fill="${L.robe2}" stroke="${L.accent}" stroke-width="1.6"/>
    <path d="M34 32 L10 14 L38 40" fill="${L.accent}"/>
    <path d="M86 32 L110 14 L82 40" fill="${L.accent}"/>
    <circle cx="29" cy="68" r="4" fill="${L.accent}"/>
    <circle cx="91" cy="68" r="4" fill="${L.accent}"/>
  `;
}

function drawSimaqian(L) {
  return `
    ${bodyRobe(L)}
    <path d="M32 50 C36 24 84 24 88 50" fill="${L.hair}"/>
    ${cuteFace(L, { mouth: "tiny", beard: true })}
    <rect x="44" y="12" width="32" height="30" rx="7" fill="${L.hair}"/>
    <rect x="50" y="4" width="20" height="13" rx="3" fill="${L.robe2}"/>
    <rect x="54" y="-2" width="12" height="10" rx="2" fill="${L.accent}"/>
    <rect x="90" y="98" width="15" height="26" rx="3" fill="${L.accent}"/>
  `;
}

function drawSunwu(L) {
  return `
    ${bodyArmor(L)}
    <path d="M32 50 C36 22 84 22 88 50" fill="${L.hair}"/>
    ${cuteFace(L, { mouth: "tiny" })}
    <path d="M28 50 Q60 6 92 50" fill="${L.robe2}" stroke="${L.accent}" stroke-width="2.6"/>
    <circle cx="60" cy="26" r="9" fill="${L.accent}"/>
    <circle cx="60" cy="26" r="4" fill="${L.robe}"/>
    <g transform="translate(8,80) rotate(-8)">
      <rect width="18" height="24" rx="4" fill="${L.accent}"/>
      <text x="9" y="16" text-anchor="middle" font-size="9" fill="${L.robe2}">兵</text>
    </g>
  `;
}

function drawWuzetian(L) {
  return `
    <path d="M20 134 Q38 94 60 90 Q82 94 100 134 Z" fill="${L.robe}"/>
    <path d="M34 102 Q60 122 86 102" fill="${L.robe2}" opacity=".88"/>
    <circle cx="48" cy="106" r="4.5" fill="#fff3c4"/>
    <circle cx="72" cy="106" r="4.5" fill="#fff3c4"/>
    <path d="M28 50 C34 22 86 22 92 50" fill="${L.hair}"/>
    <ellipse cx="60" cy="18" rx="15" ry="17" fill="${L.hair}"/>
    <path d="M20 56 Q6 98 16 128" fill="${L.hair}"/>
    <path d="M100 56 Q114 98 104 128" fill="${L.hair}"/>
    ${cuteFace(L, { mouth: "grin" })}
    <path d="M38 34 Q60 -6 82 34" fill="${L.accent}"/>
    <circle cx="60" cy="12" r="6.5" fill="#fff6c8"/>
    <path d="M28 30 L6 2 L42 28" fill="${L.robe}"/>
    <path d="M92 30 L114 2 L78 28" fill="${L.robe}"/>
  `;
}

function drawMulan(L) {
  return `
    ${bodyArmor(L)}
    <path d="M32 50 C36 24 84 24 88 50" fill="${L.hair}"/>
    <ellipse cx="60" cy="24" rx="10" ry="12" fill="${L.hair}"/>
    <path d="M26 58 Q16 92 24 118" fill="${L.hair}"/>
    <path d="M94 58 Q104 92 96 118" fill="${L.hair}"/>
    ${cuteFace(L, { mouth: "grin" })}
    <path d="M30 48 L40 12 H80 L90 48 Z" fill="${L.robe2}" stroke="${L.accent}" stroke-width="2.2"/>
    <rect x="52" y="8" width="16" height="11" rx="2" fill="${L.accent}"/>
    <g transform="translate(98,82) rotate(10)">
      <rect width="7" height="42" rx="2" fill="${L.accent}"/>
      <path d="M-1 0 L3.5 -14 L8 0 Z" fill="${L.robe2}"/>
    </g>
  `;
}

function drawCaiwenji(L) {
  return `
    ${bodyRobe(L)}
    <path d="M32 50 C36 24 84 24 88 50" fill="${L.hair}"/>
    <circle cx="26" cy="58" r="11" fill="${L.hair}"/>
    <circle cx="94" cy="58" r="11" fill="${L.hair}"/>
    <path d="M18 58 Q2 96 12 124" fill="${L.hair}"/>
    <path d="M102 58 Q118 96 108 124" fill="${L.hair}"/>
    ${cuteFace(L, { mouth: "cat" })}
    <circle cx="24" cy="48" r="4.5" fill="${L.accent}"/>
    <circle cx="96" cy="48" r="4.5" fill="${L.accent}"/>
    <ellipse cx="16" cy="110" rx="13" ry="17" fill="${L.accent}" opacity=".92"/>
    <rect x="12" y="94" width="8" height="18" rx="2" fill="${L.robe2}"/>
  `;
}

function drawLiqingzhao(L) {
  return `
    ${bodyRobe(L)}
    <path d="M32 50 C36 24 84 24 88 50" fill="${L.hair}"/>
    <ellipse cx="38" cy="30" rx="13" ry="11" fill="${L.hair}"/>
    <ellipse cx="82" cy="30" rx="13" ry="11" fill="${L.hair}"/>
    <path d="M20 58 Q8 96 16 122" fill="${L.hair}"/>
    <path d="M100 58 Q112 96 104 122" fill="${L.hair}"/>
    ${cuteFace(L, { mouth: "smile" })}
    <circle cx="38" cy="30" r="4" fill="${L.accent}"/>
    <circle cx="82" cy="30" r="4" fill="${L.accent}"/>
    <g transform="translate(88,96) rotate(12)">
      <rect width="17" height="24" rx="3" fill="#fffef8" stroke="${L.accent}" stroke-width="1.5"/>
      <rect x="19" y="0" width="3.5" height="28" fill="#2a2018"/>
    </g>
  `;
}

function drawWangzhaojun(L) {
  return `
    <path d="M28 104 Q42 92 60 90 Q78 92 92 104 L88 134 H32 Z" fill="${L.robe}"/>
    <path d="M24 108 Q60 94 96 108 L100 134 H20 Z" fill="${L.robe2}" opacity=".8"/>
    <path d="M30 50 C36 22 84 22 90 50" fill="${L.hair}"/>
    <path d="M16 56 Q0 102 10 130" fill="${L.hair}"/>
    <path d="M104 56 Q120 102 110 130" fill="${L.hair}"/>
    ${cuteFace(L, { mouth: "tiny" })}
    <path d="M22 48 Q60 4 98 48" fill="${L.robe2}"/>
    <path d="M30 48 Q60 16 90 48" fill="${L.accent}" opacity=".55"/>
    <path d="M98 42 Q110 34 106 50" fill="none" stroke="#fff8e8" stroke-width="2.8"/>
  `;
}

function drawBanzhao(L) {
  return `
    ${bodyRobe(L)}
    <path d="M32 50 C36 24 84 24 88 50" fill="${L.hair}"/>
    <circle cx="60" cy="24" r="15" fill="${L.hair}"/>
    <path d="M22 58 Q10 96 18 120" fill="${L.hair}"/>
    <path d="M98 58 Q110 96 102 120" fill="${L.hair}"/>
    ${cuteFace(L, { mouth: "smile" })}
    <circle cx="60" cy="20" r="4.5" fill="${L.accent}"/>
    <g transform="translate(86,96)">
      <rect width="20" height="28" rx="4" fill="${L.accent}"/>
      <rect x="3" y="4" width="14" height="20" fill="#fffef8"/>
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
  const dims = size === "lg" ? 240 : size === "sm" ? 100 : 140;
  const uid = `av-${character.id}-${++avatarSeq}`;
  const draw = DRAW[character.id] || drawHanxin;
  return `
  <svg class="avatar-svg avatar-${size}" viewBox="0 -8 120 152" width="${dims}" height="${Math.round(dims * 1.22)}" aria-label="${character.name}" role="img">
    ${card(uid, L, character.era, GLOW[rank], draw(L))}
  </svg>`;
}
