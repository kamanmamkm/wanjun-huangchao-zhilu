/**
 * 上路：第三人稱自己行。城門、市集、城樓。
 * 史實只重用題庫已有判斷：孔子與秦始皇不同世。
 */
import { addXp, updateUser } from "./storage.js?v=rad114";
import { mountVoyageScene } from "./voyage3d.js?v=rad123";

const XP_ONCE = 8;

const STOPS = [
  {
    name: "城門",
    lines: [
      { who: "", text: "城門開了。路在前面。" },
      { who: "你", text: "我沿這條路走。" },
    ],
  },
  {
    name: "市集",
    lines: [
      { who: "路人", text: "孔子幫秦始皇統一六國。" },
      {
        who: "你",
        text: "你點應？",
        choice: [
          { text: "兩人不同世。", ok: true },
          { text: "孔子做過秦相。", ok: false, miss: "孔子在春秋，始皇在其後。" },
        ],
      },
      { who: "你", text: "識人先識其時。" },
    ],
  },
  {
    name: "城樓",
    lines: [{ who: "", text: "你上了城樓。這一程走完。" }],
  },
];

function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readRow(user) {
  const raw = user?.progress?.voyage;
  const stop = Math.min(STOPS.length - 1, Math.max(0, Number(raw?.stop) || 0));
  const lineMax = STOPS[stop].lines.length - 1;
  return {
    stop,
    line: Math.min(lineMax, Math.max(0, Number(raw?.line) || 0)),
    miss: String(raw?.miss || ""),
    done: !!raw?.done,
    rewarded: !!raw?.rewarded,
  };
}

function writeRow(username, next) {
  try {
    const saved = updateUser((u) => {
      if (String(u.username || "").toUpperCase() !== String(username || "").toUpperCase()) return;
      u.progress = u.progress || {};
      u.progress.voyage = next;
    });
    return !!saved;
  } catch {
    return false;
  }
}

function pathHtml(row) {
  return STOPS.map(
    (s, i) => `<span class="${i === row.stop ? "is-now" : i < row.stop ? "is-past" : ""}">${esc(s.name)}</span>`
  ).join("");
}

function boxHtml(row, pathOpen) {
  const stop = STOPS[row.stop];
  const line = stop.lines[row.line];
  const who = line.who ? `<p class="voyage-who">${esc(line.who)}</p>` : "";
  const last = row.line >= stop.lines.length - 1;
  const endStop = row.stop === STOPS.length - 1;
  let controls = "";
  if (row.done && endStop && last) {
    controls = `<div class="voyage-actions">
      <button type="button" class="voyage-go" data-voyage-replay="1">再走一程</button>
      <button type="button" class="voyage-go" data-voyage-home="1">回到行旅</button>
    </div>`;
  } else if (Array.isArray(line.choice)) {
    controls = `<div class="voyage-choices">${line.choice
      .map(
        (opt, i) =>
          `<button type="button" class="voyage-choice" data-voyage-pick="${i}">${esc(opt.text)}</button>`
      )
      .join("")}</div>${row.miss ? `<p class="voyage-miss">${esc(row.miss)}</p>` : ""}`;
  } else if (last && !endStop && pathOpen) {
    controls = `<p class="voyage-hint">拖左下圓鈕向前，或按鍵盤。</p>`;
  } else if (last && endStop) {
    controls = `<button type="button" class="voyage-go" data-voyage-finish="1">走完</button>`;
  } else {
    controls = `<button type="button" class="voyage-go" data-voyage-next="1">知道了</button>`;
  }
  return `${who}<p class="voyage-line">${esc(line.text || "")}</p>${controls}`;
}

export function renderVoyage() {
  return `<section class="voyage is-loading" id="voyage-root">
    <canvas class="voyage-view" id="voyage-view" aria-hidden="true"></canvas>
    <p class="voyage-load" id="voyage-load">載入中</p>
    <button type="button" class="voyage-back" data-voyage-home="1">返回</button>
    <div class="voyage-path" id="voyage-path" aria-label="這一程"></div>
    <div class="voyage-stick" id="voyage-stick" aria-label="行走">
      <div class="voyage-knob" id="voyage-knob"></div>
    </div>
    <div class="voyage-box" id="voyage-box"></div>
  </section>`;
}

export function bindVoyage(user, ctx) {
  const root = document.getElementById("voyage-root");
  if (!root || root.dataset.bound === "1") return;
  root.dataset.bound = "1";
  const name = String(user?.username || "");
  let pathOpen = false;
  let world = null;

  const fail = () => ctx.toast?.("這一步未寫入。請再試一次。");

  const paint = () => {
    const row = readRow(ctx.getUser?.() || user);
    const path = document.getElementById("voyage-path");
    const box = document.getElementById("voyage-box");
    if (path) path.innerHTML = pathHtml(row);
    if (box) box.innerHTML = boxHtml(row, pathOpen);
  };

  const save = (next) => {
    if (!writeRow(name, next)) {
      fail();
      return false;
    }
    paint();
    return true;
  };

  const finish = (row) => {
    const next = { ...row, done: true, miss: "" };
    let granted = false;
    if (!row.rewarded) {
      const saved = updateUser((u) => {
        if (String(u.username || "").toUpperCase() !== name.toUpperCase()) return;
        u.progress = u.progress || {};
        u.progress.voyage = { ...next, rewarded: true };
      });
      if (!saved) {
        fail();
        return;
      }
      addXp(XP_ONCE);
      granted = true;
    } else if (!writeRow(name, next)) {
      fail();
      return;
    }
    if (granted) ctx.toast?.(`這一程走完。經驗 +${XP_ONCE}`);
    paint();
  };

  const goHome = () => {
    world?.dispose();
    world = null;
    ctx.state.view = "home";
    ctx.render?.();
  };

  paint();
  world = mountVoyageScene({
    canvas: document.getElementById("voyage-view"),
    stick: document.getElementById("voyage-stick"),
    knob: document.getElementById("voyage-knob"),
    gender: user?.gender,
    stop: readRow(user).stop,
    onProgress: (text) => {
      const el = document.getElementById("voyage-load");
      if (el) el.textContent = text;
    },
    onReady: () => {
      root.classList.remove("is-loading");
      const el = document.getElementById("voyage-load");
      if (el) el.hidden = true;
    },
    onFail: () => {
      const el = document.getElementById("voyage-load");
      if (el) el.textContent = "場景載入不到。請返回再試。";
    },
    onArrive: (stop) => {
      const row = readRow(ctx.getUser?.() || user);
      pathOpen = false;
      world?.setOpen(false);
      save({ ...row, stop, line: 0, miss: "", done: false });
    },
  });

  root.addEventListener("click", (e) => {
    const home = e.target.closest("[data-voyage-home]");
    if (home) {
      goHome();
      return;
    }
    const row = readRow(ctx.getUser?.() || user);
    const stop = STOPS[row.stop];
    if (e.target.closest("[data-voyage-next]")) {
      if (row.line < stop.lines.length - 1) {
        save({ ...row, line: row.line + 1, miss: "", done: false });
        return;
      }
      if (row.stop < STOPS.length - 1) {
        pathOpen = true;
        world?.setOpen(true);
        paint();
      }
      return;
    }
    const pick = e.target.closest("[data-voyage-pick]");
    if (pick) {
      const line = stop.lines[row.line];
      const opt = line.choice?.[Number(pick.dataset.voyagePick)];
      if (!opt) return;
      if (!opt.ok) {
        save({ ...row, miss: opt.miss || "再揀一句。" });
        return;
      }
      if (row.line < stop.lines.length - 1) save({ ...row, line: row.line + 1, miss: "" });
      return;
    }
    if (e.target.closest("[data-voyage-finish]")) {
      finish(row);
      return;
    }
    if (e.target.closest("[data-voyage-replay]")) {
      pathOpen = false;
      world?.place(0);
      world?.setOpen(false);
      save({ stop: 0, line: 0, miss: "", done: false, rewarded: row.rewarded });
    }
  });
}
