/**
 * 上路：全屏場景、角色、底部對話。三站向前，唔係試卷。
 * 史實只重用題庫已有判斷：孔子與秦始皇不同世。
 */
import { getStageArt } from "./data/stageVisuals.js?v=rad50";
import { addXp, updateUser } from "./storage.js?v=rad114";

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

function beat(row) {
  const stop = STOPS[row.stop];
  return { stop, line: stop.lines[row.line] };
}

export function renderVoyage(user, identityId) {
  const row = readRow(user);
  const art = getStageArt(identityId, user?.gender);
  const { stop, line } = beat(row);
  const who = line.who === "你" ? "你" : line.who;
  const path = STOPS.map(
    (s, i) => `<span class="${i === row.stop ? "is-now" : i < row.stop ? "is-past" : ""}">${esc(s.name)}</span>`
  ).join("");
  const choices = Array.isArray(line.choice)
    ? `<div class="voyage-choices">${line.choice
        .map(
          (opt, i) =>
            `<button type="button" class="voyage-choice" data-voyage-pick="${i}">${esc(opt.text)}</button>`
        )
        .join("")}</div>${row.miss ? `<p class="voyage-miss">${esc(row.miss)}</p>` : ""}`
    : row.done && row.stop === STOPS.length - 1 && row.line === stop.lines.length - 1
      ? `<div class="voyage-actions">
          <button type="button" class="voyage-go" data-voyage-replay="1">再走一程</button>
          <button type="button" class="voyage-go" data-voyage-home="1">回到行旅</button>
        </div>`
      : `<button type="button" class="voyage-go" data-voyage-next="1">${
          row.stop === STOPS.length - 1 && row.line === stop.lines.length - 1 ? "走完" : "前行"
        }</button>`;
  const figure = art
    ? `<img class="voyage-hero" src="${art.src}?v=rad79" alt="" />`
    : "";
  return `<section class="voyage" data-stop="${row.stop}" id="voyage-root">
    <div class="voyage-sky" aria-hidden="true"></div>
    <div class="voyage-hills" aria-hidden="true"></div>
    <div class="voyage-ground" aria-hidden="true"></div>
    ${figure}
    <button type="button" class="voyage-back" data-voyage-home="1">返回</button>
    <div class="voyage-path" aria-label="這一程">${path}</div>
    <div class="voyage-box">
      ${who ? `<p class="voyage-who">${esc(who)}</p>` : ""}
      <p class="voyage-line">${esc(line.text || "")}</p>
      ${choices}
    </div>
  </section>`;
}

export function bindVoyage(user, ctx) {
  const root = document.getElementById("voyage-root");
  if (!root || root.dataset.bound === "1") return;
  root.dataset.bound = "1";
  const name = String(user?.username || "");

  const fail = () => ctx.toast?.("這一步未寫入。請再試一次。");

  const save = (next) => {
    if (!writeRow(name, next)) {
      fail();
      return;
    }
    ctx.render?.();
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
    ctx.render?.();
  };

  root.querySelector("[data-voyage-next]")?.addEventListener("click", () => {
    const row = readRow(ctx.getUser?.() || user);
    const { stop } = beat(row);
    if (row.line < stop.lines.length - 1) {
      save({ ...row, line: row.line + 1, miss: "", done: false });
      return;
    }
    if (row.stop < STOPS.length - 1) {
      save({ ...row, stop: row.stop + 1, line: 0, miss: "", done: false });
      return;
    }
    finish(row);
  });

  root.querySelectorAll("[data-voyage-pick]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = readRow(ctx.getUser?.() || user);
      const { line } = beat(row);
      const opt = line.choice?.[Number(btn.dataset.voyagePick)];
      if (!opt) return;
      if (!opt.ok) {
        save({ ...row, miss: opt.miss || "再揀一句。" });
        return;
      }
      const stop = STOPS[row.stop];
      if (row.line < stop.lines.length - 1) {
        save({ ...row, line: row.line + 1, miss: "" });
      }
    });
  });

  root.querySelector("[data-voyage-replay]")?.addEventListener("click", () => {
    const row = readRow(ctx.getUser?.() || user);
    save({ stop: 0, line: 0, miss: "", done: false, rewarded: row.rewarded });
  });

  root.querySelectorAll("[data-voyage-home]").forEach((btn) => {
    btn.addEventListener("click", () => {
      ctx.state.view = "home";
      ctx.render?.();
    });
  });
}
