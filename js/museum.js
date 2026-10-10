/**
 * 今日歷史來信與個人史館。內容在 js/data/letters.js。
 * 研究紀錄沿用查案那個同意開關；未開啟就不寫。登入本身不記成自願學習。
 */
import {
  CHAPTERS,
  COLORS,
  SLOTS,
  chapterById,
  letterDay,
  letterForDay,
  slotById,
} from "./data/letters.js?v=rad97";
import { XP_REWARDS } from "./data/levels.js?v=rad97";
import { updateUser, addXp } from "./storage.js?v=rad95";
import { logCaseEvent, researchOn } from "./case.js?v=rad95";

const OPEN_KEY = "huangchao_museum_open";
const drafts = new Map();

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

function emptyMuseum() {
  return { chapters: {}, colors: {} };
}

export function readMuseum(user) {
  const key = String(user?.username || "").toUpperCase();
  if (key && drafts.has(key)) return drafts.get(key);
  const raw = user?.progress?.museum;
  if (!raw || typeof raw !== "object") return emptyMuseum();
  return {
    chapters: raw.chapters || {},
    colors: raw.colors || {},
  };
}

function saveMuseum(username, next) {
  const key = String(username || "").toUpperCase();
  try {
    const saved = updateUser((u) => {
      if (String(u.username || "").toUpperCase() !== key) return;
      u.progress = u.progress || {};
      u.progress.museum = next;
    });
    if (saved) drafts.delete(key);
    else drafts.set(key, next);
    return !!saved;
  } catch {
    drafts.set(key, next);
    return false;
  }
}

export function rememberMuseumOpen(username, screen) {
  try {
    if (!screen) {
      sessionStorage.removeItem(OPEN_KEY);
      if (sessionStorage.getItem("huangchao_resume_kind") === "museum") {
        sessionStorage.removeItem("huangchao_resume_kind");
      }
    } else {
      sessionStorage.setItem(OPEN_KEY, `${String(username || "").toUpperCase()}|${screen}`);
      sessionStorage.setItem("huangchao_resume_kind", "museum");
    }
  } catch {
    /* 分頁記不住時，仍可從首頁再開 */
  }
}

export function recallMuseumOpen(username) {
  try {
    const raw = sessionStorage.getItem(OPEN_KEY) || "";
    const i = raw.indexOf("|");
    if (i < 0) return "";
    if (raw.slice(0, i) !== String(username || "").toUpperCase()) return "";
    return raw.slice(i + 1);
  } catch {
    return "";
  }
}

function chapterRow(user, id) {
  return readMuseum(user).chapters[id] || null;
}

export function museumCard(user, day = letterDay()) {
  const ongoing = CHAPTERS.find((ch) => {
    const row = chapterRow(user, ch.id);
    return row?.started && !row.done;
  });
  const today = letterForDay(day);
  const first = CHAPTERS[0];
  const any = CHAPTERS.some((ch) => {
    const row = chapterRow(user, ch.id);
    return row?.started || row?.done;
  });
  const firstUndone = CHAPTERS.find((ch) => !chapterRow(user, ch.id)?.done) || null;
  if (ongoing) {
    return {
      mode: "continue",
      chapterId: ongoing.id,
      eyebrow: "今日歷史來信",
      title: ongoing.title,
      detail: ongoing.suspense,
      meta: `${ongoing.topic}｜${ongoing.minutes}`,
      primary: "繼續",
      note: "未做完的一章先接上。今天沒有打卡，也沒有漏玩要扣的東西。",
      noNew: false,
    };
  }
  if (!any) {
    const late = today && today.chapter.id !== first.id;
    return {
      mode: "start",
      chapterId: first.id,
      altId: late ? today.chapter.id : "",
      eyebrow: today ? "今日歷史來信" : "今日沒有新來信",
      title: today ? today.chapter.title : first.title,
      detail: today ? today.chapter.suspense : first.suspense,
      meta: `${(today ? today.chapter : first).topic}｜${(today ? today.chapter : first).minutes}`,
      primary: "由第一章開始",
      note: late
        ? "今日來信是較後的一章。你仍可由第一章開始，不必一天只玩一章。"
        : today
          ? "這封信今天不會因為重新整理而換成另一章。"
          : "今日沒有安排新來信。檔案館由第一章可玩，這不是新的每日任務。",
      noNew: !today,
    };
  }
  if (today && !chapterRow(user, today.chapter.id)?.done) {
    return {
      mode: "today",
      chapterId: today.chapter.id,
      eyebrow: "今日歷史來信",
      title: today.chapter.title,
      detail: today.chapter.suspense,
      meta: `${today.chapter.topic}｜${today.chapter.minutes}`,
      primary: "看今日來信",
      note: "較早的章在檔案館，隨時可以補。",
      noNew: false,
    };
  }
  if (firstUndone) {
    return {
      mode: "catchup",
      chapterId: firstUndone.id,
      eyebrow: "今日沒有新來信",
      title: firstUndone.title,
      detail: firstUndone.suspense,
      meta: `${firstUndone.topic}｜${firstUndone.minutes}`,
      primary: "補玩未完成",
      note: today ? "今日這封已經看完。下面是未完成的舊章，不是新任務。" : "沒有新來信。這是檔案館裡還沒做完的一章。",
      noNew: true,
    };
  }
  return {
    mode: "replay",
    chapterId: "hall",
    eyebrow: "今日沒有新來信",
    title: "史館還在",
    detail: "五章都完成了。可以回去看展板，或重玩任何一章。重玩不會再拿首次完成的經驗。",
    meta: "個人史館",
    primary: "回史館",
    note: "",
    noNew: true,
  };
}

export function renderMuseumCard(user) {
  const card = museumCard(user);
  const alt = card.altId
    ? `<button type="button" class="btn ghost" data-open-museum="${esc(card.altId)}">今日這一章</button>`
    : "";
  return `
    <article class="case-entry museum-card">
      <p class="case-tags">${esc(card.eyebrow)}</p>
      <h3>${esc(card.title)}</h3>
      <p>${esc(card.detail)}</p>
      <p class="muted">${esc(card.meta)}</p>
      ${card.note ? `<p class="muted">${esc(card.note)}</p>` : ""}
      <div class="case-actions">
        <button type="button" class="btn" data-open-museum="${esc(card.chapterId)}">${esc(card.primary)}</button>
        ${alt}
        <button type="button" class="btn ghost" data-open-museum="hall">史館</button>
      </div>
    </article>`;
}

function logMuseum(user, row, event, extra) {
  if (!researchOn(user)) return;
  logCaseEvent(
    user,
    { attemptId: row?.attemptId || "", reason: "", step: extra?.step || 1 },
    { id: extra?.taskId || "museum", version: "letters-1" },
    event,
    extra || {}
  );
}

function itemMap(ch) {
  return new Map((ch.items || []).map((item) => [item.id, item]));
}

function inversionText(ch, order) {
  const pos = new Map(order.map((id, index) => [id, index]));
  const items = itemMap(ch);
  for (let i = 0; i < ch.answer.length - 1; i += 1) {
    const left = ch.answer[i];
    const right = ch.answer[i + 1];
    if (pos.get(left) > pos.get(right)) {
      return `「${items.get(left)?.text || ""}」仍排在「${items.get(right)?.text || ""}」後面。年份先不揭開。`;
    }
  }
  return "";
}

function orderHtml(ch, row, revealed) {
  const items = itemMap(ch);
  return (row.order || [])
    .map((id, index) => {
      const item = items.get(id);
      const up = index > 0 ? `<button type="button" class="btn ghost" data-museum-move="${index}:-1">上移</button>` : "";
      const down =
        index < row.order.length - 1
          ? `<button type="button" class="btn ghost" data-museum-move="${index}:1">下移</button>`
          : "";
      const year = revealed ? `<p class="muted">${esc(item?.year || "")}</p><p class="muted">${esc(item?.source || "")}</p>` : "";
      return `<article class="museum-order">
        <p><strong>${index + 1}.</strong> ${esc(item?.text || "")}</p>
        ${year}
        <div class="case-actions">${up}${down}</div>
      </article>`;
    })
    .join("");
}

function cardsHtml(cards, read) {
  return (cards || [])
    .map((card) => {
      const open = !!read?.[card.id];
      return `<button type="button" class="case-choice clue-toggle" data-museum-read="${esc(card.id)}" aria-expanded="${open ? "true" : "false"}">
        ${open ? "已讀" : "未讀"} ${esc(card.title || card.label)}
      </button>
      ${open ? `<div class="clue-body"><p>${esc(card.text)}</p><p class="muted">${esc(card.source)}</p></div>` : ""}`;
    })
    .join("");
}

function optionsHtml(ch, row) {
  const need = new Set((ch.options || []).flatMap((opt) => opt.needs || []));
  const ready = [...need].every((id) => row.read?.[id]);
  return `
    <p>${esc(ch.prompt || "")}</p>
    ${ready ? "" : `<p class="muted">先打開上面的卡片。未讀完也可以按，但會提醒你先讀。</p>`}
    <div class="case-choices">
      ${(ch.options || [])
        .map((opt) => {
          const on = row.pick === opt.id ? " is-on" : "";
          return `<button type="button" class="case-choice${on}" data-museum-pick="${esc(opt.id)}" aria-pressed="${row.pick === opt.id ? "true" : "false"}">${esc(opt.text)}</button>`;
        })
        .join("")}
    </div>
    ${feedbackHtml(ch, row)}`;
}

function feedbackHtml(ch, row) {
  if (!row.pick) return "";
  const opt = (ch.options || []).find((item) => item.id === row.pick);
  if (!opt) return "";
  const mark = opt.ok ? "答對" : "未中";
  return `<p class="case-fb ${opt.ok ? "is-ok" : "is-no"}" role="status"><strong>${mark}。</strong> ${esc(opt.feedback)}</p>`;
}

function ensureRow(user, ch) {
  const cur = chapterRow(user, ch.id);
  if (cur?.started && !cur.done) return cur;
  if (cur?.done) return cur;
  return {
    started: true,
    done: false,
    rewarded: !!cur?.rewarded,
    attemptId: cur?.attemptId || newId("m"),
    order: [...(ch.startOrder || [])],
    phase: ch.kind === "mix" ? "order" : "play",
    read: {},
    pick: "",
    pickOk: false,
  };
}

function endHtml(ch, row) {
  const slot = ch.slot ? slotById(ch.slot) : null;
  const change = slot
    ? `史館的「${slot.title}」可以選配色了。青、朱、墨都在，沒有抽獎。`
    : "這一章沒有新展位。史館其他展板保持原樣。";
  const rewardLine = row?.freshReward
    ? "首次完成這一章的經驗已經入帳。"
    : "這章的首次經驗先前已入帳，今次不再加。";
  return `
    <div class="case-outcome">
      <p><strong>這一章學到：</strong>${esc(ch.learned)}</p>
      <p><strong>史館：</strong>${esc(change)}</p>
      <p class="muted">${esc(rewardLine)}</p>
      <div class="case-actions">
        <button type="button" class="btn" data-open-museum="hall">回史館</button>
        <button type="button" class="btn ghost" data-museum-leave="1">今日到這裏</button>
        <button type="button" class="btn ghost" data-museum-replay="${esc(ch.id)}">再玩這一章</button>
      </div>
    </div>`;
}

function renderPlay(user, ch) {
  const row = ensureRow(user, ch);
  const checking = ch.kind === "claim" || ch.kind === "compare" || (ch.kind === "mix" && row.phase === "claim");
  const ordering = ch.kind === "timeline" || (ch.kind === "mix" && row.phase === "order");
  const revealed = ordering && Array.isArray(row.order) && row.order.join() === (ch.answer || []).join();
  let body = "";
  if (row.done) body = endHtml(ch, row);
  else if (ordering) {
    body = `
      ${orderHtml(ch, row, revealed)}
      <div class="case-actions">
        <button type="button" class="btn" data-museum-check-order="1">${revealed ? "次序已對" : "對次序"}</button>
        <button type="button" class="btn ghost" data-museum-hint="1">提示</button>
      </div>
      ${row.orderNote ? `<p class="case-fb is-no" role="status"><strong>未中。</strong> ${esc(row.orderNote)}</p>` : ""}
      ${row.hintOpen ? `<p class="case-hint" tabindex="-1">${esc(ch.orderHint || ch.hint)}</p>` : ""}
      ${revealed && ch.kind === "mix" ? `<button type="button" class="btn" data-museum-next-phase="1">去核對那句話</button>` : ""}
      ${revealed && ch.kind === "timeline" ? `<button type="button" class="btn" data-museum-finish="1">完成本章</button>` : ""}`;
  } else if (checking) {
    body = `
      ${ch.claim ? `<blockquote class="case-record"><p>${esc(ch.claim)}</p></blockquote>` : ""}
      ${cardsHtml(ch.cards || ch.slips, row.read)}
      ${optionsHtml(ch, row)}
      <div class="case-actions">
        <button type="button" class="btn ghost" data-museum-hint="1">提示</button>
        ${row.pickOk ? `<button type="button" class="btn" data-museum-finish="1">完成本章</button>` : ""}
      </div>
      ${row.hintOpen ? `<p class="case-hint" tabindex="-1">${esc(ch.hint)}</p>` : ""}`;
  }
  return `
    <p class="case-fiction">${esc(ch.fiction)}</p>
    ${body}
    <div class="case-actions">
      <button type="button" class="btn ghost" data-open-museum="archive">檔案館</button>
    </div>`;
}

function renderHall(user) {
  const museum = readMuseum(user);
  const slots = SLOTS.map((slot) => {
    const done = !!chapterRow(user, slot.after)?.done;
    const color = museum.colors[slot.id] || "";
    const colorName = COLORS.find((item) => item.id === color)?.name || "";
    if (!done) {
      const ch = chapterById(slot.after);
      return `<article class="museum-slot">
        <h3>${esc(slot.title)}</h3>
        <p>完成第${ch?.no || ""}章「${esc(ch?.title || "")}」後，可以自選青、朱、墨。三種都在，沒有抽獎，也沒有限時。</p>
      </article>`;
    }
    const picks = COLORS.map((item) => {
      const on = color === item.id ? " is-on" : "";
      return `<button type="button" class="case-choice${on}" data-museum-color="${esc(slot.id)}:${esc(item.id)}">${esc(item.name)}</button>`;
    }).join("");
    return `<article class="museum-slot is-${esc(color || "plain")}">
      <h3>${esc(slot.title)}</h3>
      <p>${esc(slot.blurb)}</p>
      <p class="muted">你完成的挑戰：${esc(slot.challenge)}</p>
      <p>配色：${colorName ? esc(colorName) : "尚未自選"}。選了就固定顯示，不會隨機換成另一種。</p>
      <div class="case-choices">${picks}</div>
    </article>`;
  }).join("");
  return `
    <p class="case-fiction">這個史館是虛構的個人展廳。展板上的年份與事件按通說，不因配色或故事改寫。</p>
    ${slots}
    <div class="case-actions">
      <button type="button" class="btn ghost" data-open-museum="archive">檔案館</button>
      <button type="button" class="btn ghost" data-museum-leave="1">今日到這裏</button>
    </div>`;
}

function renderArchive(user) {
  const today = letterForDay(letterDay());
  const rows = CHAPTERS.map((ch) => {
    const row = chapterRow(user, ch.id);
    const status = row?.done ? "已完成" : row?.started ? "進行中" : "未開始";
    const label = row?.done ? "重溫" : row?.started ? "繼續" : "補玩";
    const todayMark = today?.chapter.id === ch.id ? "今日來信" : "檔案";
    return `<article class="museum-order">
      <p class="case-tags">${todayMark}｜${esc(status)}</p>
      <h3>第${ch.no}章　${esc(ch.title)}</h3>
      <p>${esc(ch.suspense)}</p>
      <p class="muted">${esc(ch.topic)}｜${esc(ch.minutes)}</p>
      <button type="button" class="btn" data-open-museum="${esc(ch.id)}">${label}</button>
    </article>`;
  }).join("");
  return `
    <p class="muted">五章隨時可玩，不鎖日期。沒有排進來信的日子，不會冒出一封新的每日任務。</p>
    ${rows}
    <button type="button" class="btn ghost" data-open-museum="hall">回史館</button>`;
}

export function renderMuseum(user, screen) {
  const id = screen || "hall";
  const ch = chapterById(id);
  const step = ch ? `第${ch.no}章／共${CHAPTERS.length}章　${ch.title}` : id === "archive" ? "檔案館" : "個人史館";
  const body = ch ? renderPlay(user, ch) : id === "archive" ? renderArchive(user) : renderHall(user);
  return `<section class="panel-paper case-view museum-view" data-museum="${esc(id)}">
    <p class="case-tags">虛構史館故事｜史實不隨劇情改寫</p>
    <h2>${ch ? esc(ch.title) : id === "archive" ? "史館檔案館" : "我的史館"}</h2>
    <p class="museum-step case-step" tabindex="-1">${esc(step)}</p>
    ${body}
  </section>`;
}

export function bindMuseum(user, ctx) {
  const { toast, render, state } = ctx;
  const root = document.querySelector(".museum-view");
  if (!root) return;
  const screen = root.dataset.museum || "hall";
  const ch = chapterById(screen);
  rememberMuseumOpen(user.username, screen);
  if (ch) {
    const existing = chapterRow(user, ch.id);
    if (!existing?.started) {
      const next = readMuseum(user);
      const row = ensureRow(user, ch);
      const fresh = !existing;
      next.chapters = { ...next.chapters, [ch.id]: row };
      if (!saveMuseum(user.username, next)) toast("進度未儲存，這一章可以繼續。");
      if (fresh) logMuseum(user, row, "letter_open", { step: ch.no, itemId: ch.id, taskId: ch.id });
    }
  }

  const commitRow = (row, event, extra) => {
    const next = readMuseum(ctx.getUser?.() || user);
    next.chapters = { ...next.chapters, [ch.id]: row };
    const ok = saveMuseum(user.username, next);
    if (!ok) toast("進度未儲存，這一章可以繼續。");
    if (event) logMuseum(ctx.getUser?.() || user, row, event, extra);
    return ok;
  };

  const focusSel = state.museumFocus || "";
  state.museumFocus = "";
  const paint = (sel) => {
    state.museumFocus = sel || "";
    render();
  };

  root.querySelectorAll("[data-museum-move]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!ch) return;
      const [index, dir] = btn.dataset.museumMove.split(":").map(Number);
      const row = { ...ensureRow(ctx.getUser?.() || user, ch) };
      const order = [...(row.order || [])];
      const to = index + dir;
      if (to < 0 || to >= order.length) return;
      const [item] = order.splice(index, 1);
      order.splice(to, 0, item);
      row.order = order;
      row.orderNote = "";
      commitRow(row, "choice", { step: ch.no, itemId: `move:${item}`, taskId: ch.id });
      paint(`[data-museum-move="${index}:${dir}"]`);
    });
  });

  root.querySelector("[data-museum-check-order]")?.addEventListener("click", () => {
    if (!ch) return;
    const row = { ...ensureRow(ctx.getUser?.() || user, ch) };
    const bad = inversionText(ch, row.order || []);
    row.orderNote = bad;
    commitRow(row, "choice", { step: ch.no, itemId: bad ? "order:no" : "order:ok", ok: !bad, taskId: ch.id });
    paint("[data-museum-check-order]");
  });

  root.querySelector("[data-museum-next-phase]")?.addEventListener("click", () => {
    if (!ch) return;
    const row = { ...ensureRow(ctx.getUser?.() || user, ch), phase: "claim", orderNote: "" };
    commitRow(row, "choice", { step: ch.no, itemId: "phase:claim", taskId: ch.id });
    paint("");
  });

  root.querySelectorAll("[data-museum-read]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!ch) return;
      const id = btn.dataset.museumRead;
      const row = { ...ensureRow(ctx.getUser?.() || user, ch) };
      const read = { ...(row.read || {}) };
      read[id] = !read[id];
      row.read = read;
      commitRow(row, "choice", { step: ch.no, itemId: `read:${id}`, taskId: ch.id });
      paint(`[data-museum-read="${id}"]`);
    });
  });

  root.querySelectorAll("[data-museum-pick]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!ch) return;
      const id = btn.dataset.museumPick;
      const opt = (ch.options || []).find((item) => item.id === id);
      const row = { ...ensureRow(ctx.getUser?.() || user, ch) };
      if (!opt || row.pickOk) return;
      const unread = (opt.needs || []).filter((need) => !row.read?.[need]);
      if (unread.length) {
        toast("先打開要核對的卡片。");
        paint(`[data-museum-read="${unread[0]}"]`);
        return;
      }
      row.pick = id;
      row.pickOk = !!opt.ok;
      commitRow(row, "choice", { step: ch.no, itemId: id, ok: !!opt.ok, taskId: ch.id });
      paint(`[data-museum-pick="${id}"]`);
    });
  });

  root.querySelector("[data-museum-hint]")?.addEventListener("click", () => {
    if (!ch) return;
    const row = { ...ensureRow(ctx.getUser?.() || user, ch), hintOpen: true };
    commitRow(row, "hint", { step: ch.no, itemId: ch.id, taskId: ch.id });
    paint(".case-hint");
  });

  root.querySelector("[data-museum-finish]")?.addEventListener("click", () => {
    if (!ch) return;
    const row = { ...ensureRow(ctx.getUser?.() || user, ch) };
    const first = !row.rewarded;
    row.done = true;
    row.rewarded = true;
    row.started = true;
    if (first) row.freshReward = true;
    const saved = commitRow(row, "complete", { step: ch.no, itemId: ch.id, ok: true, taskId: ch.id });
    if (first && saved) {
      addXp(XP_REWARDS.museumChapter || 8);
      toast(`首次完成這一章，經驗 +${XP_REWARDS.museumChapter || 8}。重玩不會再加。`);
    }
    paint("");
  });

  root.querySelectorAll("[data-museum-color]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [slotId, colorId] = btn.dataset.museumColor.split(":");
      const slot = slotById(slotId);
      if (!slot || !chapterRow(ctx.getUser?.() || user, slot.after)?.done) return;
      if (!COLORS.some((item) => item.id === colorId)) return;
      const next = readMuseum(ctx.getUser?.() || user);
      next.colors = { ...next.colors, [slotId]: colorId };
      if (!saveMuseum(user.username, next)) toast("配色未儲存，可以再選一次。");
      logMuseum(ctx.getUser?.() || user, { attemptId: "" }, "choice", {
        step: 0,
        itemId: `${slotId}:${colorId}`,
        taskId: "museum-color",
      });
      paint(`[data-museum-color="${slotId}:${colorId}"]`);
    });
  });

  root.querySelectorAll("[data-museum-replay]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.museumReplay;
      const target = chapterById(id);
      if (!target) return;
      const prev = chapterRow(ctx.getUser?.() || user, id);
      const next = readMuseum(ctx.getUser?.() || user);
      next.chapters = {
        ...next.chapters,
        [id]: {
          ...ensureRow(user, target),
          started: true,
          done: false,
          rewarded: !!prev?.rewarded,
          freshReward: false,
          attemptId: newId("m"),
          order: [...(target.startOrder || [])],
          phase: target.kind === "mix" ? "order" : "play",
          read: {},
          pick: "",
          pickOk: false,
          orderNote: "",
          hintOpen: false,
        },
      };
      if (!saveMuseum(user.username, next)) toast("進度未儲存，這一章可以繼續。");
      state.museumId = id;
      logMuseum(ctx.getUser?.() || user, next.chapters[id], "letter_open", { step: target.no, itemId: id, taskId: id });
      paint("");
    });
  });

  root.querySelector("[data-museum-leave]")?.addEventListener("click", () => {
    state.view = "home";
    state.museumId = "";
    rememberMuseumOpen(user.username, "");
    render();
  });

  const el = (focusSel && root.querySelector(focusSel)) || root.querySelector(".museum-step");
  if (el) {
    el.focus({ preventScroll: true });
    el.scrollIntoView({ block: focusSel ? "nearest" : "start" });
  }
}
