/**
 * Google 試算表史績榜設定。
 * 老師部署 Apps Script 後，把 /exec 網址貼入老師頁，或用 ?cloud= 分享給學生。
 */
export const SHEETS_WEBAPP_URL = "";

const LS_KEY = "rps_cloud_url_v1";

export function normalizeCloudUrl(raw) {
  const s = String(raw || "").trim();
  const m = s.match(/https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec/);
  return m ? m[0] : "";
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
