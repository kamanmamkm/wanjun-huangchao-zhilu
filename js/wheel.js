/**
 * 天機輪分頁：每答對一題可轉一次，次數可累積。部分格派錦囊。
 */
import { WHEEL_SLICES, CHARMS, wheelGradient, wheelStopAngle, pickWheelIndex } from "./data/wheel.js?v=rad67";
import { wheelStatus, applyWheelPrize, charmCount } from "./progress.js?v=rad92";
import { updateUser, addXp } from "./storage.js?v=rad80";

function relic(body) {
  return `<svg class="wheel-glyph" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="#fff8ea" stroke="#e4cf9a" stroke-width="1.4"/>${body}</svg>`;
}

/** 盤面只見器物，唔寫字。 */
const SLICE_GLYPH = {
  xp8: relic(`
    <rect x="13" y="12" width="10" height="40" rx="2.4" fill="#e7c56a" stroke="#8a581c" stroke-width="1.1"/>
    <rect x="27" y="12" width="10" height="40" rx="2.4" fill="#f4dc96" stroke="#8a581c" stroke-width="1.1"/>
    <rect x="41" y="12" width="10" height="40" rx="2.4" fill="#d7ae4c" stroke="#8a581c" stroke-width="1.1"/>
    <path d="M11 23h42M11 42h42" stroke="#9a2a24" stroke-width="2.3" stroke-linecap="round"/>`),
  xp16: relic(`
    <ellipse cx="40" cy="44" rx="16" ry="9" fill="#6a5344"/>
    <ellipse cx="40" cy="43" rx="13" ry="6.5" fill="#8b705c"/>
    <ellipse cx="40" cy="43" rx="5.5" ry="2.6" fill="#1a120e"/>
    <path d="M14 12 L34 36" stroke="#c9a15a" stroke-width="4.2" stroke-linecap="round"/>
    <path d="M31 34l9 15-11-3z" fill="#1c1a18"/>
    <circle cx="33.5" cy="34" r="2.3" fill="#f0d78c"/>`),
  charm_lamp: relic(`
    <path d="M32 7c5 7 9 9 9 16 0 7-4 10-9 10s-9-3-9-10c0-7 4-9 9-16z" fill="#f3b423"/>
    <path d="M32 14c2.4 4 4.2 5.2 4.2 8.2 0 3.2-1.8 5-4.2 5s-4.2-1.8-4.2-5c0-3 1.8-4.2 4.2-8.2z" fill="#fff6cf"/>
    <path d="M15 42h34c1.2 8-6 13-17 13S13.8 50 15 42z" fill="#c4843a" stroke="#7a4e16" stroke-width="1.1"/>
    <path d="M12 40.5h40" stroke="#8a5a20" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M46 35c9 1 11 9 5 13" fill="none" stroke="#c4843a" stroke-width="3" stroke-linecap="round"/>`),
  charm_peek: relic(`
    <rect x="18" y="18" width="28" height="28" rx="1.2" fill="#f6efd8" stroke="#d4c092" stroke-width="1"/>
    <rect x="10" y="16" width="9" height="32" rx="4.5" fill="#9a2a24"/>
    <rect x="45" y="16" width="9" height="32" rx="4.5" fill="#9a2a24"/>
    <circle cx="14.5" cy="19" r="1.7" fill="#f0d78c"/>
    <circle cx="14.5" cy="45" r="1.7" fill="#f0d78c"/>
    <circle cx="49.5" cy="19" r="1.7" fill="#f0d78c"/>
    <circle cx="49.5" cy="45" r="1.7" fill="#f0d78c"/>`),
  xp24: relic(`
    <rect x="15" y="27" width="34" height="26" rx="3" fill="#2f8a72" stroke="#1d5c4c" stroke-width="1.1"/>
    <rect x="18" y="30" width="28" height="20" rx="2" fill="#49b094"/>
    <path d="M25 27V17h14v10" fill="#e6c56a" stroke="#8a6230" stroke-width="1"/>
    <circle cx="32" cy="15" r="5.2" fill="#f3dc96" stroke="#8a6230" stroke-width="1"/>
    <circle cx="32" cy="40" r="3.2" fill="#e7f7f1"/>`),
  charm_silk: relic(`
    <ellipse cx="22" cy="34" rx="11" ry="16" fill="#8e241f"/>
    <ellipse cx="22" cy="34" rx="6" ry="11" fill="#d25548"/>
    <path d="M22 18h22l12 30H30z" fill="#b4332c"/>
    <path d="M30 23h12l7 16H35z" fill="#f0d78c"/>`),
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
    <p class="muted">${hint}</p>
    ${charmBagHtml(user)}
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
