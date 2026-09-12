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

/** 班別＋學號：1A10（年級 1–3、英文字母班、兩位學號），自動轉大楷。 */
export function normalizeClassId(v) {
  const raw = String(v || "")
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, "");
  const m = raw.match(/^([1-3])([A-Z])(\d{1,2})$/);
  if (!m) return null;
  return `${m[1]}${m[2]}${m[3].padStart(2, "0")}`;
}

export function formYearFromClassId(classId) {
  const id = normalizeClassId(classId);
  if (!id) return null;
  return { 1: "中一", 2: "中二", 3: "中三" }[id[0]] || null;
}

export function classIdHint() {
  return "英文大楷，班別加兩位學號，例如 1A10。";
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
