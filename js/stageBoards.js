/**
 * 長卷互動關：配對沿用機緣連線題池；其餘係章內輕量板。
 * 完成時由 journey 寫入原本的 completeStage／XP，唔經單元闖關。
 */
import { WORDWALL_ROUNDS } from "./data/games.js?v=rad176";

const BOARD_GAMES = ["pair", "cause", "ledger", "confront", "route", "verdict"];

export function isBoardGame(game) {
  return BOARD_GAMES.includes(game);
}

export const BOARD_COPY = {
  pair: {
    how: "左邊係名稱，右邊係意思，各撳一張配成一對。<strong>本局全部配對</strong>即完成本關，會自動記入長卷。",
    start: "開始配對",
    again: "再配一局",
    done: "本關已完成——你已配對過一局。",
  },
  cause: {
    how: "先看結果，再揀講得較穩的原因。時代錯置，或把後果收成一件事，就要重揀。<strong>{n} 條都揀中</strong>即完成本關，會自動記入長卷。",
    start: "開始連因果",
    again: "再連一次",
    done: "本關已完成——你已把因果連過。",
  },
  ledger: {
    how: "揀一項措施，先打開成效同代價。只寫一邊的不能採納。<strong>{n} 策都採納得對</strong>即完成本關，會自動記入長卷。",
    start: "開始看賬",
    again: "再看一次",
    done: "本關已完成——你已對過成效同代價。",
  },
  confront: {
    how: "兩則材料並排。判斷下面那句有沒有超出材料所講的範圍。<strong>{n} 則都判斷正確</strong>即完成本關，會自動記入長卷。",
    start: "開始對質",
    again: "再對一次",
    done: "本關已完成——你已對過材料。",
  },
  route: {
    how: "看這次使命，揀下一站。走錯可以重揀。<strong>{n} 條路都揀中</strong>即完成本關，會自動記入長卷。",
    start: "開始擇路",
    again: "再走一次",
    done: "本關已完成——你已揀過路線。",
  },
  verdict: {
    how: "朝會有時限。揀一句同時顧到兩邊的決定；時辰過了可以再議，唔會鎖死這關。<strong>{n} 道都揀中</strong>即完成本關，會自動記入長卷。",
    start: "入朝議",
    again: "再議一次",
    done: "本關已完成——你已做過朝議。",
  },
};

export function interactCopy(stage) {
  const baked = BOARD_COPY[stage?.gotoGame];
  if (!baked) return null;
  const n = stage.gotoGame === "pair" ? stage.pairPick || 4 : (stage.rounds || []).length;
  return { ...baked, how: baked.how.replaceAll("{n}", String(n || 0)) };
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function roundsReady(rounds) {
  return (
    rounds.length > 0 &&
    rounds.every((round) => (round.options || []).filter((opt) => opt.ok).length === 1)
  );
}

export function createBoardPlay(stage, ids = {}) {
  const base = {
    cid: ids.cid,
    sid: ids.sid,
    title: ids.title || stage?.title || "",
    game: stage?.gotoGame,
    misses: 0,
    note: "",
    won: false,
    error: "",
  };
  if (stage?.gotoGame === "pair") {
    const round = WORDWALL_ROUNDS.find((item) => item.id === stage.pairRoundId);
    const pool = round?.pairs || [];
    const n = Math.min(stage.pairPick || round?.pick || 4, pool.length);
    if (!n) {
      return { ...base, total: 0, error: "這一關暫時沒有可配的牌。" };
    }
    const chosen = shuffle(pool).slice(0, n);
    return {
      ...base,
      roundId: round.id,
      total: n,
      left: shuffle(chosen.map((pair, i) => ({ pair: i, text: pair.a }))),
      right: shuffle(chosen.map((pair, i) => ({ pair: i, text: pair.b, note: pair.note || "" }))),
      matched: [],
      pickL: null,
      pickR: null,
      missL: null,
      missR: null,
      lock: false,
    };
  }
  const rounds = stage?.rounds || [];
  if (!roundsReady(rounds)) {
    return { ...base, total: 0, error: "這一關的題目還未備好。" };
  }
  const seconds = Math.max(15, Number(stage.seconds) || 45);
  return {
    ...base,
    index: 0,
    total: rounds.length,
    picked: null,
    expired: false,
    seconds,
    deadline: stage.gotoGame === "verdict" ? Date.now() + seconds * 1000 : 0,
  };
}

export function clearBoardTimer(play) {
  if (!play) return;
  if (play._timer) {
    clearInterval(play._timer);
    play._timer = 0;
  }
  if (play._wait) {
    clearTimeout(play._wait);
    play._wait = 0;
  }
}

function optionButtons(options, picked) {
  return (options || [])
    .map((opt, i) => {
      const on = picked === i ? " selected" : "";
      const body = opt.place
        ? `<strong>${esc(opt.place)}</strong><span>${esc(opt.detail || opt.text || "")}</span>`
        : esc(opt.text);
      return `<button type="button" class="option board-choice${on}" data-board-pick="${i}">${body}</button>`;
    })
    .join("");
}

function renderPair(play) {
  const col = (side, items, pick, miss) =>
    items
      .map((card, i) => {
        const ok = play.matched.includes(card.pair);
        const picked = pick === i;
        const bad = miss === i;
        return `<button type="button" class="match-item side-${side}${picked ? " selected" : ""}${ok ? " done" : ""}${bad ? " is-miss" : ""}" data-board-${side}="${i}" ${ok ? "disabled" : ""}>${esc(card.text)}</button>`;
      })
      .join("");
  return `
    <p class="lead">左邊名稱、右邊意思。已配 ${play.matched.length}／${play.total}。</p>
    <div class="match-board">
      <div class="match-col">${col("l", play.left, play.pickL, play.missL)}</div>
      <div class="match-col">${col("r", play.right, play.pickR, play.missR)}</div>
    </div>
    <p class="flip-note">${esc(play.note || "左右各揀一張。")}</p>`;
}

function renderCause(stage, play) {
  const round = stage.rounds[play.index];
  return `
    <p class="muted">第 ${play.index + 1}／${play.total}</p>
    <article class="cause-result"><span>結果</span><p>${esc(round.result)}</p></article>
    <p class="lead">${esc(round.prompt || "哪一個原因講得較穩？")}</p>
    <div class="options">${optionButtons(round.options, play.picked)}</div>
    <p class="feedback ${play.note ? "" : "hidden"}">${esc(play.note)}</p>`;
}

function renderLedger(stage, play) {
  const round = stage.rounds[play.index];
  const opt = play.picked == null ? null : round.options[play.picked];
  return `
    <p class="muted">第 ${play.index + 1}／${play.total} 策</p>
    <article class="cause-result"><span>局面</span><p>${esc(round.situation)}</p></article>
    <div class="options">${optionButtons(round.options, play.picked)}</div>
    ${
      opt
        ? `<div class="policy-sheet">
            <div class="policy-col"><span>成效</span><p>${esc(opt.effect)}</p></div>
            <div class="policy-col"><span>代價</span><p>${esc(opt.cost)}</p></div>
          </div>
          <button type="button" class="btn" data-board-accept="1">${opt.ok ? "採納此策" : "這份賬不能採納"}</button>`
        : `<p class="muted">先揀一項，賬頁先打開。</p>`
    }
    <p class="feedback ${play.note ? "" : "hidden"}">${esc(play.note)}</p>`;
}

function renderConfront(stage, play) {
  const round = stage.rounds[play.index];
  return `
    <p class="muted">第 ${play.index + 1}／${play.total} 則</p>
    <div class="confront-docs">
      <article><span>${esc(round.left?.tag || "材料甲")}</span><p>${esc(round.left?.text)}</p></article>
      <article><span>${esc(round.right?.tag || "材料乙")}</span><p>${esc(round.right?.text)}</p></article>
    </div>
    <p class="confront-claim"><span>有人寫成</span>${esc(round.claim)}</p>
    <div class="options">${optionButtons(round.options, play.picked)}</div>
    <p class="feedback ${play.note ? "" : "hidden"}">${esc(play.note)}</p>`;
}

function renderRoute(stage, play) {
  const round = stage.rounds[play.index];
  return `
    <p class="muted">第 ${play.index + 1}／${play.total} 程</p>
    <article class="cause-result"><span>使命</span><p>${esc(round.mission)}</p></article>
    <p class="route-from">由「${esc(round.from)}」出發，下一站？</p>
    <div class="route-forks options">${optionButtons(round.options, play.picked)}</div>
    <p class="feedback ${play.note ? "" : "hidden"}">${esc(play.note)}</p>`;
}

function renderVerdict(stage, play) {
  const round = stage.rounds[play.index];
  const totalMs = play.seconds * 1000;
  const left = play.expired ? 0 : Math.max(0, play.deadline - Date.now());
  const width = Math.round((left / totalMs) * 100);
  return `
    <p class="muted">第 ${play.index + 1}／${play.total} 道</p>
    <div class="boss-progress" aria-hidden="true"><i id="verdict-bar" style="width:${width}%"></i></div>
    <p class="verdict-remain" id="verdict-remain">${play.expired ? "時辰已過" : `尚餘 ${Math.ceil(left / 1000)} 秒`}</p>
    <article class="cause-result"><span>朝議</span><p>${esc(round.prompt)}</p></article>
    ${
      play.expired
        ? `<p class="feedback">${esc(play.note || "時辰已過。可以再議一次。")}</p>
           <button type="button" class="btn" data-board-retime="1">再議一次</button>`
        : `<div class="options">${optionButtons(round.options, play.picked)}</div>
           <p class="feedback ${play.note ? "" : "hidden"}">${esc(play.note)}</p>`
    }`;
}

export function renderBoard(stage, play) {
  if (!play || play.error) return `<p>${esc(play?.error || "這一關暫時開唔到。")}</p>`;
  if (play.game === "pair") return renderPair(play);
  if (play.game === "cause") return renderCause(stage, play);
  if (play.game === "ledger") return renderLedger(stage, play);
  if (play.game === "confront") return renderConfront(stage, play);
  if (play.game === "route") return renderRoute(stage, play);
  if (play.game === "verdict") return renderVerdict(stage, play);
  return `<p>未知的互動。</p>`;
}

function reduceMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
}

function passRound(play, stage, hooks) {
  const rounds = stage.rounds || [];
  const round = rounds[play.index];
  const chosen = round?.options?.[play.picked];
  if (chosen?.note) hooks.toast?.(chosen.note);
  hooks.onHit?.({
    qText: round?.result || round?.situation || round?.claim || round?.mission || round?.prompt || play.title,
    index: play.index,
  });
  if (play.index + 1 >= rounds.length) {
    play.won = true;
    hooks.onClear?.();
    return;
  }
  play.index += 1;
  play.picked = null;
  play.note = "";
  play.expired = false;
  play.locked = false;
  if (play.game === "verdict") play.deadline = Date.now() + play.seconds * 1000;
  hooks.render?.();
}

function missRound(play, note, hooks, qText) {
  play.misses += 1;
  play.note = note;
  play.picked = null;
  hooks.onMiss?.({ qText: qText || note, index: play.index });
  hooks.render?.();
}

export function bindBoard(play, stage, hooks) {
  clearBoardTimer(play);
  document.querySelector("[data-board-back]")?.addEventListener("click", () => {
    clearBoardTimer(play);
    hooks.onBack?.();
  });
  if (!play || play.error || play.won || !stage) return;

  if (play.game === "pair") {
    const pick = (side, idx) => {
      if (play.lock || play.won) return;
      const list = side === "l" ? play.left : play.right;
      const card = list[idx];
      if (!card || play.matched.includes(card.pair)) return;
      if (side === "l") play.pickL = play.pickL === idx ? null : idx;
      else play.pickR = play.pickR === idx ? null : idx;
      play.missL = null;
      play.missR = null;
      if (play.pickL == null || play.pickR == null) {
        hooks.render?.();
        return;
      }
      const left = play.left[play.pickL];
      const right = play.right[play.pickR];
      if (left.pair === right.pair) {
        play.matched.push(left.pair);
        play.note = right.note || "配對正確。";
        play.pickL = null;
        play.pickR = null;
        hooks.toast?.(play.note);
        if (play.matched.length === play.total) {
          play.won = true;
          hooks.onClear?.();
          return;
        }
        hooks.render?.();
        return;
      }
      play.lock = true;
      play.misses += 1;
      play.missL = play.pickL;
      play.missR = play.pickR;
      play.note = "唔係一對，再試。";
      hooks.onMiss?.({ qText: `${left.text}／${right.text}` });
      hooks.render?.();
      const wait = reduceMotion() ? 0 : 480;
      play._wait = setTimeout(() => {
        play._wait = 0;
        if (play.won || !hooks.isCurrent?.()) return;
        play.pickL = null;
        play.pickR = null;
        play.missL = null;
        play.missR = null;
        play.lock = false;
        hooks.render?.();
      }, wait);
    };
    document.querySelectorAll("[data-board-l]").forEach((btn) => {
      btn.addEventListener("click", () => pick("l", Number(btn.dataset.boardL)));
    });
    document.querySelectorAll("[data-board-r]").forEach((btn) => {
      btn.addEventListener("click", () => pick("r", Number(btn.dataset.boardR)));
    });
    return;
  }

  if (play.game === "verdict" && !play.expired) {
    const id = setInterval(() => {
      if (play._timer !== id || !hooks.isCurrent?.()) return;
      const remain = document.getElementById("verdict-remain");
      const bar = document.getElementById("verdict-bar");
      if (!remain || !bar) return;
      const left = play.deadline - Date.now();
      if (left <= 0) {
        play.expired = true;
        play.misses += 1;
        play.note = "時辰已過。朝會未決，可以再議一次。";
        hooks.onMiss?.({ qText: stage.rounds?.[play.index]?.prompt || "朝議逾時" });
        hooks.render?.();
        return;
      }
      remain.textContent = `尚餘 ${Math.ceil(left / 1000)} 秒`;
      bar.style.width = `${Math.round((left / (play.seconds * 1000)) * 100)}%`;
    }, 250);
    play._timer = id;
  }

  document.querySelector("[data-board-retime]")?.addEventListener("click", () => {
    play.expired = false;
    play.note = "";
    play.picked = null;
    play.deadline = Date.now() + play.seconds * 1000;
    hooks.render?.();
  });

  document.querySelectorAll("[data-board-pick]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (play.won || play.expired || play.locked) return;
      const round = stage.rounds[play.index];
      const i = Number(btn.dataset.boardPick);
      const opt = round?.options?.[i];
      if (!opt) return;
      play.picked = i;
      if (play.game === "ledger") {
        play.note = opt.ok ? "成效同代價都在。可以採納。" : "這份賬只寫一邊，不能採納。";
        hooks.render?.();
        return;
      }
      if (!opt.ok) {
        missRound(play, opt.note || "再揀一次。", hooks, opt.text || opt.place);
        return;
      }
      play.note = opt.note || "";
      passRound(play, stage, hooks);
    });
  });

  document.querySelector("[data-board-accept]")?.addEventListener("click", () => {
    if (play.won || play.locked || play.game !== "ledger") return;
    const round = stage.rounds[play.index];
    const opt = round?.options?.[play.picked];
    if (!opt) {
      hooks.toast?.("先揀一項措施。");
      return;
    }
    if (!opt.ok) {
      missRound(play, opt.note || "只寫一邊，不能採納。", hooks, opt.text);
      return;
    }
    play.locked = true;
    passRound(play, stage, hooks);
  });
}
