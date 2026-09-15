/**
 * Google 試算表史績榜設定。
 * 老師部署 Apps Script 後，把 /exec 網址貼入老師頁，或用 ?cloud= 分享給學生。
 */
export const SHEETS_WEBAPP_URL = "";

const LS_KEY = "rps_cloud_url_v1";

export function normalizeCloudUrl(raw) {
  const s = String(raw || "").trim();
  const m = s.match(/https:\/\/script\.google\.com\/macros\/s\/([A-Za-z0-9_-]+)/);
  return m ? `https://script.google.com/macros/s/${m[1]}/exec` : "";
}

export function cloudUrlHint(raw) {
  const s = String(raw || "").trim();
  if (!s) return "請貼部署之後嗰條網址，唔係試算表瀏覽器上面嗰條。";
  if (/docs\.google\.com\/spreadsheets/i.test(s)) {
    return "呢條係試算表本身嘅網址。要喺表入面「擴充功能」部署一次，改貼 /exec 結尾嗰條。";
  }
  if (normalizeCloudUrl(s)) return "";
  return "網址唔啱。要係 script.google.com 開頭、/exec 結尾。";
}

export function saveCloudUrl(raw) {
  const url = normalizeCloudUrl(raw);
  if (!url) return "";
  localStorage.setItem(LS_KEY, url);
  return url;
}

export function getCloudUrl() {
  const baked = normalizeCloudUrl(SHEETS_WEBAPP_URL);
  if (baked) return baked;
  try {
    return normalizeCloudUrl(localStorage.getItem(LS_KEY) || "");
  } catch {
    return "";
  }
}

export function captureCloudFromLocation(href = location.href) {
  try {
    const q = new URL(href).searchParams.get("cloud");
    if (q) return saveCloudUrl(q);
  } catch {
    /* ignore */
  }
  return getCloudUrl();
}

export function studentCloudLink(pageUrl = location.href) {
  const cloud = getCloudUrl();
  if (!cloud) return "";
  const u = new URL(pageUrl);
  u.searchParams.set("cloud", cloud);
  return u.toString();
}
