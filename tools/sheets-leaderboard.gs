/**
 * 《任平生》全班史績榜 —— 貼到試算表的「擴充功能 → Apps Script」
 * 部署：新部署 → 網頁應用程式 → 執行身分「我」→ 誰能存取「任何人」
 */
function doGet(e) {
  const p = (e && e.parameter) || {};
  const action = String(p.action || "list");
  const cb = String(p.callback || "");
  try {
    if (action === "list") return json_({ ok: true, rows: listRows_() }, cb);
    if (action === "upsert") return json_(upsert_(p), cb);
    return json_({ ok: false, error: "unknown" }, cb);
  } catch (err) {
    return json_({ ok: false, error: String(err) }, cb);
  }
}

function sheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName("史績榜");
  if (!sh) sh = ss.insertSheet("史績榜");
  if (sh.getLastRow() < 1) {
    sh.appendRow(["更新時間", "學號", "角色名", "年級", "身份", "等級", "XP", "史績", "本週史績", "連捷"]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj, callback) {
  const body = JSON.stringify(obj);
  if (callback && /^[A-Za-z_][A-Za-z0-9_]*$/.test(callback)) {
    return ContentService.createTextOutput(callback + "(" + body + ")").setMimeType(
      ContentService.MimeType.JAVASCRIPT
    );
  }
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

function listRows_() {
  const values = sheet_().getDataRange().getValues();
  const out = [];
  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    const username = String(r[1] || "").trim().toUpperCase();
    if (!username) continue;
    out.push({
      username: username,
      heroName: String(r[2] || ""),
      formYear: String(r[3] || ""),
      identityName: String(r[4] || ""),
      level: Number(r[5]) || 1,
      xp: Number(r[6]) || 0,
      score: Number(r[7]) || 0,
      weekScore: Number(r[8]) || 0,
      streak: Number(r[9]) || 0,
    });
  }
  out.sort(function (a, b) {
    return b.score - a.score || b.level - a.level;
  });
  return out;
}

function upsert_(p) {
  const u = String(p.u || "")
    .trim()
    .toUpperCase()
    .slice(0, 16);
  if (!/^[0-9A-Z_]{2,16}$/.test(u)) return { ok: false, error: "bad-user" };
  const n = String(p.n || "").slice(0, 8);
  const y = String(p.y || "").slice(0, 8);
  const idn = String(p.idn || "").slice(0, 8);
  const lv = Math.max(1, Math.min(60, Number(p.lv) || 1));
  const xp = Math.max(0, Math.min(10000000, Number(p.xp) || 0));
  const score = Math.max(0, Math.min(1000000, Number(p.score) || 0));
  const week = Math.max(0, Math.min(1000000, Number(p.week) || 0));
  const streak = Math.max(0, Math.min(99, Number(p.streak) || 0));
  const line = [new Date(), u, n, y, idn, lv, xp, score, week, streak];
  const sh = sheet_();
  const data = sh.getDataRange().getValues();
  let row = 0;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1] || "").trim().toUpperCase() === u) {
      row = i + 1;
      break;
    }
  }
  if (row) sh.getRange(row, 1, 1, 10).setValues([line]);
  else sh.appendRow(line);
  return { ok: true, username: u, score: score };
}
