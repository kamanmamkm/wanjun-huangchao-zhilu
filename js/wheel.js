/**
 * 天機輪分頁：每答對一題可轉一次，次數可累積。
 */
import { WHEEL_SLICES, wheelGradient, wheelStopAngle, pickWheelIndex } from "./data/wheel.js?v=rad50";
import { wheelStatus, applyWheelPrize } from "./progress.js?v=rad50";
import { updateUser, addXp } from "./storage.js?v=rad50";

function discCaption(slice) {
  if (slice.xp && slice.score) return `兼得<br>＋${slice.xp}／${slice.score}`;
  if (slice.xp) return `${slice.label.split("＋")[0]}<br>＋${slice.xp}`;
  return `史績<br>＋${slice.score}`;
}

function nextWheelAngle(prev, index, extraSpins) {
  const raw = wheelStopAngle(index, 0);
  const landing = ((raw % 360) + 360) % 360;
  const prevMod = ((prev % 360) + 360) % 360;
  let delta = landing - prevMod;
  if (delta <= 0) delta += 360;
  return prev + extraSpins * 360 + delta;
}

export function renderWheelPage(user) {
  const st = wheelStatus(user);
  const n = WHEEL_SLICES.length;
  const labels = WHEEL_SLICES.map((s, i) => {
    const rot = (i + 0.5) * (360 / n);
    return `<span class="wheel-label" style="--rot:${rot}deg">${discCaption(s)}</span>`;
  }).join("");
  let hint = "答對一題就加一次轉動。次數用完再去長卷答題。";
  if (st.canSpin) hint = `尚有 ${st.charges} 次可轉。`;
  return `
  <section class="panel-paper wheel-view">
    <h2>天機輪</h2>
    <p class="lead">答對題目會累積<strong>史績</strong>。每答對一題可轉輪一次領賞（經驗或史績），次數可累積。</p>
    <p class="wheel-score">現有史績 <strong>${st.score}</strong>　可轉 <strong>${st.charges}</strong> 次　今日答對 <strong>${st.todayCorrect}</strong> 題</p>
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
