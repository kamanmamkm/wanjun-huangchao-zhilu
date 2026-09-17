/**
 * 《任平生》全班史績榜＋雲端存檔 —— 貼到試算表的「擴充功能 → Apps Script」
 * 部署：新部署 → 網頁應用程式 → 執行身分「我」→ 誰能存取「任何人」
 * 若已部署過：貼新腳本儲存後，「部署 → 管理部署 → 筆形編輯 → 版本揀新版本」（網址唔會變）
 *
 * 史績榜：全班排名（無密碼）
 * 存檔：同一學號喺學校／屋企接進度（只存密碼指紋，唔存明文）
 */
function doGet(e) {
  const p = (e && e.parameter) || {};
  const action = String(p.action || "list");
  const cb = String(p.callback || "");
  try {
    if (action === "list") return json_({ ok: true, rows: listRows_(), features: ["keep"] }, cb);
    if (action === "upsert") return json_(upsert_(p), cb);
    if (action === "has") return json_(probe_(p), cb);
    if (action === "recall") return json_(load_(p), cb);
    if (action === "keep") return json_(saveChunk_(p), cb);
    return json_({ ok: false, error: "unknown" }, cb);
  } catch (err) {
    return json_({ ok: false, error: String(err) }, cb);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse((e.postData && e.postData.contents) || "{}");
    if (data.action === "keep" && data.blob) return json_(saveFull_(data), "");
    if (data.action === "upsert") return json_(upsert_(data), "");
    return json_({ ok: false, error: "unknown" }, "");
  } catch (err) {
    return json_({ ok: false, error: String(err) }, "");
  }
}

function boardSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName("史績榜");
  if (!sh) sh = ss.insertSheet("史績榜");
  if (sh.getLastRow() < 1) {
    sh.appendRow(["更新時間", "學號", "角色名", "年級", "身份", "等級", "XP", "史績", "本週史績", "連捷"]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function saveSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName("存檔");
  if (!sh) sh = ss.insertSheet("存檔");
  if (sh.getLastRow() < 1) {
    sh.appendRow(["更新時間", "學號", "存檔時間", "密碼指紋", "存檔"]);
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

function normUser_(raw) {
  const u = String(raw || "")
    .trim()
    .toUpperCase()
    .slice(0, 16);
  if (!/^[0-9A-Z_]{2,16}$/.test(u)) return "";
  return u;
}

function findRow_(sh, username, col) {
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][col] || "").trim().toUpperCase() === username) return i + 1;
  }
  return 0;
}

function listRows_() {
  const values = boardSheet_().getDataRange().getValues();
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
  const u = normUser_(p.u);
  if (!u) return { ok: false, error: "bad-user" };
  const n = String(p.n || "").slice(0, 8);
  const y = String(p.y || "").slice(0, 8);
  const idn = String(p.idn || "").slice(0, 8);
  const lv = Math.max(1, Math.min(60, Number(p.lv) || 1));
  const xp = Math.max(0, Math.min(10000000, Number(p.xp) || 0));
  const score = Math.max(0, Math.min(1000000, Number(p.score) || 0));
  const week = Math.max(0, Math.min(1000000, Number(p.week) || 0));
  const streak = Math.max(0, Math.min(99, Number(p.streak) || 0));
  const line = [new Date(), u, n, y, idn, lv, xp, score, week, streak];
  const sh = boardSheet_();
  const row = findRow_(sh, u, 1);
  if (row) sh.getRange(row, 1, 1, 10).setValues([line]);
  else sh.appendRow(line);
  return { ok: true, username: u, score: score };
}

function probe_(p) {
  const u = normUser_(p.u);
  if (!u) return { ok: false, error: "bad-user" };
  const hasSave = findRow_(saveSheet_(), u, 1) > 0;
  const hasBoard = findRow_(boardSheet_(), u, 1) > 0;
  return { ok: true, exists: hasSave || hasBoard, save: hasSave };
}

function load_(p) {
  const u = normUser_(p.u);
  const ph = String(p.ph || "").slice(0, 64);
  if (!u) return { ok: false, error: "bad-user" };
  if (!ph) return { ok: false, error: "auth" };
  const sh = saveSheet_();
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1] || "").trim().toUpperCase() !== u) continue;
    if (String(data[i][3] || "") !== ph) return { ok: false, error: "auth" };
    return {
      ok: true,
      username: u,
      at: Number(data[i][2]) || 0,
      blob: String(data[i][4] || ""),
    };
  }
  return { ok: false, error: "missing" };
}

function saveChunk_(p) {
  const u = normUser_(p.u);
  if (!u) return { ok: false, error: "bad-user" };
  const ph = String(p.ph || "").slice(0, 64);
  const i = Math.max(0, Number(p.i) || 0);
  const k = Math.max(1, Math.min(40, Number(p.k) || 1));
  const c = String(p.c || "");
  if (c.length > 2200) return { ok: false, error: "chunk-big" };
  if (i >= k) return { ok: false, error: "chunk-idx" };
  const cache = CacheService.getScriptCache();
  const key = "sv_" + u;
  let bag = {};
  try {
    bag = JSON.parse(cache.get(key) || "{}");
  } catch (err) {
    bag = {};
  }
  bag.k = k;
  bag.ph = ph;
  bag.at = Number(p.at) || Date.now();
  bag["c" + i] = c;
  bag.n = p.n != null ? p.n : bag.n;
  bag.y = p.y != null ? p.y : bag.y;
  bag.idn = p.idn != null ? p.idn : bag.idn;
  bag.lv = p.lv != null ? p.lv : bag.lv;
  bag.xp = p.xp != null ? p.xp : bag.xp;
  bag.score = p.score != null ? p.score : bag.score;
  bag.week = p.week != null ? p.week : bag.week;
  bag.streak = p.streak != null ? p.streak : bag.streak;
  cache.put(key, JSON.stringify(bag), 360);
  let got = 0;
  for (let n = 0; n < k; n++) if (bag["c" + n]) got++;
  if (got < k) return { ok: true, pending: true, got: got, k: k };
  let blob = "";
  for (let n = 0; n < k; n++) blob += bag["c" + n];
  cache.remove(key);
  return saveFull_({
    u: u,
    ph: bag.ph,
    at: bag.at,
    blob: blob,
    n: bag.n,
    y: bag.y,
    idn: bag.idn,
    lv: bag.lv,
    xp: bag.xp,
    score: bag.score,
    week: bag.week,
    streak: bag.streak,
  });
}

function saveFull_(d) {
  const u = normUser_(d.u);
  if (!u) return { ok: false, error: "bad-user" };
  const ph = String(d.ph || "").slice(0, 64);
  const at = Number(d.at) || Date.now();
  let blob = String(d.blob || "");
  if (blob.length > 49000) blob = blob.slice(0, 49000);
  const sh = saveSheet_();
  const row = findRow_(sh, u, 1);
  const line = [new Date(), u, at, ph, blob];
  if (row) sh.getRange(row, 1, 1, 5).setValues([line]);
  else sh.appendRow(line);
  if (d.n != null || d.xp != null || d.score != null) {
    upsert_({
      u: u,
      n: d.n,
      y: d.y,
      idn: d.idn,
      lv: d.lv,
      xp: d.xp,
      score: d.score,
      week: d.week,
      streak: d.streak,
    });
  }
  return { ok: true, username: u, at: at, saved: true };
}
