/**
 * 日漫／立繪頭像：開局為庶民樣貌；有階段海報時優先用海報臉部
 */
import { getStageArt } from "./data/stageVisuals.js";

let avatarSeq = 0;

const GLOW = [0, 0.02, 0.06, 0.1, 0.16, 0.24, 0.34, 0.46, 0.58];

/** 庶民起步提亮；官員朱紅；高階保留本色 */
function dressLook(L, rank) {
  if (!L) return L;
  const r = Math.min(7, Math.max(0, rank));
  if (r >= 5) return { ...L, accent: mixHex(L.accent, "#d7aa50", 0.25) };
  if (r === 0) {
    return { ...L, robe: "#fff4e4", robe2: "#e8d4b0", accent: "#c84436" };
  }
  if (r === 1) {
    return {
      ...L,
      robe: mixHex(L.robe || "#d8ebe4", "#3d8a7a", 0.25),
      robe2: "#246b87",
      accent: "#246b87",
    };
  }
  if (r === 2) {
    return {
      ...L,
      robe: "#f4f7f8",
      robe2: "#246b87",
      accent: "#d7aa50",
    };
  }
  if (r === 3) {
    return {
      ...L,
      robe: mixHex(L.robe, "#c84436", 0.2),
      robe2: "#fff8ec",
      accent: "#d7aa50",
    };
  }
  if (r === 4) {
    return {
      ...L,
      robe: mixHex(L.robe, "#246b87", 0.3),
      robe2: mixHex(L.robe2, "#1a4a5c", 0.2),
      accent: "#d7aa50",
    };
  }
  return { ...L };
}

function mixHex(a, b, t) {
  const pa = parseHex(a);
  const pb = parseHex(b);
  if (!pa || !pb) return a;
  const m = (x, y) => Math.round(x + (y - x) * t);
  return `#${[m(pa[0], pb[0]), m(pa[1], pb[1]), m(pa[2], pb[2])]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("")}`;
}

function parseHex(h) {
  if (!h || typeof h !== "string") return null;
  const s = h.replace("#", "");
  if (s.length !== 6) return null;
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}

function isFemale(L) {
  return L.gender === "female";
}

/** 奴隸／婢女級：簡樸粗布，無華飾兵器（已停用開局；保留函式供兼容） */
function drawPlain(uid, L) {
  const female = isFemale(L);
  return `
    <path d="M36 100 Q48 90 60 88 Q72 90 84 100 L80 136 H40 Z" fill="${L.robe}" stroke="#2a1810" stroke-width="1.2"/>
    <path d="M48 96 L60 108 L72 96" fill="${L.robe2}" opacity=".5"/>
    ${
      female
        ? `<path d="M34 118 Q60 128 86 118 L84 136 H36 Z" fill="${L.robe2}" opacity=".65"/>`
        : `<path d="M44 112 H76" stroke="${L.robe2}" stroke-width="2" opacity=".5"/>`
    }
    ${scalp(uid, L)}
    ${mangaFace(uid, L, { mood: "gentle", mouth: "dot", noBangs: false })}
    <!-- 簡樸束髮，無冠無釵 -->
    <path d="M42 40 Q60 28 78 40" fill="none" stroke="${L.hair}" stroke-width="3" stroke-linecap="round"/>
  `;
}

/** 日漫大眼：多層虹膜＋雙高光＋睫毛 */
function mangaEyes(uid, L, mood = "bright") {
  const y = isFemale(L) ? 56 : 57;
  const rx = isFemale(L) ? 14.5 : 13;
  const ry =
    mood === "fierce" ? (isFemale(L) ? 11 : 9.5) : mood === "gentle" ? 12.5 : 11.5;
  const irisR = isFemale(L) ? 7.2 : 6.4;
  const pupilR = isFemale(L) ? 3.6 : 3.2;
  const browY = y - 16;

  const brow =
    mood === "fierce"
      ? `<path d="M30 ${browY + 2} L52 ${browY - 4}" stroke="#2a1810" stroke-width="2.2" stroke-linecap="round"/>
         <path d="M90 ${browY + 2} L68 ${browY - 4}" stroke="#2a1810" stroke-width="2.2" stroke-linecap="round"/>`
      : mood === "cool"
        ? `<path d="M32 ${browY + 1} Q42 ${browY - 3} 52 ${browY}" fill="none" stroke="#2a1810" stroke-width="1.9" stroke-linecap="round"/>
           <path d="M88 ${browY + 1} Q78 ${browY - 3} 68 ${browY}" fill="none" stroke="#2a1810" stroke-width="1.9" stroke-linecap="round"/>`
        : `<path d="M32 ${browY} Q42 ${browY - 5} 52 ${browY + 1}" fill="none" stroke="#2a1810" stroke-width="1.7" stroke-linecap="round"/>
           <path d="M88 ${browY} Q78 ${browY - 5} 68 ${browY + 1}" fill="none" stroke="#2a1810" stroke-width="1.7" stroke-linecap="round"/>`;

  const lashF = isFemale(L)
    ? `<path d="M29 ${y - 2} Q36 ${y - 10} 44 ${y - ry + 1}" fill="none" stroke="#1a120c" stroke-width="1.8" stroke-linecap="round"/>
       <path d="M33 ${y - 4} L31 ${y - 11}" stroke="#1a120c" stroke-width="1.3" stroke-linecap="round"/>
       <path d="M40 ${y - ry} L39 ${y - ry - 5}" stroke="#1a120c" stroke-width="1.2" stroke-linecap="round"/>
       <path d="M48 ${y - ry + 1} L49 ${y - ry - 4}" stroke="#1a120c" stroke-width="1.1" stroke-linecap="round"/>
       <path d="M91 ${y - 2} Q84 ${y - 10} 76 ${y - ry + 1}" fill="none" stroke="#1a120c" stroke-width="1.8" stroke-linecap="round"/>
       <path d="M87 ${y - 4} L89 ${y - 11}" stroke="#1a120c" stroke-width="1.3" stroke-linecap="round"/>
       <path d="M80 ${y - ry} L81 ${y - ry - 5}" stroke="#1a120c" stroke-width="1.2" stroke-linecap="round"/>
       <path d="M72 ${y - ry + 1} L71 ${y - ry - 4}" stroke="#1a120c" stroke-width="1.1" stroke-linecap="round"/>`
    : `<path d="M30 ${y - 1} Q37 ${y - 7} 45 ${y - ry + 2}" fill="none" stroke="#1a120c" stroke-width="1.5" stroke-linecap="round"/>
       <path d="M90 ${y - 1} Q83 ${y - 7} 75 ${y - ry + 2}" fill="none" stroke="#1a120c" stroke-width="1.5" stroke-linecap="round"/>`;

  const lowerLash =
    isFemale(L) && mood !== "fierce"
      ? `<path d="M32 ${y + 6} Q42 ${y + ry - 1} 54 ${y + 5}" fill="none" stroke="#1a120c" stroke-width="1" opacity=".55"/>
         <path d="M66 ${y + 5} Q78 ${y + ry - 1} 88 ${y + 6}" fill="none" stroke="#1a120c" stroke-width="1" opacity=".55"/>`
      : "";

  function oneEye(cx, side) {
    const irisCx = cx + (side === "L" ? 0.6 : -0.6);
    return `
      <ellipse cx="${cx}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fffefc" stroke="#2a1810" stroke-width="1.5"/>
      <ellipse cx="${irisCx}" cy="${y + 1}" rx="${irisR}" ry="${irisR + 1.2}" fill="url(#${uid}-iris)"/>
      <ellipse cx="${irisCx}" cy="${y + 2}" rx="${irisR * 0.72}" ry="${irisR * 0.85}" fill="${L.eye}" opacity=".55"/>
      <ellipse cx="${irisCx}" cy="${y + 1.5}" rx="${pupilR}" ry="${pupilR + 0.6}" fill="#120c08"/>
      <!-- 主高光 -->
      <ellipse cx="${irisCx - 2.8}" cy="${y - 3.2}" rx="3.6" ry="4.2" fill="#fff"/>
      <circle cx="${irisCx + 2.4}" cy="${y + 3.5}" r="1.7" fill="#fff" opacity=".9"/>
      <circle cx="${irisCx - 0.5}" cy="${y + 4.5}" r="0.9" fill="#fff" opacity=".7"/>
      <!-- 下緣陰影 -->
      <path d="M${cx - rx + 2} ${y + 2} Q${cx} ${y + ry + 1} ${cx + rx - 2} ${y + 2}" fill="none" stroke="#e8b0c0" stroke-width="2" opacity=".35"/>
    `;
  }

  return `
    ${brow}
    ${oneEye(42, "L")}
    ${oneEye(78, "R")}
    ${lashF}
    ${lowerLash}
  `;
}

function mangaFace(uid, L, opts = {}) {
  const mood = opts.mood || "bright";
  const mouth = opts.mouth || "smile";
  const female = isFemale(L);
  const chin = female ? 98 : 94;
  const jaw = female
    ? `M30 48 Q32 20 60 16 Q88 20 90 48 Q92 78 60 ${chin} Q28 78 30 48 Z`
    : `M29 50 Q31 22 60 17 Q89 22 91 50 Q93 76 60 ${chin} Q27 76 29 50 Z`;

  let mouthSvg = `<path d="M52 78 Q60 86 68 78" fill="none" stroke="${L.lip}" stroke-width="${female ? 2.8 : 2.4}" stroke-linecap="round"/>`;
  if (mouth === "grin") {
    mouthSvg = `
      <path d="M50 76 Q60 92 70 76" fill="#fff" stroke="${L.lip}" stroke-width="1.4"/>
      <path d="M50 76 Q60 90 70 76" fill="none" stroke="${L.lip}" stroke-width="2.2" stroke-linecap="round"/>`;
  } else if (mouth === "smirk") {
    mouthSvg = `<path d="M54 80 Q64 85 72 76" fill="none" stroke="${L.lip}" stroke-width="2.5" stroke-linecap="round"/>`;
  } else if (mouth === "dot") {
    mouthSvg = `<ellipse cx="60" cy="81" rx="2.8" ry="2" fill="${L.lip}"/>`;
  } else if (mouth === "cat") {
    mouthSvg = `<path d="M52 78 Q56 86 60 78 Q64 86 68 78" fill="none" stroke="${L.lip}" stroke-width="2.3" stroke-linecap="round"/>`;
  } else if (mouth === "rose") {
    mouthSvg = `
      <ellipse cx="60" cy="81" rx="6.5" ry="3.2" fill="${L.lip}"/>
      <ellipse cx="58" cy="80" rx="2.2" ry="1.2" fill="#fff" opacity=".45"/>`;
  }

  const bangs = opts.noBangs
    ? ""
    : `<path d="M34 42 Q42 28 52 40 Q60 26 68 40 Q78 28 86 42" fill="${L.hair}" stroke="#2a1810" stroke-width="0.8" opacity=".95"/>
       <path d="M48 36 Q60 22 72 36" fill="${L.hair}" opacity=".85"/>`;

  return `
    <!-- 日漫尖臉 -->
    <path d="${jaw}" fill="url(#${uid}-skin)" stroke="#2a1810" stroke-width="1.35"/>
    <ellipse cx="27" cy="56" rx="${female ? 5.5 : 5}" ry="${female ? 8 : 7}" fill="url(#${uid}-skin)" stroke="#2a1810" stroke-width="0.9"/>
    <ellipse cx="93" cy="56" rx="${female ? 5.5 : 5}" ry="${female ? 8 : 7}" fill="url(#${uid}-skin)" stroke="#2a1810" stroke-width="0.9"/>
    <!-- 柔腮紅 -->
    <ellipse cx="34" cy="${female ? 70 : 72}" rx="9" ry="5" fill="#ff8eaa" opacity="${female ? 0.42 : 0.28}"/>
    <ellipse cx="86" cy="${female ? 70 : 72}" rx="9" ry="5" fill="#ff8eaa" opacity="${female ? 0.42 : 0.28}"/>
    ${mangaEyes(uid, L, mood)}
    <!-- 小鼻 -->
    <path d="M60 66 L58.5 73" fill="none" stroke="#d4a090" stroke-width="1.15" stroke-linecap="round"/>
    <circle cx="58.2" cy="73.5" r="0.9" fill="#e8b0a0" opacity=".7"/>
    ${mouthSvg}
    ${bangs}
    ${
      opts.beard
        ? `<!-- 俊俏短鬚 -->
           <path d="M44 88 Q60 104 76 88" fill="none" stroke="${L.hair}" stroke-width="2.4" stroke-linecap="round" opacity=".85"/>
           <path d="M57 80 Q60 88 63 80" fill="${L.hair}" opacity=".9"/>`
        : ""
    }
  `;
}

function frame(uid, L, era, glow, inner) {
  return `
    <defs>
      <linearGradient id="${uid}-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#fffefb"/>
        <stop offset="55%" stop-color="#f7ead4"/>
        <stop offset="100%" stop-color="#edd9b8"/>
      </linearGradient>
      <linearGradient id="${uid}-shine" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fff" stop-opacity=".55"/>
        <stop offset="45%" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="${uid}-skin" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fff0e4"/>
        <stop offset="45%" stop-color="${L.skin}"/>
        <stop offset="100%" stop-color="${L.skin}"/>
      </linearGradient>
      <radialGradient id="${uid}-iris" cx="38%" cy="32%" r="70%">
        <stop offset="0%" stop-color="#fff8f0"/>
        <stop offset="35%" stop-color="${L.eye}"/>
        <stop offset="100%" stop-color="#1a1008"/>
      </radialGradient>
      <linearGradient id="${uid}-hair" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#3a2a20"/>
        <stop offset="40%" stop-color="${L.hair}"/>
        <stop offset="100%" stop-color="#0a0806"/>
      </linearGradient>
      <filter id="${uid}-s"><feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-opacity=".2"/></filter>
    </defs>
    <rect x="2" y="2" width="116" height="142" rx="18" fill="url(#${uid}-bg)" stroke="${L.accent}" stroke-width="3"/>
    <rect x="2" y="2" width="116" height="142" rx="18" fill="url(#${uid}-shine)"/>
    <rect x="7" y="7" width="106" height="132" rx="14" fill="none" stroke="${L.robe}" stroke-width="1" opacity=".22"/>
    ${glow > 0.2 ? `<circle cx="60" cy="52" r="48" fill="${L.accent}" opacity="${glow * 0.12}"/>` : ""}
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

function scalp(uid, L) {
  return `<path d="M26 50 C32 12 88 12 94 50" fill="url(#${uid}-hair)" stroke="#2a1810" stroke-width="1"/>`;
}

function drawHanxin(uid, L) {
  return `
    ${bodyArmor(L)}
    ${scalp(uid, L)}
    ${mangaFace(uid, L, { mood: "cool", mouth: "smirk" })}
    <path d="M24 46 C30 10 90 10 96 46 L88 56 H32 Z" fill="${L.robe2}" stroke="#2a1810" stroke-width="1.4"/>
    <path d="M50 14 L60 -2 L70 14" fill="${L.accent}" stroke="#2a1810" stroke-width="1"/>
    <rect x="53" y="14" width="14" height="12" rx="1" fill="${L.accent}" stroke="#2a1810" stroke-width="1"/>
    <rect x="98" y="86" width="6" height="42" rx="1" fill="${L.accent}" stroke="#2a1810" stroke-width="1"/>
    <rect x="94" y="82" width="14" height="8" rx="2" fill="${L.robe2}" stroke="#2a1810" stroke-width="1"/>
  `;
}

function drawZhuge(uid, L) {
  // 對照立繪：白袍、深藍內襯、青綸巾、羽毛扇
  const cyan = L.accent || "#3db8c4";
  const navy = L.robe2 || "#1e3a5f";
  const white = L.robe || "#f4f1ea";
  return `
    <!-- 白袍寬袖 -->
    <path d="M22 136 Q28 96 44 88 L60 92 L76 88 Q92 96 98 136 Z" fill="${white}" stroke="#2a1810" stroke-width="1.2"/>
    <path d="M18 118 Q8 128 14 136 L34 120 Z" fill="${white}" stroke="#2a1810" stroke-width="1"/>
    <path d="M102 118 Q112 128 106 136 L86 120 Z" fill="${white}" stroke="#2a1810" stroke-width="1"/>
    <path d="M44 90 L60 108 L76 90" fill="${navy}" opacity=".9"/>
    <path d="M48 112 H72" stroke="#2a1810" stroke-width="5" stroke-linecap="round" opacity=".55"/>
    <path d="M56 112 L52 136 M64 112 L68 136" stroke="${navy}" stroke-width="1.4" opacity=".7"/>
    <!-- 長髮 -->
    <path d="M24 52 Q18 90 22 124" fill="url(#${uid}-hair)" stroke="#2a1810" stroke-width="0.8"/>
    <path d="M96 52 Q102 90 98 124" fill="url(#${uid}-hair)" stroke="#2a1810" stroke-width="0.8"/>
    ${scalp(uid, L)}
    ${mangaFace(uid, L, { mood: "cool", mouth: "dot", beard: true, noBangs: true })}
    <!-- 額前髮 -->
    <path d="M36 44 Q48 30 58 42 Q60 28 62 42 Q72 30 84 44" fill="url(#${uid}-hair)"/>
    <!-- 青綸巾 -->
    <path d="M28 46 L34 8 H86 L92 46 Z" fill="${cyan}" stroke="#2a1810" stroke-width="1.3"/>
    <path d="M40 10 L42 42 M50 8 L52 44 M60 6 L60 44 M70 8 L68 44 M80 10 L78 42" stroke="#2a8a94" stroke-width="1.2" opacity=".55"/>
    <path d="M34 40 H86" stroke="#d4b06a" stroke-width="3"/>
    <circle cx="60" cy="40" r="5" fill="#d4b06a" stroke="#2a1810" stroke-width="0.8"/>
    <circle cx="60" cy="40" r="2.2" fill="#3d8a62"/>
    <path d="M32 12 Q28 0 36 8 M88 12 Q92 0 84 8" fill="none" stroke="${cyan}" stroke-width="3" stroke-linecap="round"/>
    <!-- 羽毛扇＋太極 -->
    <g transform="translate(78,86) rotate(-18)">
      <ellipse cx="18" cy="2" rx="4" ry="14" fill="#f8f6f0" stroke="#2a1810" stroke-width="0.6" transform="rotate(-28 18 2)"/>
      <ellipse cx="24" cy="0" rx="4" ry="15" fill="#fff" stroke="#2a1810" stroke-width="0.6" transform="rotate(-8 24 0)"/>
      <ellipse cx="30" cy="0" rx="4" ry="15" fill="#f8f6f0" stroke="#2a1810" stroke-width="0.6" transform="rotate(12 30 0)"/>
      <ellipse cx="35" cy="2" rx="3.5" ry="13" fill="#fff" stroke="#2a1810" stroke-width="0.6" transform="rotate(28 35 2)"/>
      <path d="M8 8 Q22 -6 36 8 Q22 18 8 8 Z" fill="${navy}" stroke="#2a1810" stroke-width="1"/>
      <circle cx="22" cy="8" r="5" fill="#eee"/>
      <path d="M22 3 A5 5 0 0 1 22 13 A2.5 2.5 0 0 1 22 8 A2.5 2.5 0 0 0 22 3" fill="#1a1a1a"/>
      <circle cx="22" cy="5.5" r="0.9" fill="#1a1a1a"/>
      <circle cx="22" cy="10.5" r="0.9" fill="#eee"/>
    </g>
  `;
}

function drawYuefei(uid, L) {
  return `
    <path d="M16 134 Q28 88 46 84 L60 90 L74 84 Q92 88 104 134 Z" fill="${L.robe}" stroke="#2a1810" stroke-width="1.2"/>
    ${bodyArmor(L)}
    ${scalp(uid, L)}
    ${mangaFace(uid, L, { mood: "fierce", mouth: "grin" })}
    <path d="M22 48 L34 6 H86 L98 48 Z" fill="${L.robe2}" stroke="#2a1810" stroke-width="1.4"/>
    <path d="M50 6 L60 -8 L70 6" fill="${L.accent}" stroke="#2a1810" stroke-width="1"/>
    <line x1="104" y1="44" x2="108" y2="126" stroke="#4a3020" stroke-width="4.5"/>
    <path d="M99 40 L108 18 L117 40 Z" fill="${L.accent}" stroke="#2a1810" stroke-width="1"/>
  `;
}

function drawZhenghe(uid, L) {
  return `
    ${bodyRobe(L)}
    <path d="M32 110 H88" stroke="${L.accent}" stroke-width="3.5"/>
    <ellipse cx="22" cy="114" rx="12" ry="16" fill="${L.robe2}" stroke="#2a1810" stroke-width="1"/>
    <ellipse cx="98" cy="114" rx="12" ry="16" fill="${L.robe2}" stroke="#2a1810" stroke-width="1"/>
    ${scalp(uid, L)}
    ${mangaFace(uid, L, { mood: "cool", mouth: "smile" })}
    <rect x="32" y="22" width="56" height="22" rx="5" fill="${L.robe2}" stroke="#2a1810" stroke-width="1.4"/>
    <path d="M32 28 L8 10 L36 36" fill="${L.accent}" stroke="#2a1810" stroke-width="1"/>
    <path d="M88 28 L112 10 L84 36" fill="${L.accent}" stroke="#2a1810" stroke-width="1"/>
    <circle cx="28" cy="66" r="3.5" fill="${L.accent}" stroke="#2a1810" stroke-width="0.8"/>
    <circle cx="92" cy="66" r="3.5" fill="${L.accent}" stroke="#2a1810" stroke-width="0.8"/>
  `;
}

function drawSimaqian(uid, L) {
  return `
    ${bodyRobe(L)}
    ${scalp(uid, L)}
    ${mangaFace(uid, L, { mood: "gentle", mouth: "dot", beard: true })}
    <rect x="42" y="8" width="36" height="30" rx="5" fill="url(#${uid}-hair)" stroke="#2a1810" stroke-width="1.2"/>
    <rect x="48" y="0" width="24" height="14" rx="3" fill="${L.robe2}" stroke="#2a1810" stroke-width="1"/>
    <rect x="54" y="-6" width="12" height="10" rx="2" fill="${L.accent}" stroke="#2a1810" stroke-width="1"/>
    <rect x="90" y="96" width="16" height="28" rx="2" fill="${L.accent}" stroke="#2a1810" stroke-width="1"/>
    <line x1="94" y1="104" x2="102" y2="104" stroke="${L.robe2}" stroke-width="1.2"/>
    <line x1="94" y1="110" x2="102" y2="110" stroke="${L.robe2}" stroke-width="1.2"/>
  `;
}

function drawSunwu(uid, L) {
  return `
    ${bodyArmor(L)}
    ${scalp(uid, L)}
    ${mangaFace(uid, L, { mood: "cool", mouth: "smirk" })}
    <path d="M26 48 Q60 0 94 48" fill="${L.robe2}" stroke="#2a1810" stroke-width="1.5"/>
    <circle cx="60" cy="22" r="9" fill="${L.accent}" stroke="#2a1810" stroke-width="1.2"/>
    <circle cx="60" cy="22" r="4" fill="${L.robe}"/>
    <g transform="translate(6,78) rotate(-10)">
      <rect width="18" height="26" rx="3" fill="${L.accent}" stroke="#2a1810" stroke-width="1"/>
      <text x="9" y="17" text-anchor="middle" font-size="9" fill="${L.robe2}" font-family="sans-serif">兵</text>
    </g>
  `;
}

function drawWuzetian(uid, L) {
  return `
    <path d="M18 136 Q36 90 60 86 Q84 90 102 136 Z" fill="${L.robe}" stroke="#2a1810" stroke-width="1.2"/>
    <path d="M34 100 Q60 122 86 100" fill="${L.robe2}" opacity=".9"/>
    <circle cx="46" cy="106" r="4.5" fill="#fff3c4" stroke="#2a1810" stroke-width="0.8"/>
    <circle cx="74" cy="106" r="4.5" fill="#fff3c4" stroke="#2a1810" stroke-width="0.8"/>
    ${scalp(uid, L)}
    <ellipse cx="60" cy="14" rx="17" ry="19" fill="url(#${uid}-hair)" stroke="#2a1810" stroke-width="1"/>
    <path d="M16 52 Q2 100 12 132" fill="url(#${uid}-hair)" stroke="#2a1810" stroke-width="1"/>
    <path d="M104 52 Q118 100 108 132" fill="url(#${uid}-hair)" stroke="#2a1810" stroke-width="1"/>
    ${mangaFace(uid, L, { mood: "cool", mouth: "rose" })}
    <path d="M38 30 Q60 -10 82 30" fill="${L.accent}" stroke="#2a1810" stroke-width="1.2"/>
    <circle cx="60" cy="8" r="7" fill="#fff6c8" stroke="#2a1810" stroke-width="1"/>
    <path d="M28 26 L4 -2 L42 24" fill="${L.robe}" stroke="#2a1810" stroke-width="1"/>
    <path d="M92 26 L116 -2 L78 24" fill="${L.robe}" stroke="#2a1810" stroke-width="1"/>
  `;
}

function drawMulan(uid, L) {
  return `
    ${bodyArmor(L)}
    ${scalp(uid, L)}
    <ellipse cx="60" cy="20" rx="11" ry="13" fill="url(#${uid}-hair)" stroke="#2a1810" stroke-width="1"/>
    <path d="M22 54 Q10 95 20 124" fill="url(#${uid}-hair)" stroke="#2a1810" stroke-width="1"/>
    <path d="M98 54 Q110 95 100 124" fill="url(#${uid}-hair)" stroke="#2a1810" stroke-width="1"/>
    ${mangaFace(uid, L, { mood: "bright", mouth: "grin" })}
    <path d="M28 46 L40 8 H80 L92 46 Z" fill="${L.robe2}" stroke="#2a1810" stroke-width="1.4"/>
    <rect x="52" y="4" width="16" height="12" rx="2" fill="${L.accent}" stroke="#2a1810" stroke-width="1"/>
    <g transform="translate(98,80) rotate(12)">
      <rect width="7" height="44" rx="1" fill="${L.accent}" stroke="#2a1810" stroke-width="1"/>
      <path d="M-2 0 L3.5 -16 L9 0 Z" fill="${L.robe2}" stroke="#2a1810" stroke-width="1"/>
    </g>
  `;
}

function drawCaiwenji(uid, L) {
  return `
    ${bodyRobe(L)}
    ${scalp(uid, L)}
    <circle cx="22" cy="54" r="13" fill="url(#${uid}-hair)" stroke="#2a1810" stroke-width="1"/>
    <circle cx="98" cy="54" r="13" fill="url(#${uid}-hair)" stroke="#2a1810" stroke-width="1"/>
    <path d="M12 56 Q-2 100 8 128" fill="url(#${uid}-hair)" stroke="#2a1810" stroke-width="1"/>
    <path d="M108 56 Q122 100 112 128" fill="url(#${uid}-hair)" stroke="#2a1810" stroke-width="1"/>
    ${mangaFace(uid, L, { mood: "gentle", mouth: "cat" })}
    <circle cx="20" cy="44" r="4.5" fill="${L.accent}" stroke="#2a1810" stroke-width="0.8"/>
    <circle cx="100" cy="44" r="4.5" fill="${L.accent}" stroke="#2a1810" stroke-width="0.8"/>
    <ellipse cx="14" cy="110" rx="14" ry="18" fill="${L.accent}" stroke="#2a1810" stroke-width="1" opacity=".95"/>
    <rect x="10" y="92" width="8" height="20" rx="2" fill="${L.robe2}" stroke="#2a1810" stroke-width="0.8"/>
  `;
}

function drawLiqingzhao(uid, L) {
  return `
    ${bodyRobe(L)}
    ${scalp(uid, L)}
    <ellipse cx="34" cy="26" rx="15" ry="13" fill="url(#${uid}-hair)" stroke="#2a1810" stroke-width="1"/>
    <ellipse cx="86" cy="26" rx="15" ry="13" fill="url(#${uid}-hair)" stroke="#2a1810" stroke-width="1"/>
    <path d="M16 54 Q4 98 12 126" fill="url(#${uid}-hair)" stroke="#2a1810" stroke-width="1"/>
    <path d="M104 54 Q116 98 108 126" fill="url(#${uid}-hair)" stroke="#2a1810" stroke-width="1"/>
    ${mangaFace(uid, L, { mood: "gentle", mouth: "rose" })}
    <circle cx="34" cy="26" r="4" fill="${L.accent}" stroke="#2a1810" stroke-width="0.8"/>
    <circle cx="86" cy="26" r="4" fill="${L.accent}" stroke="#2a1810" stroke-width="0.8"/>
    <g transform="translate(88,94) rotate(14)">
      <rect width="18" height="26" rx="2" fill="#fffef8" stroke="#2a1810" stroke-width="1.2"/>
      <rect x="20" y="0" width="3.5" height="30" fill="#1a120c"/>
      <path d="M20 0 L23.5 -8 L27 0" fill="${L.accent}" stroke="#2a1810" stroke-width="0.8"/>
    </g>
  `;
}

function drawWangzhaojun(uid, L) {
  return `
    <path d="M26 102 Q42 88 60 86 Q78 88 94 102 L90 136 H30 Z" fill="${L.robe}" stroke="#2a1810" stroke-width="1.2"/>
    <path d="M22 108 Q60 92 98 108 L102 136 H18 Z" fill="${L.robe2}" opacity=".85" stroke="#2a1810" stroke-width="1"/>
    ${scalp(uid, L)}
    <path d="M12 52 Q-2 102 8 134" fill="url(#${uid}-hair)" stroke="#2a1810" stroke-width="1"/>
    <path d="M108 52 Q122 102 112 134" fill="url(#${uid}-hair)" stroke="#2a1810" stroke-width="1"/>
    ${mangaFace(uid, L, { mood: "gentle", mouth: "rose" })}
    <path d="M20 44 Q60 -2 100 44" fill="${L.robe2}" stroke="#2a1810" stroke-width="1.3"/>
    <path d="M28 44 Q60 12 92 44" fill="${L.accent}" opacity=".55"/>
    <path d="M98 38 Q112 28 108 46" fill="none" stroke="#fff8e8" stroke-width="3"/>
  `;
}

function drawBanzhao(uid, L) {
  return `
    ${bodyRobe(L)}
    ${scalp(uid, L)}
    <circle cx="60" cy="20" r="17" fill="url(#${uid}-hair)" stroke="#2a1810" stroke-width="1"/>
    <path d="M18 54 Q6 98 14 124" fill="url(#${uid}-hair)" stroke="#2a1810" stroke-width="1"/>
    <path d="M102 54 Q114 98 106 124" fill="url(#${uid}-hair)" stroke="#2a1810" stroke-width="1"/>
    ${mangaFace(uid, L, { mood: "bright", mouth: "smile" })}
    <circle cx="60" cy="16" r="4.5" fill="${L.accent}" stroke="#2a1810" stroke-width="0.8"/>
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

export function renderAvatar(character, rankId = 0, size = "md", opts = {}) {
  if (!character) {
    return `<div class="avatar-fallback">?</div>`;
  }
  const rank = Math.min(7, Math.max(0, rankId));
  const dims =
    size === "hero" ? 320 : size === "lg" ? 248 : size === "sm" ? 104 : 148;
  const h = Math.round(dims * (size === "hero" ? 1.35 : 1.24));
  const gender = opts.gender || character.look?.gender || character.gender || "male";
  const outfit =
    opts.outfitLabel ||
    (gender === "female"
      ? ["米白短襖", "青綠長衫", "白衣青袍", "青袍官服", "緋袍佩印", "錦裙珠釵", "翟衣華飾", "鳳袍珠冠"][rank]
      : ["米白短衣", "青綠長衫", "白衣青袍", "青袍官服", "緋袍佩印", "錦衣玉帶", "蟒袍華冠", "龍袍冕旒"][rank]);
  const baseAccent = character.look?.accent || character.color || "#c6a35a";
  const accent = rank <= 0 ? "#c84436" : rank <= 2 ? "#246b87" : baseAccent;

  // 有階段海報 → 頭像用庶民／學子／士人樣貌（選角頁可用 forcePortrait 保留原型）
  const stageArt = !opts.forcePortrait ? getStageArt(rank, gender) : null;
  if (stageArt) {
    return `
    <div class="avatar-art avatar-${size} outfit-${rank} stage-face" style="--accent:${accent};--glow:${GLOW[Math.min(rank, GLOW.length - 1)]};width:${dims}px;height:${h}px" role="img" aria-label="${character.name} · ${stageArt.badge || outfit}">
      <img src="${stageArt.src}?v=rad7" alt="${character.name}" width="${dims}" height="${h}" loading="lazy" />
      <span class="avatar-art-outfit">${outfit}</span>
    </div>`;
  }

  if (character.portrait) {
    return `
    <div class="avatar-art avatar-${size} outfit-${rank}" style="--accent:${accent};--glow:${GLOW[Math.min(rank, GLOW.length - 1)]};width:${dims}px;height:${h}px" role="img" aria-label="${character.name} · ${outfit}">
      <img src="${character.portrait}?v=rad7" alt="${character.name}" width="${dims}" height="${h}" loading="lazy" />
      <span class="avatar-art-outfit">${outfit}</span>
      <span class="avatar-art-era">${character.era || ""}</span>
    </div>`;
  }

  if (!character.look) {
    return `<div class="avatar-fallback" style="background:${character.color || "#444"}">${character.name?.[0] || "?"}</div>`;
  }
  const L = dressLook(character.look, rank);
  const uid = `av-${character.id}-${++avatarSeq}`;
  const drawFn = DRAW[character.id] || drawHanxin;
  return `
  <svg class="avatar-svg avatar-${size} outfit-${rank}" viewBox="0 -10 120 156" width="${dims}" height="${h}" aria-label="${character.name} · ${outfit}" role="img">
    ${frame(uid, L, outfit, GLOW[Math.min(rank, GLOW.length - 1)], drawFn(uid, L))}
  </svg>`;
}
