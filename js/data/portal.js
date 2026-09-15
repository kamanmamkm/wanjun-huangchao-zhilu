/**
 * 學生版／老師版用唔同連結。學生版唔顯示老師後台。
 */
export function isTeacherPortal(href = location.href) {
  try {
    const u = new URL(href);
    if (u.searchParams.get("teacher") === "1") return true;
    return /teacher\.html$/i.test(u.pathname);
  } catch {
    return false;
  }
}

function siteRoot(pageUrl = location.href) {
  const u = new URL(pageUrl);
  u.hash = "";
  u.search = "";
  u.pathname = u.pathname.replace(/index\.html$/i, "").replace(/teacher\.html$/i, "");
  if (!u.pathname.endsWith("/")) u.pathname += "/";
  return u;
}

export function studentPlayLink(pageUrl = location.href) {
  return siteRoot(pageUrl).toString();
}

export function teacherPortalLink(pageUrl = location.href) {
  const u = siteRoot(pageUrl);
  u.pathname = `${u.pathname}teacher.html`;
  return u.toString();
}
