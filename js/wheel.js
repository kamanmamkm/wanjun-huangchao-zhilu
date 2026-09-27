/**
 * 天機輪分頁：每答對一題可轉一次，次數可累積。部分格派錦囊。
 */
import { WHEEL_SLICES, CHARMS, wheelGradient, wheelStopAngle, pickWheelIndex } from "./data/wheel.js?v=rad67";
import { wheelStatus, applyWheelPrize, charmCount } from "./progress.js?v=rad83";
import { updateUser, addXp } from "./storage.js?v=rad80";

const ink = `fill="none" stroke="#fffaf3" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"`;

/** 盤面只見器物，唔寫字。 */
const SLICE_GLYPH = {
  xp8: `<svg class="wheel-glyph" viewBox="0 0 64 64" aria-hidden="true"><g ${ink}><path d="M16 8h6c1.4 0 2 1.2 2 2.6v42.8c0 1.4-.6 2.6-2 2.6h-6c-1.4 0-2-1.2-2-2.6V10.6C14 9.2 14.6 8 16 8z"/><path d="M29 8h6c1.4 0 2 1.2 2 2.6v42.8c0 1.4-.6 2.6-2 2.6h-6c-1.4 0-2-1.2-2-2.6V10.6C27 9.2 27.6 8 29 8z"/><path d="M42 8h6c1.4 0 2 1.2 2 2.6v42.8c0 1.4-.6 2.6-2 2.6h-6c-1.4 0-2-1.2-2-2.6V10.6C40 9.2 40.6 8 42 8z"/></g></svg>`,
  xp16: `<svg class="wheel-glyph" viewBox="0 0 64 64" aria-hidden="true"><g ${ink}><path d="M16 6l18 30"/><path d="M30 32l10 18-14-5z" fill="#fffaf3" stroke="none"/><ellipse cx="44" cy="50" rx="15" ry="8"/><ellipse cx="44" cy="50" rx="5" ry="2.4" fill="#fffaf3" stroke="none"/></g></svg>`,
  charm_lamp: `<svg class="wheel-glyph" viewBox="0 0 64 64" aria-hidden="true"><g ${ink}><path d="M30 30c1-7 7-12 8-20 1 9 8 12 9 20" fill="#fffaf3" stroke="none"/><path d="M16 40h32c1.6 7-3 14-16 14S14.4 47 16 40z" fill="rgba(255,250,243,.18)"/><path d="M12 40h40"/><path d="M48 34c8 2 10 10 4 14"/><path d="M32 54v6"/></g></svg>`,
  charm_peek: `<svg class="wheel-glyph" viewBox="0 0 64 64" aria-hidden="true"><g ${ink}><path d="M20 16h24v32H20z" fill="rgba(255,250,243,.16)"/><ellipse cx="20" cy="32" rx="7" ry="17"/><ellipse cx="44" cy="32" rx="7" ry="17"/></g></svg>`,
  xp24: `<svg class="wheel-glyph" viewBox="0 0 64 64" aria-hidden="true"><g ${ink}><rect x="14" y="26" width="36" height="28" rx="3" fill="rgba(255,250,243,.16)"/><path d="M24 26V16h16v10"/><circle cx="32" cy="14" r="5" fill="#fffaf3" stroke="none"/></g></svg>`,
  charm_silk: `<svg class="wheel-glyph" viewBox="0 0 64 64" aria-hidden="true"><g ${ink}><path d="M16 18h30l12 28H28z" fill="rgba(255,250,243,.2)"/><path d="M16 18c-8 5-8 18 0 24"/><path d="M20 22c-5 4-5 12 0 16"/></g></svg>`,
};

function discGlyph(slice) {
  return SLICE_GLYPH[slice.id] || SLICE_GLYPH.xp8;
}

function nextWheelAngle(prev, index, extraSpins) {
  const raw = wheelStopAngle(index, 0);
  const landing = ((raw % 360) + 360) % 360;
  const prevMod = ((prev % 360) + 360) % 360;
  let delta = landing - prevMod;
  if (delta <= 0) delta += 360;
  return prev + extraSpins * 360 + delta;
}

function charmBagHtml(user) {
  const parts = Object.values(CHARMS)
    .map((c) => {
      const n = charmCount(user, c.id);
      return `<span class="charm-chip${n ? "" : " is-empty"}"><strong>${c.name}</strong> ${n}</span>`;
    })
    .join("");
  return `<div class="charm-bag"><p class="eyebrow">隨身錦囊</p><div class="charm-bag-row">${parts}</div>
    <p class="muted">${Object.values(CHARMS)
      .map((c) => `${c.name}：${c.use}`)
      .join("　")}</p></div>`;
}

export function renderWheelPage(user) {
  const st = wheelStatus(user);
  const n = WHEEL_SLICES.length;
  const labels = WHEEL_SLICES.map((s, i) => {
    const rot = (i + 0.5) * (360 / n);
    return `<span class="wheel-label" style="--rot:${rot}deg"><span class="wheel-label-inner">${discGlyph(s)}</span></span>`;
  }).join("");
  let hint = "答對一題就加一次轉動。次數用完再去長卷答題。";
  if (st.canSpin) hint = `尚有 ${st.charges} 次可轉。`;
  return `
  <section class="panel-paper wheel-view">
    <h2>天機輪</h2>
    <p class="lead">答對題目會累積<strong>史績</strong>。轉輪可領<strong>經驗</strong>或<strong>錦囊</strong>——錦囊用嚟幫遊戲，唔會直接加史績。</p>
    <p class="wheel-score">現有史績 <strong>${st.score}</strong>　可轉 <strong>${st.charges}</strong> 次　今日答對 <strong>${st.todayCorrect}</strong> 題</p>
    ${charmBagHtml(user)}
    <p class="muted">${hint}</p>
    <div class="wheel-stage">
      <div class="wheel-pointer" aria-hidden="true"></div>
      <div class="wheel-disc" id="wheel-disc" style="background:conic-gradient(from -90deg, ${wheelGradient()})">
        ${labels}
      </div>
    </div>
    <div class="row-actions">
      <button type="button" class="btn" id="wheel-spin" ${st.canSpin ? "" : "disabled"}>${
        st.canSpin ? `轉動天機輪（${st.charges}）` : "先去答對一題"
      }</button>
      <button type="button" class="btn ghost" data-goto="scroll">去長卷答題</button>
      <button type="button" class="btn ghost" data-goto="games">去用錦囊</button>
    </div>
    ${
      st.lastPrize
        ? `<p class="settle-line ok">最近一次：${st.lastPrize.label}</p>`
        : ""
    }
  </section>`;
}

export function bindWheel(user, ctx) {
  const { toast, render, state } = ctx;
  const btn = document.getElementById("wheel-spin");
  const disc = document.getElementById("wheel-disc");
  if (!btn || !disc) return;
  if (state.wheelAngle) {
    disc.style.transition = "none";
    disc.style.transform = `rotate(${state.wheelAngle}deg)`;
  }
  btn.addEventListener("click", () => {
    const st = wheelStatus(user);
    if (!st.canSpin) {
      toast("先答對一題，再來轉輪");
      return;
    }
    if (state.wheelBusy) return;
    const idx = pickWheelIndex();
    const slice = WHEEL_SLICES[idx];
    let applied = { ok: false };
    updateUser((u) => {
      applied = applyWheelPrize(u, idx);
    });
    if (!applied.ok) {
      toast("先答對一題，再來轉輪");
      render();
      return;
    }
    if (slice.xp) addXp(slice.xp);
    const reduce =
      document.body.classList.contains("reduce-motion") ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const angle = nextWheelAngle(state.wheelAngle || 0, idx, reduce ? 0 : 5);
    state.wheelAngle = angle;
    state.wheelBusy = true;
    btn.disabled = true;
    if (reduce) {
      disc.style.transition = "none";
      disc.style.transform = `rotate(${angle}deg)`;
      state.wheelBusy = false;
      toast(`天機所示：${slice.label}`);
      render();
      return;
    }
    disc.style.transition = "transform 3.2s cubic-bezier(0.12, 0.7, 0.12, 1)";
    requestAnimationFrame(() => {
      disc.style.transform = `rotate(${angle}deg)`;
    });
    const done = () => {
      if (!state.wheelBusy) return;
      state.wheelBusy = false;
      toast(`天機所示：${slice.label}`);
      render();
    };
    disc.addEventListener("transitionend", done, { once: true });
    window.setTimeout(done, 3800);
  });
}
