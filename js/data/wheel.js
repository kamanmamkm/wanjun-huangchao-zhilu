/**
 * 天機輪：答對可轉；部分格係錦囊，幫遊戲，唔直接加史績。
 */
export const CHARMS = {
  lamp: { id: "lamp", name: "續燈", use: "闖關時補一盞燈火；史戰可回 1 點體力" },
  peek: { id: "peek", name: "窺卷", use: "長河揭示一件事的提示；錯史提早睇辨錯方向" },
  silk: { id: "silk", name: "絲引", use: "機緣連線揭示一對" },
};

export const WHEEL_SLICES = [
  { id: "xp8", label: "修業＋8 經驗", caption: "修業", weight: 3, xp: 8 },
  { id: "xp16", label: "勤學＋16 經驗", caption: "勤學", weight: 2, xp: 16 },
  { id: "charm_lamp", label: "錦囊·續燈", caption: "續燈", weight: 3, charm: "lamp" },
  { id: "charm_peek", label: "錦囊·窺卷", caption: "窺卷", weight: 2, charm: "peek" },
  { id: "xp24", label: "大進＋24 經驗", caption: "大進", weight: 1, xp: 24 },
  { id: "charm_silk", label: "錦囊·絲引", caption: "絲引", weight: 1, charm: "silk" },
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
