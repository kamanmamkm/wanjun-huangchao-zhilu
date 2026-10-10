/**
 * 歷史查案介面。題目內容見 js/data/cases.js。
 * 研究紀錄只在這部裝置，而且要學生自己開啟。
 */
import { CASES, getCase } from "./data/cases.js?v=rad90";
import { XP_REWARDS } from "./data/levels.js?v=rad90";
import { updateUser, addXp } from "./storage.js?v=rad95";
import { cloudSyncStatus } from "./cloud.js?v=rad95";

const LOG_KEY = "huangchao_case_log_v1";
const LOG_EXPORT_KEY = "huangchao_case_log_export_v1";
const CASE_OPEN_KEY = "huangchao_case_open";
const LOG_MAX = 200;
const REASON_LABEL = {
  teacher: "老師指定",
  self: "自願嘗試",
  review: "溫習需要",
  other: "其他",
  skip: "不想回答",
  unanswered: "未回答",
};
const KNOWN_REASONS = new Set(Object.keys(REASON_LABEL));
const drafts = new Map();
let clearArmed = false;

function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function newId(prefix) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function readLog() {
  try {
    const raw = JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeLog(rows) {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(rows));
    return true;
  } catch {
    return false;
  }
}

function logRoom() {
  const n = readLog().length;
  return { n, max: LOG_MAX, full: n >= LOG_MAX };
}

/** 空值係未回答。只有明確揀「自己想試」先算自願，唔好由空白推斷。 */
export function reasonCode(value) {
  const id = String(value || "").trim();
  if (!id) return "unanswered";
  if (KNOWN_REASONS.has(id)) return id;
  return id;
}

function explicitAttemptReasons(rows) {
  const map = new Map();
  rows.forEach((row) => {
    const id = row?.attemptId;
    if (!id || map.has(id)) return;
    if (row && Object.prototype.hasOwnProperty.call(row, "reason") && reasonCode(row.reason) !== "unanswered") {
      map.set(id, reasonCode(row.reason));
    }
  });
  rows.forEach((row) => {
    const id = row?.attemptId;
    if (!id || map.has(id)) return;
    const item = String(row?.itemId || "").trim();
    if (row?.event === "reason" && KNOWN_REASONS.has(item) && item !== "unanswered") map.set(id, item);
  });
  return map;
}

function rowReason(row, map) {
  if (row && Object.prototype.hasOwnProperty.call(row, "reason")) return reasonCode(row.reason);
  if (map?.has(row?.attemptId)) return map.get(row.attemptId);
  const item = String(row?.itemId || "").trim();
  if (row?.event === "reason" && KNOWN_REASONS.has(item)) return item;
  return "unanswered";
}

function reasonLabel(code) {
  return REASON_LABEL[code] || "未回答";
}

export function researchOn(user) {
  return !!user?.progress?.researchOptIn;
}

function researchCode(user) {
  if (user?.progress?.researchCode) return user.progress.researchCode;
  const existing = getStoredCode(user?.username);
  if (existing) return existing;
  const code = newId("R");
  updateUser((u) => {
    u.progress = u.progress || {};
    if (!u.progress.researchCode) u.progress.researchCode = code;
  });
  return getStoredCode(user?.username) || code;
}

function getStoredCode(username) {
  try {
    const users = JSON.parse(localStorage.getItem("huangchao_users_v1") || "{}");
    const key = String(username || "").toUpperCase();
    return users[key]?.progress?.researchCode || "";
  } catch {
    return "";
  }
}

export function logCaseEvent(user, run, task, event, extra = {}) {
  if (!researchOn(user) || !run || !task) return;
  try {
    const reason = reasonCode(run.reason);
    const rows = readLog();
    let changed = false;
    if (reason !== "unanswered" && run.attemptId) {
      rows.forEach((row) => {
        if (row.attemptId === run.attemptId && rowReason(row) === "unanswered") {
          row.reason = reason;
          changed = true;
        }
      });
    }
    if (rows.length >= LOG_MAX) {
      if (changed && !writeLog(rows)) return false;
      return "full";
    }
    rows.push({
      code: researchCode(user),
      taskId: task.id,
      version: task.version,
      attemptId: run.attemptId || "",
      event,
      at: new Date().toISOString(),
      step: extra.step ?? run.step ?? "",
      itemId: extra.itemId || "",
      ok: extra.ok == null ? "" : extra.ok ? "1" : "0",
      reason,
    });
    if (!writeLog(rows)) return false;
    return true;
  } catch {
    return false;
  }
}

export function caseCsv() {
  const head = ["code", "taskId", "version", "attemptId", "event", "at", "step", "itemId", "ok", "reason", "reasonLabel"];
  const rows = readLog();
  const map = explicitAttemptReasons(rows);
  const lines = [head.join(",")];
  rows.forEach((row) => {
    const reason = rowReason(row, map);
    const view = { ...row, reason, reasonLabel: reasonLabel(reason) };
    lines.push(head.map((k) => `"${String(view[k] ?? "").replace(/"/g, '""')}"`).join(","));
  });
  return lines.join("\n");
}

export function rememberCaseOpen(username, caseId) {
  try {
    if (!caseId) sessionStorage.removeItem(CASE_OPEN_KEY);
    else sessionStorage.setItem(CASE_OPEN_KEY, `${String(username || "").toUpperCase()}|${caseId}`);
  } catch {
    /* 分頁狀態寫唔到時，仍可從首頁繼續 */
  }
}

export function recallCaseOpen(username) {
  try {
    const raw = sessionStorage.getItem(CASE_OPEN_KEY) || "";
    const i = raw.indexOf("|");
    if (i < 0) return "";
    if (raw.slice(0, i) !== String(username || "").toUpperCase()) return "";
    return raw.slice(i + 1);
  } catch {
    return "";
  }
}

function blankRun(task, prev) {
  return {
    version: task.version,
    attemptId: newId("a"),
    step: 1,
    path: "",
    read: {},
    judgment: "",
    judgmentOk: false,
    evidenceClue: "",
    slots: {},
    hintUsed: false,
    check: "",
    checkOk: false,
    done: false,
    rewarded: !!prev?.rewarded,
    completedOnce: !!prev?.completedOnce,
    reason: "",
  };
}

export function readRun(user, task) {
  const pending = drafts.get(draftKey(user?.username, task?.id));
  if (pending) return pending;
  const run = user?.progress?.cases?.[task.id];
  if (!run || typeof run !== "object") return null;
  return run;
}

function draftKey(username, taskId) {
  return `${String(username || "").toUpperCase()}|${taskId || ""}`;
}

function saveRun(username, task, next) {
  try {
    const saved = updateUser((u) => {
      if (String(u.username || "").toUpperCase() !== String(username || "").toUpperCase()) return;
      u.progress = u.progress || {};
      u.progress.cases = u.progress.cases || {};
      u.progress.cases[task.id] = next;
    });
    return !!saved;
  } catch {
    return false;
  }
}

function failSave(toast) {
  toast("進度未儲存，查案可以繼續。請再試一次。");
}

export function renderCaseEntry(user) {
  return CASES.map((task) => {
    const run = readRun(user, task);
    const ongoing = run && !run.done && (run.step > 1 || run.path);
    const label = ongoing ? "繼續查案" : run?.done || run?.completedOnce ? "回看查案" : "開始查案";
    return `
    <article class="case-entry">
      <p class="case-tags">${task.tags.map((t) => esc(t)).join("｜")}</p>
      <h3>${esc(task.title)}</h3>
      <p>${esc(task.subtitle)}</p>
      <button type="button" class="btn" data-open-case="${esc(task.id)}">${label}</button>
    </article>`;
  }).join("");
}

function stepNo(run) {
  return Math.min(6, Math.max(1, Number(run?.step) || 1));
}

function progressLine(task, run) {
  const n = stepNo(run);
  return `<p class="case-step" tabindex="-1">第${n}步／共${task.steps.length}步　${esc(task.steps[n - 1] || "")}</p>`;
}

function saveNote() {
  return `<p class="muted case-save-note">${esc(caseSaveNoteText())}</p>`;
}

export function caseSaveNoteText() {
  const s = cloudSyncStatus();
  let cloud = "這版有雲端同步程式。尚未設定後端，進度未上傳。";
  if (s.configured && s.synced) cloud = "這版有雲端同步程式。已設定後端，最近一次已成功同步。";
  else if (s.configured && s.failed) cloud = "這版有雲端同步程式。已設定後端，但最近一次同步未成功，進度未上傳。";
  else if (s.configured) cloud = "這版有雲端同步程式。已設定後端，尚未確認同步成功，進度未算已上傳。";
  return `查案進度存在這個學號的本機存檔。${cloud} 研究紀錄只在這部裝置，不是全班統計。`;
}

function researchTools() {
  const room = logRoom();
  let exported = "";
  try {
    exported = localStorage.getItem(LOG_EXPORT_KEY) || "";
  } catch {
    exported = "";
  }
  const full = room.full
    ? "已滿。新紀錄暫停寫入，未匯出的舊紀錄沒有刪除。"
    : "未滿時會繼續保留，不會自動刪走未匯出紀錄。";
  const clearLabel = clearArmed ? "再按一次，確認清除" : "清除這部裝置的研究紀錄";
  return `
    <p class="muted case-log-note">這部裝置研究紀錄 ${room.n}／${room.max} 筆。${full} 匯出是 CSV 檔，只包括已同意記錄的事件。</p>
    <p class="muted">${exported ? `上次匯出：${esc(exported)}。` : "這部裝置尚未按過匯出。"}清除要再按一次確認，未匯出的紀錄會一併消失。</p>
    <div class="case-actions">
      <button type="button" class="btn ghost" id="case-csv">匯出研究紀錄（CSV）</button>
      <button type="button" class="btn ghost" id="case-log-clear">${clearLabel}</button>
    </div>`;
}

function feedbackHtml(ok, text) {
  if (!text) return "";
  const mark = ok ? "答對" : "未中";
  return `<p class="case-fb ${ok ? "is-ok" : "is-no"}" role="status"><strong>${mark}。</strong> ${esc(text)}</p>`;
}

function optionButtons(name, options, picked) {
  return options
    .map((o) => {
      const on = picked === o.id ? " is-on" : "";
      return `<button type="button" class="case-choice${on}" data-${name}="${esc(o.id)}" aria-pressed="${picked === o.id ? "true" : "false"}">${esc(o.text)}</button>`;
    })
    .join("");
}

export function renderCase(user, caseId) {
  const task = getCase(caseId);
  const run = readRun(user, task) || { step: 1, read: {}, slots: {}, rewarded: false };
  const n = stepNo(run);
  const head = `
    <p class="case-tags">${task.tags.map((t) => esc(t)).join("｜")}</p>
    <h2>${esc(task.title)}</h2>
    <p class="lead">${esc(task.objective)}</p>
    ${progressLine(task, run)}`;
  let body = "";
  if (n === 1) body = renderStep1(user, task, run);
  else if (n === 2) body = renderStep2(task, run);
  else if (n === 3) body = renderStep3(task, run);
  else if (n === 4) body = renderStep4(task, run);
  else if (n === 5) body = renderStep5(task, run);
  else body = renderStep6(task, run);
  return `<section class="panel-paper case-view" data-case="${esc(task.id)}">${head}${body}</section>`;
}

function renderStep1(user, task, run) {
  const on = researchOn(user);
  const reason = on
    ? `<fieldset class="case-reason">
        <legend>今次你點解開啟呢個任務？（可不答。未選會記為未回答，不會當成自己想試）</legend>
        <div class="case-choices">${optionButtons("reason", task.reasons, run.reason)}</div>
      </fieldset>`
    : "";
  return `
    ${saveNote()}
    <label class="case-optin"><input type="checkbox" id="case-research" ${on ? "checked" : ""}/> 允許在這部裝置記錄學習過程（研究用途）。正式收集前，由老師確認學校要求同同意程序。記錄不含姓名，亦不儲存自由文字。</label>
    ${reason}
    ${researchTools()}
    <p class="case-fiction">${esc(task.scene.fictionLabel)}</p>
    <p>${esc(task.scene.text)}</p>
    <blockquote class="case-record"><p class="eyebrow">${esc(task.record.kind)}</p><p>${esc(task.record.text)}</p></blockquote>
    <p class="muted">核心問題：${esc(task.question)}</p>
    <div class="case-actions">
      <button type="button" class="btn" data-case-path="clues">先查線索</button>
      <button type="button" class="btn ghost" data-case-path="direct">直接判斷</button>
    </div>`;
}

function renderStep2(task, run) {
  const open = run.openClue || "";
  const cards = task.clues
    .map((c, i) => {
      const read = !!run.read?.[c.id];
      const shown = open === c.id;
      return `<article class="clue-card ${read ? "is-read" : ""}">
        <button type="button" class="clue-toggle" data-clue="${esc(c.id)}" aria-expanded="${shown ? "true" : "false"}">
          <span class="clue-status">${read ? "已讀" : "未讀"}</span>
          <strong>${i + 1}. ${esc(c.title)}</strong>
        </button>
        ${
          shown
            ? `<div class="clue-body"><p>${esc(c.text)}</p><details class="clue-source"><summary>資料來源說明</summary><p>${esc(c.source)}</p></details></div>`
            : ""
        }
      </article>`;
    })
    .join("");
  return `
    <p>三張線索可以按任何次序睇。唔使等解鎖。</p>
    <div class="clue-list">${cards}</div>
    <div class="case-actions">
      <button type="button" class="btn" data-case-goto="3">去作出判斷</button>
      <button type="button" class="btn ghost" data-case-goto="1">返回接案</button>
    </div>`;
}

function renderStep3(task, run) {
  const picked = task.judgment.options.find((o) => o.id === run.judgment);
  const show = run.judgment && !run.judgmentOk;
  return `
    <p>${esc(task.judgment.prompt)}</p>
    <div class="case-choices">${optionButtons("judge", task.judgment.options, run.judgmentOk ? run.judgment : "")}</div>
    ${show && picked ? feedbackHtml(false, picked.feedback) : ""}
    ${run.judgmentOk ? feedbackHtml(true, task.judgment.options.find((o) => o.ok)?.feedback) : ""}
    <div class="case-actions">
      ${run.judgmentOk ? `<button type="button" class="btn" data-case-goto="4">去提出證據</button>` : ""}
      <button type="button" class="btn ghost" data-case-goto="2">返回查看線索</button>
    </div>`;
}

function renderStep4(task, run) {
  const ev = task.evidence;
  const clue = ev.options.find((o) => o.id === run.evidenceClue);
  const slots = ev.slots
    .map((slot) => {
      const picked = run.slots?.[slot.id] || "";
      const opt = slot.options.find((o) => o.id === picked);
      const bad = opt && !opt.ok;
      return `<fieldset class="case-slot"><legend>${esc(slot.prompt)}</legend><div class="case-choices">${optionButtons(
        `slot-${slot.id}`,
        slot.options,
        picked
      )}</div>${bad ? feedbackHtml(false, opt.feedback) : ""}</fieldset>`;
    })
    .join("");
  const clueBad = clue && !clue.ok;
  const ready = clue?.ok && ev.slots.every((slot) => slot.options.find((o) => o.id === run.slots?.[slot.id])?.ok);
  return `
    <p>${esc(ev.prompt)}</p>
    <div class="case-choices">${optionButtons("evidence", ev.options, run.evidenceClue)}</div>
    ${clueBad ? feedbackHtml(false, clue.feedback) : ""}
    ${clue?.ok ? feedbackHtml(true, clue.feedback) : ""}
    <p class="case-build">完成這句：安史之亂不能只解釋為玄宗怠政，<strong>因為</strong>……，<strong>而且</strong>……。</p>
    ${slots}
    <div class="case-actions">
      <button type="button" class="btn ghost" data-case-hint="1">${run.hintUsed ? "已看過提示" : "查看提示"}</button>
      ${ready ? `<button type="button" class="btn" data-case-goto="5">去結案</button>` : ""}
      <button type="button" class="btn ghost" data-case-goto="2">返回查看線索</button>
    </div>
    ${run.hintOpen ? `<p class="case-hint" tabindex="-1" role="status">提示：${esc(ev.hint)}</p>` : ""}`;
}

function renderStep5(task, run) {
  const picked = task.check.options.find((o) => o.id === run.check);
  const showBad = run.check && !run.checkOk;
  const clue = task.clues.find((c) => c.id === run.evidenceClue);
  return `
    <h3>你的判斷同證據</h3>
    <p><strong>判斷：</strong>${esc(task.judgment.options.find((o) => o.id === run.judgment)?.text || "")}</p>
    <p><strong>證據：</strong>${esc(clue?.title || "")}</p>
    <p>${esc(task.done.link)}</p>
    <p class="muted">原記錄只把起兵收成「皇帝怠政」。線索顯示邊鎮已有兵力，中央的直接指揮又轉弱，所以單一原因不夠。</p>
    <p>${esc(task.check.prompt)}</p>
    <div class="case-choices">${optionButtons("check", task.check.options, run.checkOk ? run.check : "")}</div>
    ${showBad && picked ? feedbackHtml(false, picked.feedback) : ""}
    ${run.checkOk ? feedbackHtml(true, task.check.options.find((o) => o.ok)?.feedback) : ""}
    ${
      run.checkOk
        ? `<div class="case-outcome">
            <p><strong>${esc(task.done.learned)}</strong></p>
            <p>${esc(task.done.limit)}</p>
            <p class="muted">${run.rewarded ? "首次完成的經驗已經入帳，重玩不會再加。" : ""}</p>
            <button type="button" class="btn" data-case-goto="6">去自主選擇</button>
          </div>`
        : ""
    }
    <div class="case-actions"><button type="button" class="btn ghost" data-case-goto="2">返回查看線索</button></div>`;
}

function renderStep6(task, run) {
  const clue = task.clues.find((c) => c.id === run.evidenceClue);
  return `
    <p><strong>${esc(task.done.learned)}</strong></p>
    <p>${esc(task.done.limit)}</p>
    <p><strong>你的判斷：</strong>${esc(task.judgment.options.find((o) => o.id === run.judgment)?.text || "")}</p>
    <p><strong>你的證據：</strong>${esc(clue?.title || "尚未選擇")}</p>
    <p>${esc(task.done.link)}</p>
    <div class="case-actions">
      <button type="button" class="btn" data-case-leave="1">今天到這裏</button>
      <button type="button" class="btn ghost" data-case-review="1">回看我的證據</button>
      <button type="button" class="btn ghost" data-case-replay="1">再挑戰一次</button>
    </div>
    ${saveNote()}
    ${researchTools()}`;
}

function taskOf(root) {
  return getCase(root?.dataset.case || "");
}

export function bindCase(user, ctx) {
  const { toast, render, state } = ctx;
  const root = document.querySelector(".case-view");
  if (!root) return;
  const task = taskOf(root);
  const username = user.username;
  rememberCaseOpen(username, task.id);
  let run = readRun(user, task);
  const noteLog = (result) => {
    if (result === "full") toast("研究紀錄已滿 200 筆，新紀錄未寫入，舊紀錄仍保留。請先匯出，再按清除。");
    else if (result === false) toast("研究紀錄未寫入，查案可以繼續。");
  };
  if (run && run.step > 1 && !state.caseResumeLogged) {
    state.caseResumeLogged = true;
    noteLog(logCaseEvent(user, run, task, "resume", { step: run.step }));
  }

  const commit = (next, event, extra) => {
    const ok = saveRun(username, task, next);
    const key = draftKey(username, task.id);
    if (ok) drafts.delete(key);
    else {
      drafts.set(key, next);
      failSave(toast);
    }
    if (event) noteLog(logCaseEvent(ctx.getUser?.() || user, next, task, event, extra));
    return next;
  };

  const paint = (sel, keepClear) => {
    if (!keepClear) clearArmed = false;
    state.caseFocus = sel || "";
    render();
  };

  root.querySelector("#case-research")?.addEventListener("change", (e) => {
    const on = !!e.target.checked;
    const ok = updateUser((u) => {
      u.progress = u.progress || {};
      u.progress.researchOptIn = on;
      if (on && !u.progress.researchCode) u.progress.researchCode = newId("R");
    });
    if (!ok) failSave(toast);
    paint("#case-research");
  });

  root.querySelectorAll("[data-reason]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const reason = btn.dataset.reason;
      const base = readRun(ctx.getUser?.() || user, task) || blankRun(task, null);
      const next = { ...base, reason };
      if (!commit(next, "reason", { step: 1, itemId: reason })) return;
      paint(`[data-reason="${reason}"]`);
    });
  });

  root.querySelectorAll("[data-case-path]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const path = btn.dataset.casePath;
      const prev = readRun(ctx.getUser?.() || user, task);
      const base = prev?.attemptId ? { ...blankRun(task, prev), ...prev } : blankRun(task, prev);
      const starting = !prev?.path;
      const next = { ...base, path, step: path === "direct" ? 3 : 2 };
      if (!commit(next, starting ? "start" : "", { step: next.step, itemId: path })) return;
      state.caseResumeLogged = true;
      paint("");
    });
  });

  root.querySelectorAll("[data-case-goto]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const step = Number(btn.dataset.caseGoto);
      const cur = readRun(ctx.getUser?.() || user, task);
      if (!cur) return;
      if (!commit({ ...cur, step, openClue: step === 2 ? cur.openClue : "" })) return;
      paint("");
    });
  });

  root.querySelectorAll("[data-clue]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.clue;
      const cur = readRun(ctx.getUser?.() || user, task);
      if (!cur) return;
      const read = { ...(cur.read || {}), [id]: true };
      const openClue = cur.openClue === id ? "" : id;
      const first = !cur.read?.[id];
      if (!commit({ ...cur, read, openClue }, first ? "clue_open" : "", { step: 2, itemId: id })) return;
      paint(`[data-clue="${id}"]`);
    });
  });

  root.querySelectorAll("[data-judge]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.judge;
      const opt = task.judgment.options.find((o) => o.id === id);
      const cur = readRun(ctx.getUser?.() || user, task);
      if (!cur || !opt || cur.judgmentOk) return;
      const next = { ...cur, judgment: id, judgmentOk: !!opt.ok };
      if (!commit(next, "answer", { step: 3, itemId: task.judgment.id + ":" + id, ok: !!opt.ok })) return;
      paint(`[data-judge="${id}"]`);
    });
  });

  root.querySelectorAll("[data-evidence]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.evidence;
      const opt = task.evidence.options.find((o) => o.id === id);
      const cur = readRun(ctx.getUser?.() || user, task);
      if (!cur || !opt) return;
      if (!commit({ ...cur, evidenceClue: id }, "answer", { step: 4, itemId: "clue:" + id, ok: !!opt.ok })) return;
      paint(`[data-evidence="${id}"]`);
    });
  });

  task.evidence.slots.forEach((slot) => {
    root.querySelectorAll(`[data-slot-${slot.id}]`).forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute(`data-slot-${slot.id}`);
        const opt = slot.options.find((o) => o.id === id);
        const cur = readRun(ctx.getUser?.() || user, task);
        if (!cur || !opt) return;
        const slots = { ...(cur.slots || {}), [slot.id]: id };
        if (!commit({ ...cur, slots }, "answer", { step: 4, itemId: slot.id + ":" + id, ok: !!opt.ok })) return;
        paint(`[data-slot-${slot.id}="${id}"]`);
      });
    });
  });

  root.querySelector("[data-case-hint]")?.addEventListener("click", () => {
    const cur = readRun(ctx.getUser?.() || user, task);
    if (!cur) return;
    const first = !cur.hintUsed;
    if (!commit({ ...cur, hintUsed: true, hintOpen: !cur.hintOpen }, first ? "hint" : "", { step: 4, itemId: "evidence" })) return;
    paint(cur.hintOpen ? "[data-case-hint]" : ".case-hint");
  });

  root.querySelectorAll("[data-check]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.check;
      const opt = task.check.options.find((o) => o.id === id);
      const cur = readRun(ctx.getUser?.() || user, task);
      if (!cur || !opt || cur.checkOk) return;
      const next = { ...cur, check: id, checkOk: !!opt.ok };
      if (opt.ok) {
        next.done = true;
        next.completedOnce = true;
        next.step = 5;
        if (!cur.rewarded) next.rewarded = true;
      }
      if (!commit(next, "answer", { step: 5, itemId: task.check.id + ":" + id, ok: !!opt.ok })) return;
      if (opt.ok && !cur.rewarded) {
        addXp(XP_REWARDS.caseComplete || 12);
        logCaseEvent(ctx.getUser?.() || user, next, task, "complete", { step: 5, itemId: task.id, ok: true });
        toast(`首次完成，經驗 +${XP_REWARDS.caseComplete || 12}。重玩不會再加。`);
      }
      paint(`[data-check="${id}"]`);
    });
  });

  root.querySelector("[data-case-leave]")?.addEventListener("click", () => {
    state.view = "home";
    state.caseResumeLogged = false;
    try {
      sessionStorage.removeItem("huangchao_case_open");
    } catch {
      /* ignore */
    }
    render();
  });

  root.querySelector("[data-case-review]")?.addEventListener("click", () => {
    const cur = readRun(ctx.getUser?.() || user, task);
    if (!cur) return;
    if (!commit({ ...cur, step: 5 })) return;
    paint("");
  });

  root.querySelector("[data-case-replay]")?.addEventListener("click", () => {
    const cur = readRun(ctx.getUser?.() || user, task);
    const next = blankRun(task, cur);
    if (!commit(next, "replay", { step: 1, itemId: task.id })) return;
    state.caseResumeLogged = true;
    paint("");
  });

  root.querySelector("#case-csv")?.addEventListener("click", () => {
    const csv = caseCsv();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "case-research.csv";
    a.click();
    URL.revokeObjectURL(url);
    try {
      localStorage.setItem(LOG_EXPORT_KEY, new Date().toISOString());
    } catch {
      /* 匯出檔已下載，時間記唔到唔阻擋 */
    }
    toast("已匯出這部裝置的研究紀錄。");
    paint("#case-csv");
  });

  root.querySelector("#case-log-clear")?.addEventListener("click", () => {
    if (!clearArmed) {
      clearArmed = true;
      paint("#case-log-clear", true);
      return;
    }
    clearArmed = false;
    try {
      localStorage.removeItem(LOG_KEY);
    } catch {
      toast("研究紀錄未清除，查案可以繼續。");
      paint("#case-log-clear");
      return;
    }
    toast("已清除這部裝置的研究紀錄。");
    paint("#case-log-clear");
  });

  const sel = state.caseFocus || "";
  state.caseFocus = "";
  const focusEl = (sel && root.querySelector(sel)) || root.querySelector(".case-step");
  if (focusEl) {
    focusEl.focus({ preventScroll: true });
    if (focusEl.classList.contains("case-step")) root.scrollIntoView({ block: "start" });
    else focusEl.scrollIntoView({ block: "nearest" });
  }
}
