/**
 * 天機輪：答對累積史績；每日答對至少一題可轉一次。
 */
export const WHEEL_SLICES = [
  { id: "xp8", label: "修業＋8 經驗", weight: 3, xp: 8, score: 0 },
  { id: "xp16", label: "勤學＋16 經驗", weight: 2, xp: 16, score: 0 },
  { id: "sc15", label: "史績＋15", weight: 3, xp: 0, score: 15 },
  { id: "mix", label: "兼得＋10 經驗＋10 史績", weight: 2, xp: 10, score: 10 },
  { id: "xp24", label: "大進＋24 經驗", weight: 1, xp: 24, score: 0 },
  { id: "sc40", label: "史績＋40", weight: 1, xp: 0, score: 40 },
];

export function sliceAngle() {
  return 360 / WHEEL_SLICES.length;
}

export function pickWheelIndex() {
  const bag = [];
  WHEEL_SLICES.forEach((s, i) => {
    for (let k = 0; k < (s.weight || 1); k++) bag.push(i);
  });
  return bag[Math.floor(Math.random() * bag.length)];
}

/** 轉盤要轉到第 i 格停在正上方（含整圈）。 */
export function wheelStopAngle(index, spins = 5) {
  const n = WHEEL_SLICES.length;
  return spins * 360 - (index + 0.5) * (360 / n);
}

export function wheelGradient() {
  const n = WHEEL_SLICES.length;
  const step = 360 / n;
  const colors = ["#c84436", "#b29455", "#35665b", "#8a7340", "#a3312b", "#246b87"];
  return WHEEL_SLICES.map((s, i) => {
    const c = colors[i % colors.length];
    return `${c} ${i * step}deg ${(i + 1) * step}deg`;
  }).join(", ");
}
