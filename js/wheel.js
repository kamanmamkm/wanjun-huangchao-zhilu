/**
 * 天機輪分頁：每答對一題可轉一次，次數可累積。部分格派錦囊。
 */
import { WHEEL_SLICES, CHARMS, wheelGradient, wheelStopAngle, pickWheelIndex } from "./data/wheel.js?v=rad67";
import { wheelStatus, applyWheelPrize, charmCount } from "./progress.js?v=rad68";
import { updateUser, addXp } from "./storage.js?v=rad50";

function discCaption(slice) {
  if (slice.charm) return `錦囊<br>${slice.caption}`;
  const name = slice.caption || slice.label.split("＋")[0];
  const amount = slice.xp || 0;
  return `${name}<br>＋${amount}`;
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
    return `<span class="wheel-label" style="--rot:${rot}deg"><span class="wheel-label-inner">${discCaption(s)}</span></span>`;
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
