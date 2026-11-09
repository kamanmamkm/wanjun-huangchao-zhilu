/**
 * 單元闖關裡的長卷互動板同遺物拼圖。
 * 完成唔寫長卷進度，亦唔另加經驗；闖關成功仍然用原來的單元獎勵。
 */
import { renderBoard, bindBoard } from "./stageBoards.js?v=rad176";

const UNIT_HOW = {
  cause: "先看結果，再揀講得較穩的原因。{n} 條都揀中就過這一關。",
  ledger: "揀一項措施，先打開成效同代價。只寫一邊的不能採納。{n} 策都採納就過這一關。",
  confront: "兩則材料並排。判斷下面那句有沒有超出材料。{n} 則都判斷正確就過這一關。",
  route: "看這次使命，揀下一站。走錯可以重揀。{n} 條路都揀中就過這一關。",
  verdict: "朝會有時限。揀一句同時顧到兩邊的決定；時辰過了可以再議。{n} 道都揀中就過這一關。",
};

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderUnitBoardSection({ board, play, hud, back }) {
  const n = board?.gotoGame === "pair" ? board.pairPick || 4 : (board?.rounds || []).length;
  const how = (UNIT_HOW[board?.gotoGame] || "").replaceAll("{n}", String(n || 0));
  const body =
    !play || play.error
      ? `<p>${esc(play?.error || "這一關暫時開唔到。")}</p>`
      : play.won
        ? `<p class="feedback">這一關完成。</p>`
        : renderBoard(board, play);
  return `
  <section class="panel board-play" data-unit-board="1">
    ${hud || ""}
    <p class="eyebrow ink-gold">單元闖關</p>
    <h2>${esc(board?.title || "互動")}</h2>
    ${how ? `<p class="lead">${how}</p>` : ""}
    ${body}
    <div class="row-actions">${back || ""}</div>
  </section>`;
}

export function bindUnitBoard(play, board, hooks) {
  if (!play || !board) return;
  bindBoard(play, board, {
    isCurrent: () => (hooks.isCurrent ? hooks.isCurrent() : true),
    render: hooks.render,
    toast: hooks.toast,
    onHit: () => {},
    onMiss: () => {},
    onClear: () => hooks.onClear?.(),
  });
}

export function renderRelicSection({ relic, play, hud, back }) {
  const picked = new Set(play?.picked || []);
  const shards = relic?.shards || [];
  const order = play?.order?.length ? play.order : shards.map((shard) => shard.id);
  const shown = order.map((id) => shards.find((shard) => shard.id === id)).filter(Boolean);
  return `
  <section class="panel board-play" data-unit-relic="1">
    ${hud || ""}
    <p class="eyebrow ink-gold">單元闖關</p>
    <h2>遺物拼圖${relic?.name ? ` · ${esc(relic.name)}` : ""}</h2>
    <p class="lead">${esc(relic?.lead || "撳選屬於呢件遺物嘅碎片，再嵌合。")}</p>
    ${relic?.relic ? `<article class="cause-result"><span>遺物</span><p>${esc(relic.relic)}</p></article>` : ""}
    <div class="relic-shards">
      ${shown
        .map(
          (sh) =>
            `<button type="button" class="option relic-shard${picked.has(sh.id) ? " is-on" : ""}" data-relic-shard="${esc(sh.id)}" aria-pressed="${picked.has(sh.id) ? "true" : "false"}">${esc(sh.text)}</button>`
        )
        .join("")}
    </div>
    <p class="feedback ${play?.note ? "" : "hidden"}">${esc(play?.note || "")}</p>
    ${
      play?.won
        ? `<p class="feedback">嵌合完成。</p>`
        : `<button type="button" class="btn" data-relic-fit="1">嵌合</button>`
    }
    <div class="row-actions">${back || ""}</div>
  </section>`;
}

export function bindRelic(play, relic, hooks) {
  if (!play || play.won || play.error || !relic) return;
  document.querySelectorAll("[data-relic-shard]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.relicShard;
      if (!id) return;
      const picked = new Set(play.picked || []);
      if (picked.has(id)) picked.delete(id);
      else picked.add(id);
      play.picked = [...picked];
      play.note = "";
      hooks.render?.();
    });
  });
  document.querySelector("[data-relic-fit]")?.addEventListener("click", () => {
    const shards = relic.shards || [];
    const fit = shards.filter((s) => s.fit).map((s) => s.id);
    const picked = play.picked || [];
    if (!picked.length) {
      play.note = "先揀碎片。";
      hooks.render?.();
      return;
    }
    const extra = shards.filter((s) => picked.includes(s.id) && !s.fit);
    const missing = fit.filter((id) => !picked.includes(id));
    if (!extra.length && !missing.length) {
      play.won = true;
      play.note = relic.done || "碎片歸位。";
      hooks.onClear?.();
      return;
    }
    const bits = extra.map((s) => s.note || "呢塊唔屬呢件遺物。");
    if (missing.length === 1) bits.push("仲有一塊未嵌上。");
    else if (missing.length > 1) bits.push(`仲有 ${missing.length} 塊未嵌上。`);
    play.note = bits.join("");
    hooks.render?.();
  });
}
