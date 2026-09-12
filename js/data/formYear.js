/**
 * 學生年級：決定可見題目範圍
 * 中一 → 只中一｜中二 → 中一＋中二｜中三 → 中一＋中二＋中三
 */
export const FORM_YEARS = ["中一", "中二", "中三"];

const RANK = { 中一: 1, 中二: 2, 中三: 3 };

export function normalizeFormYear(v) {
  if (v === "中二" || v === "中三" || v === "中一") return v;
  return null;
}

export function formYearLabel(v) {
  return normalizeFormYear(v) || "未選年級";
}

export function allowedGradeKeys(formYear) {
  const y = normalizeFormYear(formYear) || "中一";
  if (y === "中三") return ["中一", "中二", "中三"];
  if (y === "中二") return ["中一", "中二"];
  return ["中一"];
}

export function formYearHint(formYear) {
  const y = normalizeFormYear(formYear) || "中一";
  if (y === "中三") return "本年級可見中一、中二、中三題目";
  if (y === "中二") return "本年級可見中一、中二題目";
  return "本年級只見中一題目";
}

/** 內容標籤是否在學生年級範圍內（取標籤中最高年級） */
export function isGradeAllowed(itemGrade, formYear) {
  const student = RANK[normalizeFormYear(formYear) || "中一"] || 1;
  const g = String(itemGrade || "");
  if (!g.trim() || g.includes("混合") || g.includes("至")) return true;
  let need = 0;
  if (g.includes("中三")) need = Math.max(need, 3);
  if (g.includes("中二")) need = Math.max(need, 2);
  if (g.includes("中一")) need = Math.max(need, 1);
  if (!need) return true;
  return need <= student;
}

export function filterByFormYear(list, formYear) {
  return (list || []).filter((item) => isGradeAllowed(item.grade, formYear));
}
