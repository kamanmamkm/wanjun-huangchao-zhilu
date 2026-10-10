/**
 * 今日機緣連載。進度寫在 progress.flavor.serial，跟現有機緣一齊上雲。
 * 研究紀錄沿用查案的同意開關；未開啟就不寫。
 */
import {
  SERIAL_GOALS,
  SERIAL_CHAPTERS,
  schoolDay,
  serialChapter,
  serialForDay,
  serialGoal,
} from "./data/flavorSerial.js?v=rad98";
import { XP_REWARDS } from "./data/levels.js?v=rad98";
import { isoDay, DAILY_FLAVOR_HITS } from "./data/flavor.js?v=rad83";
import { updateUser, addXp } from "./storage.js?v=rad95";
import { grantNamedRelic } from "./progress.js?v=rad98";
import { logCaseEvent, researchOn } from "./case.js?v=rad95";

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

export function readSerial(user) {
  const raw = user?.progress?.flavor?.serial;
  if (!raw || typeof raw !== "object") return { goalId: "", chapters: {} };
  return { goalId: raw.goalId || "", chapters: { ...(raw.chapters || {}) } };
}

function chapterRow(user, id) {
  return readSerial(user).chapters[id] || null;
}

function blankRow(prev) {
  const ch = serialChapter("c1");
  const route = ch?.routes?.order;
  return {
    started: true,
    done: false,
    rewarded: !!prev?.rewarded,
    freshReward: false,
    route: "",
    phase: "route",
    bins: {},
    binNote: "",
    order: [...(route?.startOrder || [])],
    orderNote: "",
    pick: "",
    pickOk: false,
    hintOpen: false,
    attemptId: prev?.attemptId || newId("fs"),
  };
}

function saveSerial(user, serial, extra) {
  try {
    const saved = updateUser((u) => {
      if (String(u.username || "").toUpperCase() !== String(user.username || "").toUpperCase()) return;
      u.progress = u.progress || {};
      u.progress.flavor = { ...(u.progress.flavor || {}), serial };
      if (extra?.finishToday) {
        u.progress.flavor.day = isoDay();
        u.progress.flavor.hits = DAILY_FLAVOR_HITS;
        u.progress.flavor.good = true;
        u.progress.flavor.reply = extra.reply;
        u.progress.flavor.serialClosed = extra.closedDay || "";
      }
      if (extra?.relic) grantNamedRelic(u, extra.relic);
    });
    return !!saved;
  } catch {
    return false;
  }
}

function logSerial(user, row, event, extra) {
  if (!researchOn(user)) return;
  logCaseEvent(
    user,
    { attemptId: row?.attemptId || "", reason: "", step: extra?.step || 1 },
    { id: extra?.taskId || "flavor-serial", version: "flavor-serial-1" },
    event,
    extra || {}
  );
}

export function serialLeadsFlavor(user, day = schoolDay()) {
  const active = SERIAL_CHAPTERS.find((ch) => {
    const row = chapterRow(user, ch.id);
    return ch.playable && row?.started && !row.done;
  });
  if (active) return active;
  const today = serialForDay(day);
  if (today && !chapterRow(user, today.id)?.done) return today;
  return null;
}

export function serialHookDetail(user) {
  const lead = serialLeadsFlavor(user);
  if (!lead) return "";
  const row = chapterRow(user, lead.id);
  if (row?.phase === "end") return "第一章已完成";
  return "連載未完，約4分鐘";
}

export function serialGoalChip(user) {
  const goal = serialGoal(readSerial(user).goalId);
  if (!goal) return "";
  const owned = (user.progress?.relics || []).some((r) => r.id === goal.id);
  if (owned) return "";
  return `<span class="relic-stamp is-goal" title="${esc(goal.hint)}">目標：${esc(goal.name)}</span>`;
}

function shell(inner) {
  return `<div class="flavor-card open flavor-serial">${inner}</div>`;
}

function goalHtml() {
  const buttons = SERIAL_GOALS.map(
    (goal) =>
      `<button type="button" class="option" data-serial-goal="${esc(goal.id)}">${esc(goal.name)}：${esc(goal.hint)}</button>`
  ).join("");
  return shell(`
    <p class="eyebrow">今日機緣 · 連載第一章 · 約4分鐘</p>
    <p>有人把分封和郡縣叠成同一件事。先選定一件想留下的信物，再選一條路線。</p>
    <p class="muted">三件都在這裡，沒有抽獎。選了就作為收藏目標，首次完成才收入信物。重玩不會再發一次。</p>
    <div class="options">${buttons}</div>`);
}

function routeHtml(user, ch) {
  const goal = serialGoal(readSerial(user).goalId);
  const change = chapterRow(user, ch.id)?.rewarded
    ? ""
    : `<button type="button" class="option" data-serial-goal-reset="1">改收藏目標</button>`;
  return shell(`
    <p class="eyebrow">今日機緣 · 第一章 · ${esc(ch.minutes)}</p>
    <h3>${esc(ch.title)}</h3>
    <p>${esc(ch.suspense)}</p>
    <p class="muted">${esc(ch.fiction)}</p>
    <p class="muted">收藏目標：${esc(goal?.name || "未選")}。兩條路線的線索不同，史實結論相同。</p>
    <div class="options">
      <button type="button" class="option" data-serial-route="compare">${esc(ch.routes.compare.name)}。${esc(ch.routes.compare.blurb)}</button>
      <button type="button" class="option" data-serial-route="order">${esc(ch.routes.order.name)}。${esc(ch.routes.order.blurb)}</button>
      ${change}
    </div>`);
}

function compareHtml(ch, row) {
  const route = ch.routes.compare;
  const bins = row.bins || {};
  const ready = route.cards.every((card) => bins[card.id] === card.bin);
  const cards = route.cards
    .map((card) => {
      const placed = bins[card.id] === card.bin;
      const actions = route.trays
        .map(
          (tray) =>
            `<button type="button" class="option" data-serial-bin="${esc(card.id)}:${esc(tray.id)}">歸入${esc(tray.name)}</button>`
        )
        .join("");
      return `<article class="serial-row">
        <p><strong>${esc(card.title)}</strong> ${esc(card.text)}</p>
        <p class="muted">${esc(card.source)}</p>
        ${placed ? `<p class="serial-ok">已歸入正確的一格。</p>` : `<div class="options">${actions}</div>`}
      </article>`;
    })
    .join("");
  const slips = ready
    ? `<p>${esc(route.evidencePrompt)}</p>
      <div class="options">${route.slips
        .map(
          (slip) =>
            `<button type="button" class="option${row.pick === slip.id ? " is-on" : ""}" data-serial-pin="${esc(slip.id)}">${esc(slip.text)}</button>`
        )
        .join("")}</div>
      ${feedback(route.slips, row)}`
    : `<p class="muted">兩張卡都歸對之後，才釘證據。</p>`;
  return shell(`
    <p class="eyebrow">路線甲 · 比較資料，再選證據</p>
    <p class="muted">${esc(ch.fiction)}</p>
    ${cards}
    ${row.binNote ? `<p class="serial-no">${esc(row.binNote)}</p>` : ""}
    ${slips}
    <div class="options">
      <button type="button" class="option" data-serial-hint="1">提示</button>
      ${row.pickOk ? `<button type="button" class="option" data-serial-finish="c1">完成本章</button>` : ""}
      <button type="button" class="option" data-serial-back="1">返回選路線</button>
    </div>
    ${row.hintOpen ? `<p class="serial-hint">${esc(route.hint)}</p>` : ""}`);
}

function feedback(list, row) {
  if (!row.pick) return "";
  const item = (list || []).find((slip) => slip.id === row.pick);
  if (!item) return "";
  return `<p class="${item.ok ? "serial-ok" : "serial-no"}"><strong>${item.ok ? "答對。" : "未中。"}</strong> ${esc(item.feedback)}</p>`;
}

function inversion(route, order) {
  const pos = new Map(order.map((id, index) => [id, index]));
  const items = new Map(route.items.map((item) => [item.id, item]));
  for (let i = 0; i < route.answer.length - 1; i += 1) {
    const left = route.answer[i];
    const right = route.answer[i + 1];
    if (pos.get(left) > pos.get(right)) {
      return `「${items.get(left)?.text || ""}」仍排在「${items.get(right)?.text || ""}」後面。年份先不揭開。`;
    }
  }
  return "";
}

function orderHtml(ch, row) {
  const route = ch.routes.order;
  const items = new Map(route.items.map((item) => [item.id, item]));
  const revealed = (row.order || []).join() === route.answer.join();
  const rows = (row.order || [])
    .map((id, index) => {
      const item = items.get(id);
      const up = index > 0 ? `<button type="button" class="option" data-serial-move="${index}:-1">上移</button>` : "";
      const down = index < row.order.length - 1 ? `<button type="button" class="option" data-serial-move="${index}:1">下移</button>` : "";
      const year = revealed ? `<p class="muted">${esc(item?.year || "")}</p><p class="muted">${esc(item?.source || "")}</p>` : "";
      return `<article class="serial-row"><p><strong>${index + 1}.</strong> ${esc(item?.text || "")}</p>${year}<div class="options">${up}${down}</div></article>`;
    })
    .join("");
  const claim = revealed
    ? `<blockquote><p>${esc(route.claim)}</p></blockquote>
      <p>${esc(route.claimPrompt)}</p>
      <div class="options">${route.options
        .map(
          (opt) =>
            `<button type="button" class="option${row.pick === opt.id ? " is-on" : ""}" data-serial-pin="${esc(opt.id)}">${esc(opt.text)}</button>`
        )
        .join("")}</div>
      ${feedback(route.options, row)}`
    : "";
  return shell(`
    <p class="eyebrow">路線乙 · 整理時序，再改批註</p>
    <p class="muted">${esc(ch.fiction)}</p>
    ${rows}
    <div class="options">
      <button type="button" class="option" data-serial-check="1">${revealed ? "次序已對" : "對次序"}</button>
      <button type="button" class="option" data-serial-hint="1">提示</button>
      ${row.pickOk ? `<button type="button" class="option" data-serial-finish="c1">完成本章</button>` : ""}
      <button type="button" class="option" data-serial-back="1">返回選路線</button>
    </div>
    ${row.orderNote ? `<p class="serial-no">${esc(row.orderNote)}</p>` : ""}
    ${row.hintOpen ? `<p class="serial-hint">${esc(route.hint)}</p>` : ""}
    ${claim}`);
}

function endHtml(user, ch, row) {
  const goal = serialGoal(readSerial(user).goalId);
  const owned = goal && (user.progress?.relics || []).some((r) => r.id === goal.id);
  const change = row.freshReward && owned
    ? `信物「${goal.name}」已收入史冊。${goal.hint}`
    : owned
      ? `信物「${goal?.name || ""}」先前已收入。今次不再發。`
      : "這次沒有新信物。";
  const xp = row.freshReward ? "首次完成的經驗已經入帳。" : "首次經驗先前已入帳，今次不再加。";
  return shell(`
    <p class="eyebrow">第一章完</p>
    <p><strong>學到：</strong>${esc(ch.learned)}</p>
    <p><strong>收藏：</strong>${esc(change)}</p>
    <p class="muted">${esc(xp)} 另一條路線的線索不同，重看不加首次獎勵。第二至五章仍是大綱，今日不會假裝它們已經開始。</p>
    <div class="options">
      <button type="button" class="option" data-serial-leave="1">今日到這裏</button>
      <button type="button" class="option" data-serial-other="c1">睇另一條路線</button>
    </div>`);
}

export function renderFlavorSerial(user, day = schoolDay()) {
  const lead = serialLeadsFlavor(user, day);
  if (!lead) return "";
  const serial = readSerial(user);
  const row = chapterRow(user, lead.id);
  if (row?.phase === "end") return endHtml(user, lead, row);
  if (!serial.goalId) return goalHtml();
  if (!row?.route) return routeHtml(user, lead);
  if (row.route === "compare") return compareHtml(lead, row);
  if (row.route === "order") return orderHtml(lead, row);
  return routeHtml(user, lead);
}

export function renderSerialAside(user, day = schoolDay()) {
  if (serialLeadsFlavor(user, day)) return "";
  const today = serialForDay(day);
  if (today && chapterRow(user, today.id)?.done) return "";
  if (today) return "";
  const pending = SERIAL_CHAPTERS.find((ch) => ch.playable && !chapterRow(user, ch.id)?.done);
  const done = SERIAL_CHAPTERS.find((ch) => ch.playable && chapterRow(user, ch.id)?.done);
  const action = pending
    ? `<button type="button" class="option" data-serial-catchup="${esc(pending.id)}">補玩第${pending.no}章</button>
       <p class="muted">漏玩沒有扣分，也沒有限時獎。這不是新的每日事件。</p>`
    : done
      ? `<button type="button" class="option" data-serial-other="${esc(done.id)}">重看第${done.no}章</button>
         <p class="muted">重看不加首次經驗，信物也不會再發一次。</p>`
      : "";
  return `<div class="flavor-card serial-aside">
    <p class="eyebrow">今日沒有新連載</p>
    ${action}
  </div>`;
}

function commit(ctx, user, serial, row, event, extra, finish) {
  const next = { ...serial, chapters: { ...serial.chapters, [row.id]: row } };
  const payload = { ...row };
  delete payload.id;
  const saved = saveSerial(user, { goalId: next.goalId, chapters: next.chapters }, finish);
  if (!saved) ctx.toast?.("進度未儲存，這一章可以繼續。");
  if (event) logSerial(ctx.getUser?.() || user, row, event, extra);
  return saved;
}

export function bindFlavorSerial(user, ctx) {
  const { render } = ctx;
  const paint = () => render();
  const current = () => ctx.getUser?.() || user;

  document.querySelectorAll("[data-serial-goal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const fresh = current();
      const goal = serialGoal(btn.dataset.serialGoal);
      if (!goal) return;
      const serial = readSerial(fresh);
      if (chapterRow(fresh, "c1")?.rewarded) return;
      serial.goalId = goal.id;
      const row = { ...blankRow(chapterRow(fresh, "c1")), id: "c1", phase: "route", route: "" };
      commit(ctx, fresh, serial, row, "choice", { step: 1, itemId: goal.id, taskId: "c1" });
      paint();
    });
  });

  document.querySelector("[data-serial-goal-reset]")?.addEventListener("click", () => {
    const fresh = current();
    if (chapterRow(fresh, "c1")?.rewarded) return;
    const serial = readSerial(fresh);
    serial.goalId = "";
    saveSerial(fresh, serial);
    paint();
  });

  document.querySelectorAll("[data-serial-route]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const fresh = current();
      const serial = readSerial(fresh);
      const prev = chapterRow(fresh, "c1");
      const row = { ...blankRow(prev), ...prev, id: "c1", route: btn.dataset.serialRoute, phase: "play", pick: "", pickOk: false, binNote: "", orderNote: "", hintOpen: false };
      if (row.route === "order") row.order = [...(serialChapter("c1")?.routes.order.startOrder || [])];
      if (row.route === "compare") row.bins = {};
      commit(ctx, fresh, serial, row, "choice", { step: 1, itemId: `route:${row.route}`, taskId: "c1" });
      paint();
    });
  });

  document.querySelectorAll("[data-serial-bin]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const fresh = current();
      const ch = serialChapter("c1");
      const [cardId, trayId] = btn.dataset.serialBin.split(":");
      const card = ch.routes.compare.cards.find((item) => item.id === cardId);
      if (!card) return;
      const serial = readSerial(fresh);
      const row = { ...(chapterRow(fresh, "c1") || blankRow()), id: "c1" };
      row.bins = { ...(row.bins || {}) };
      if (card.bin === trayId) {
        row.bins[cardId] = trayId;
        row.binNote = "";
      } else {
        row.binNote = card.wrong;
      }
      commit(ctx, fresh, serial, row, "choice", { step: 2, itemId: `${cardId}:${trayId}`, ok: card.bin === trayId, taskId: "c1" });
      paint();
    });
  });

  document.querySelectorAll("[data-serial-move]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const fresh = current();
      const [index, dir] = btn.dataset.serialMove.split(":").map(Number);
      const serial = readSerial(fresh);
      const row = { ...(chapterRow(fresh, "c1") || blankRow()), id: "c1" };
      const order = [...(row.order || [])];
      const to = index + dir;
      if (to < 0 || to >= order.length) return;
      const [item] = order.splice(index, 1);
      order.splice(to, 0, item);
      row.order = order;
      row.orderNote = "";
      commit(ctx, fresh, serial, row, "choice", { step: 2, itemId: `move:${item}`, taskId: "c1" });
      paint();
    });
  });

  document.querySelector("[data-serial-check]")?.addEventListener("click", () => {
    const fresh = current();
    const ch = serialChapter("c1");
    const serial = readSerial(fresh);
    const row = { ...(chapterRow(fresh, "c1") || blankRow()), id: "c1" };
    row.orderNote = inversion(ch.routes.order, row.order || []);
    commit(ctx, fresh, serial, row, "choice", { step: 2, itemId: row.orderNote ? "order:no" : "order:ok", ok: !row.orderNote, taskId: "c1" });
    paint();
  });

  document.querySelectorAll("[data-serial-pin]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const fresh = current();
      const ch = serialChapter("c1");
      const serial = readSerial(fresh);
      const row = { ...(chapterRow(fresh, "c1") || blankRow()), id: "c1" };
      if (row.pickOk) return;
      const list = row.route === "order" ? ch.routes.order.options : ch.routes.compare.slips;
      if (row.route === "compare") {
        const ready = ch.routes.compare.cards.every((card) => row.bins?.[card.id] === card.bin);
        if (!ready) {
          ctx.toast?.("先把兩張卡歸位。");
          return;
        }
      }
      if (row.route === "order" && (row.order || []).join() !== ch.routes.order.answer.join()) {
        ctx.toast?.("先把次序排對。");
        return;
      }
      const opt = list.find((item) => item.id === btn.dataset.serialPin);
      if (!opt) return;
      row.pick = opt.id;
      row.pickOk = !!opt.ok;
      commit(ctx, fresh, serial, row, "choice", { step: 3, itemId: opt.id, ok: !!opt.ok, taskId: "c1" });
      paint();
    });
  });

  document.querySelector("[data-serial-hint]")?.addEventListener("click", () => {
    const fresh = current();
    const serial = readSerial(fresh);
    const row = { ...(chapterRow(fresh, "c1") || blankRow()), id: "c1", hintOpen: true };
    commit(ctx, fresh, serial, row, "hint", { step: 2, itemId: "c1", taskId: "c1" });
    paint();
  });

  document.querySelector("[data-serial-finish]")?.addEventListener("click", () => {
    const fresh = current();
    const ch = serialChapter("c1");
    const serial = readSerial(fresh);
    const row = { ...(chapterRow(fresh, "c1") || blankRow()), id: "c1" };
    if (!row.pickOk) return;
    const first = !row.rewarded;
    row.phase = "end";
    row.done = false;
    row.rewarded = true;
    row.started = true;
    if (first) row.freshReward = true;
    const goal = serialGoal(serial.goalId);
    const today = serialForDay(schoolDay());
    const reply = `${ch.learned} 收藏：${goal ? goal.name : "未選信物"}。`;
    const saved = commit(ctx, fresh, serial, row, "complete", { step: 4, itemId: row.route, ok: true, taskId: "c1" }, {
      relic: first ? goal : null,
      finishToday: !!(first && today?.id === ch.id),
      closedDay: schoolDay(),
      reply,
    });
    if (first && saved) {
      addXp(XP_REWARDS.flavorSerial || 8);
      ctx.toast?.(`首次完成，經驗 +${XP_REWARDS.flavorSerial || 8}。信物已收入。重玩不會再發。`);
    }
    paint();
  });

  document.querySelectorAll("[data-serial-other]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const fresh = current();
      const serial = readSerial(fresh);
      const prev = chapterRow(fresh, btn.dataset.serialOther || "c1");
      const row = { ...blankRow(prev), id: "c1", rewarded: !!prev?.rewarded, freshReward: false, attemptId: newId("fs") };
      commit(ctx, fresh, serial, row, "choice", { step: 1, itemId: "replay", taskId: "c1" });
      paint();
    });
  });

  document.querySelectorAll("[data-serial-catchup]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const fresh = current();
      const serial = readSerial(fresh);
      const prev = chapterRow(fresh, btn.dataset.serialCatchup || "c1");
      const row = { ...blankRow(prev), id: "c1", rewarded: !!prev?.rewarded };
      if (!serial.goalId) serial.goalId = "";
      commit(ctx, fresh, serial, row, "choice", { step: 1, itemId: "catchup", taskId: "c1" });
      paint();
    });
  });

  document.querySelector("[data-serial-back]")?.addEventListener("click", () => {
    const fresh = current();
    const serial = readSerial(fresh);
    const row = { ...(chapterRow(fresh, "c1") || blankRow()), id: "c1", route: "", phase: "route", pick: "", pickOk: false };
    commit(ctx, fresh, serial, row, "choice", { step: 1, itemId: "back", taskId: "c1" });
    paint();
  });

  document.querySelector("[data-serial-leave]")?.addEventListener("click", () => {
    const fresh = current();
    const serial = readSerial(fresh);
    const row = { ...(chapterRow(fresh, "c1") || blankRow()), id: "c1", done: true, phase: "done" };
    commit(ctx, fresh, serial, row, "choice", { step: 4, itemId: "leave", taskId: "c1" });
    paint();
  });
}
