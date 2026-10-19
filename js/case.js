/**
 * 歷史查案介面。題目內容見 js/data/cases.js。
 * 研究紀錄只在這部裝置，而且要學生自己開啟。
 */
import { CASES, getCase } from "./data/cases.js?v=rad105";
import { XP_REWARDS } from "./data/levels.js?v=rad90";
import { updateUser, addXp } from "./storage.js?v=rad114";
import { cloudSyncStatus } from "./cloud.js?v=rad154";

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
    if (!caseId) {
      sessionStorage.removeItem(CASE_OPEN_KEY);
      if (sessionStorage.getItem("huangchao_resume_kind") === "case") {
        sessionStorage.removeItem("huangchao_resume_kind");
      }
    } else {
      sessionStorage.setItem(CASE_OPEN_KEY, `${String(username || "").toUpperCase()}|${caseId}`);
      sessionStorage.setItem("huangchao_resume_kind", "case");
    }
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
    marks: {},
    notes: [],
    hypothesis: "",
    conduct: "",
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
  return CASES.filter((task) => {
    const run = readRun(user, task);
    return !(run?.done || run?.completedOnce);
  }).map((task) => {
    const run = readRun(user, task);
    const ongoing = run && !run.done && (run.step > 1 || run.path);
    const label = ongoing ? "繼續" : "查案";
    return `
    <article class="case-entry">
      <h3>${esc(task.title)}</h3>
      <button type="button" class="btn" data-open-case="${esc(task.id)}">${label}</button>
    </article>`;
  }).join("");
}

function stepNo(run) {
  return Math.min(5, Math.max(1, Number(run?.step) || 1));
}

function progressLine(task, run) {
  const n = stepNo(run);
  return `<p class="case-step" tabindex="-1">第${n}步／共${task.steps.length}步　${esc(task.steps[n - 1] || "")}</p>`;
}

function saveNote() {
  return `<details class="case-settings">
    <summary>保存狀態</summary>
    <p class="case-save-note">進度在這個學號的存檔裡。寫入失敗會另外提示，不會顯示成已保存。</p>
    <p class="muted">${esc(caseSaveNoteText())}</p>
  </details>`;
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

function feedbackHtml(ok, text, review) {
  if (!text) return "";
  const mark = ok ? "這條對得上" : "這條對不上";
  const back = !ok && review ? ` 可返回查看${esc(review)}。` : "";
  return `<p class="case-fb ${ok ? "is-ok" : "is-no"}" role="status"><strong>${mark}。</strong> ${esc(text)}${back}</p>`;
}

function addNote(run, text) {
  const notes = Array.isArray(run.notes) ? run.notes : [];
  if (!text || notes.includes(text)) return notes;
  return [...notes, text];
}

function notesHtml(run) {
  const notes = Array.isArray(run.notes) ? run.notes : [];
  if (!notes.length) return "";
  return `<div class="case-notes"><p class="case-k">調查筆記</p><ul>${notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul></div>`;
}

function hypothesisHtml(run) {
  if (!run.hypothesis) return "";
  return `<p class="case-hypo"><span>目前的假設</span> ${esc(run.hypothesis)}</p>`;
}

function clerkLine(task, text) {
  if (!text) return "";
  return `<p class="case-say"><strong>${esc(task.clerk.name)}</strong>（${esc(task.clerk.role)}）：${esc(text)}</p>`;
}

function clueTray(task, run) {
  return `<div class="clue-list">${task.clues
    .map((c, i) => {
      const read = !!run.read?.[c.id];
      const shown = run.openClue === c.id;
      return `<article class="clue-card ${read ? "is-read" : ""}">
        <button type="button" class="clue-toggle" data-clue="${esc(c.id)}" aria-expanded="${shown ? "true" : "false"}">
          <span class="clue-status">${read ? "已看" : "未看"}</span>
          <strong>線索${i + 1}　${esc(c.title)}</strong>
        </button>
        ${
          shown
            ? `<div class="clue-body"><p>${esc(c.text)}</p><details class="clue-source"><summary>資料來源說明</summary><p>${esc(c.source)}</p></details></div>`
            : ""
        }
      </article>`;
    })
    .join("")}</div>`;
}

function settingsBlock(user, task, run) {
  const on = researchOn(user);
  const reason = on
    ? `<fieldset class="case-reason">
        <legend>今次你點解開啟呢個任務？（可不答。未選會記為未回答，不會當成自己想試）</legend>
        <div class="case-choices">${optionButtons("reason", task.reasons, run.reason)}</div>
      </fieldset>`
    : "";
  return `${saveNote()}
    <details class="case-settings" ${on ? "open" : ""}>
      <summary>研究紀錄（預設關閉）</summary>
      <label class="case-optin"><input type="checkbox" id="case-research" ${on ? "checked" : ""}/> 允許在這部裝置記錄學習過程（研究用途）。正式收集前，由老師確認學校要求同同意程序。記錄不含姓名，亦不儲存自由文字。不勾選就不會記錄。</label>
      ${reason}
      ${researchTools()}
    </details>`;
}

function optionButtons(name, options, picked) {
  return options
    .map((o) => {
      const on = picked === o.id ? " is-on" : "";
      return `<button type="button" class="case-choice${on}" data-${name}="${esc(o.id)}" aria-pressed="${picked === o.id ? "true" : "false"}">${esc(o.text)}</button>`;
    })
    .join("");
}

function pairReady(task, run) {
  const picked = task.evidence.options.find((o) => o.id === run.evidenceClue);
  return !!picked?.ok;
}

export function renderCase(user, caseId) {
  const task = getCase(caseId);
  const run = readRun(user, task) || { step: 1, read: {}, slots: {}, marks: {}, notes: [], rewarded: false };
  const n = stepNo(run);
  const head =
    n === 1
      ? `<p class="case-tags">${task.tags.map((t) => esc(t)).join("｜")}</p><h2>${esc(task.title)}</h2>`
      : `<p class="case-tags">${task.tags.map((t) => esc(t)).join("｜")}</p><h2>${esc(task.title)}</h2>${progressLine(task, run)}`;
  let body = "";
  if (n === 1) body = renderStep1(user, task, run);
  else if (n === 2) body = renderInspect(user, task, run);
  else if (n === 3) body = renderPair(user, task, run);
  else if (n === 4) body = pairReady(task, run) ? renderConduct(user, task, run) : renderPair(user, task, run);
  else body = renderSettle(user, task, run);
  return `<section class="panel-paper case-view" data-case="${esc(task.id)}">${head}${body}</section>`;
}

function renderStep1(user, task, run) {
  return `
    <p class="case-event">${esc(task.hook || task.scene.text)}</p>
    <p>${esc(task.role || task.objective)}</p>
    <div class="case-actions">
      <button type="button" class="btn case-go" data-case-path="clues">開始調查</button>
    </div>
    ${settingsBlock(user, task, run)}`;
}

function renderInspect(user, task, run) {
  const sentences = (task.inspect?.sentences || [])
    .map((s) => {
      const on = !!run.marks?.[s.id];
      return `<button type="button" class="case-sentence${on ? " is-mark" : ""}" data-mark="${esc(s.id)}" aria-pressed="${on ? "true" : "false"}">${esc(s.text)}</button>`;
    })
    .join("");
  const marked = (task.inspect?.sentences || []).some((s) => s.suspect && run.marks?.[s.id]);
  const last = (task.inspect?.sentences || []).find((s) => s.id === run.lastMark);
  const miss = last && !last.suspect ? feedbackHtml(false, last.miss, last.review) : "";
  return `
    <p class="case-fiction">${esc(task.scene.fictionLabel)}。${esc(task.record.kind)}</p>
    <p>${esc(task.inspect?.prompt || "")}</p>
    <div class="case-doc">${sentences}</div>
    ${miss}
    ${marked ? clerkLine(task, "你標了這句。我不會代你選哪張線索。拿去對照就行。") : ""}
    ${notesHtml(run)}
    ${hypothesisHtml(run)}
    <p class="case-k">三張線索，點開對照。看過的會留着。</p>
    ${clueTray(task, run)}
    <div class="case-actions">
      ${marked ? `<button type="button" class="btn case-go" data-case-goto="3">拿標過的句子去對線索</button>` : ""}
      <button type="button" class="btn ghost" data-case-goto="1">返回</button>
    </div>
    ${settingsBlock(user, task, run)}`;
}

function renderPair(user, task, run) {
  const ev = task.evidence;
  const clue = ev.options.find((o) => o.id === run.evidenceClue);
  const bad = clue && !clue.ok;
  const marked = (task.inspect?.sentences || []).filter((s) => s.suspect && run.marks?.[s.id]);
  return `
    <p class="case-claim">你標過的句子：${esc(marked.map((s) => s.text).join("／") || task.record.text)}</p>
    <p>${esc(ev.prompt)}</p>
    <div class="case-choices">${optionButtons("pair", ev.options, clue?.ok ? run.evidenceClue : "")}</div>
    ${bad ? feedbackHtml(false, clue.feedback, "線索①") : ""}
    ${clue?.ok ? feedbackHtml(true, clue.feedback) : ""}
    ${clue?.ok ? clerkLine(task, "邊鎮有自己的兵，所以「只因皇帝不勤」蓋不住。范陽起兵仍是史實，不是標完它就沒發生。") : ""}
    ${bad ? clerkLine(task, "這張不是最直接的。回到你標過的那句，看它缺的是軍隊，不是另一個宮廷故事。") : ""}
    ${notesHtml(run)}
    ${hypothesisHtml(run)}
    ${clueTray(task, run)}
    <div class="case-actions">
      ${clue?.ok ? `<button type="button" class="btn case-go" data-case-goto="4">決定怎樣處理這則記錄</button>` : ""}
      <button type="button" class="btn ghost" data-case-goto="2">返回查看記錄</button>
    </div>
    ${settingsBlock(user, task, run)}`;
}

function renderConduct(user, task, run) {
  const options = task.conduct?.options || [];
  return `
    <p>${esc(task.conduct?.prompt || "")}</p>
    <p class="muted">歷史判斷不變：不能只把安史之亂收成皇帝怠政。最直接的反證仍是邊鎮已有軍隊。</p>
    <div class="case-actions">
      ${options
        .map((o) => `<button type="button" class="btn case-go" data-conduct="${esc(o.id)}">${esc(o.text)}</button>`)
        .join("")}
    </div>
    ${notesHtml(run)}
    ${settingsBlock(user, task, run)}`;
}

function renderSettle(user, task, run) {
  const choice = (task.conduct?.options || []).find((o) => o.id === run.conduct);
  const clue = task.clues.find((c) => c.id === run.evidenceClue) || task.clues[0];
  const know = task.check.options.find((o) => o.ok);
  const xp = run.rewarded
    ? "首次完成的經驗已經入帳。重玩不會再加。"
    : run.conduct
      ? "這次經驗未寫入。請再試一次。"
      : "";
  const pick = !choice
    ? `<p>這次還沒有記下你怎樣處理記錄。</p>
    <p>${esc(task.conduct?.prompt || "")}</p>
    <div class="case-actions">${(task.conduct?.options || [])
      .map((o) => `<button type="button" class="btn case-go" data-conduct="${esc(o.id)}">${esc(o.text)}</button>`)
      .join("")}</div>`
    : `
    <p class="case-k">事件怎樣結束</p>
    <p>${esc(choice.ending)}</p>
    <p class="case-say"><strong>${esc(task.clerk.name)}</strong>：${esc(choice.reply)}</p>
    <p class="case-k">你的決定</p>
    <p>${esc(choice.text)}</p>
    <p class="case-k">最重要的一條證據</p>
    <p>${esc(clue.title)}。${esc(clue.text)}</p>
    <p class="case-k">這次用到的歷史知識</p>
    <p>${esc(task.done.link)}</p>
    <p>${esc(know?.text || "")} ${esc(know?.feedback || "")}</p>
    <p class="muted">以上知識點是教學整理，不是古籍引文。人物和「怎樣處理記錄」是虛構。</p>
    <p class="case-k">經驗</p>
    <p>${esc(xp)}</p>
    ${run.conduct && !run.rewarded ? `<button type="button" class="btn ghost" data-case-grant="1">再試寫入經驗</button>` : ""}
    <div class="case-actions">
      <button type="button" class="btn case-go" data-case-leave="1">今天到這裏</button>
      <button type="button" class="btn ghost" data-case-replay="1">再查一次</button>
    </div>`;
  return `${pick}${settingsBlock(user, task, run)}`;
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
    return ok;
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
      commit(next, "reason", { step: 1, itemId: reason });
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
      commit(next, starting ? "start" : "", { step: next.step, itemId: path });
      state.caseResumeLogged = true;
      paint("");
    });
  });

  root.querySelectorAll("[data-case-goto]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const step = Number(btn.dataset.caseGoto);
      const cur = readRun(ctx.getUser?.() || user, task);
      if (!cur) return;
      commit({ ...cur, step, openClue: step === 2 ? cur.openClue : "" });
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
      commit({ ...cur, read, openClue }, first ? "clue_open" : "", { step: cur.step || 2, itemId: id });
      paint(`[data-clue="${id}"]`);
    });
  });

  root.querySelectorAll("[data-mark]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.mark;
      const sentence = (task.inspect?.sentences || []).find((s) => s.id === id);
      const cur = readRun(ctx.getUser?.() || user, task);
      if (!cur || !sentence) return;
      const marks = { ...(cur.marks || {}) };
      if (sentence.suspect) marks[id] = true;
      const notes = addNote(cur, sentence.suspect ? sentence.hit : sentence.miss);
      const hypothesis = sentence.suspect
        ? cur.hypothesis && String(cur.hypothesis).startsWith("推翻")
          ? cur.hypothesis
          : "保留：記錄把起兵收成皇帝怠政。還沒有用證據核對。"
        : cur.hypothesis || "";
      commit(
        { ...cur, marks, notes, hypothesis, lastMark: id },
        sentence.suspect ? "mark" : "",
        { step: 2, itemId: id }
      );
      paint(`[data-mark="${id}"]`);
    });
  });

  root.querySelectorAll("[data-pair]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.pair;
      const opt = task.evidence.options.find((o) => o.id === id);
      const cur = readRun(ctx.getUser?.() || user, task);
      if (!cur || !opt || pairReady(task, cur)) return;
      const next = { ...cur, evidenceClue: id };
      if (opt.ok) {
        next.judgment = "b";
        next.judgmentOk = true;
        next.hypothesis = "推翻「只因怠政」。最直接的反證是邊鎮節度使已握軍隊。";
        next.notes = addNote(next, "線索①反駁「主要因為皇帝不再勤政」。");
      }
      commit(next, "answer", { step: 3, itemId: "clue:" + id, ok: !!opt.ok });
      paint(`[data-pair="${id}"]`);
    });
  });

  const grantOnce = (cur, next) => {
    if (cur.rewarded) return;
    let xpOk = false;
    try {
      xpOk = !!addXp(XP_REWARDS.caseComplete || 12);
    } catch {
      xpOk = false;
    }
    if (!xpOk) {
      toast("這次經驗未寫入。請再試一次。");
      return;
    }
    const marked = { ...next, rewarded: true };
    if (!commit(marked, "complete", { step: 5, itemId: task.id, ok: true })) {
      toast("經驗已加上，完成標記未寫入。請再試一次，不會重複加經驗。");
      return;
    }
    toast(`首次完成，經驗 +${XP_REWARDS.caseComplete || 12}。重玩不會再加。`);
  };

  root.querySelectorAll("[data-conduct]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.conduct;
      const opt = (task.conduct?.options || []).find((o) => o.id === id);
      const cur = readRun(ctx.getUser?.() || user, task);
      if (!cur || !opt || cur.conduct) return;
      const next = {
        ...cur,
        conduct: id,
        done: true,
        completedOnce: true,
        step: 5,
        check: cur.checkOk ? cur.check : "a",
        checkOk: true,
        judgment: cur.judgmentOk ? cur.judgment : "b",
        judgmentOk: true,
      };
      const saved = commit(next, "choice", { step: 4, itemId: id });
      if (saved) grantOnce(cur, next);
      paint("");
    });
  });

  root.querySelector("[data-case-grant]")?.addEventListener("click", () => {
    const cur = readRun(ctx.getUser?.() || user, task);
    if (!cur?.conduct || cur.rewarded) return;
    const saved = commit(cur, "", { step: 5, itemId: cur.conduct });
    if (saved) grantOnce(cur, cur);
    paint("[data-case-grant]");
  });

  root.querySelector("[data-case-leave]")?.addEventListener("click", () => {
    state.view = "home";
    state.caseResumeLogged = false;
    try {
      sessionStorage.removeItem("huangchao_case_open");
      if (sessionStorage.getItem("huangchao_resume_kind") === "case") {
        sessionStorage.removeItem("huangchao_resume_kind");
      }
    } catch {
      /* ignore */
    }
    render();
  });

  root.querySelector("[data-case-review]")?.addEventListener("click", () => {
    const cur = readRun(ctx.getUser?.() || user, task);
    if (!cur) return;
    commit({ ...cur, step: 5 });
    paint("");
  });

  root.querySelector("[data-case-replay]")?.addEventListener("click", () => {
    const cur = readRun(ctx.getUser?.() || user, task);
    const next = blankRun(task, cur);
    commit(next, "replay", { step: 1, itemId: task.id });
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
