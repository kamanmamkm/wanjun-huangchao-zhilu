/**
 * 角色舞台：場景框＋立繪＋道具徽章＋貫穿小物
 * 有階段專屬海報時，主頁／成長大圖優先用海報（保留角色臉孔系統作小頭像）
 */
import { renderAvatar } from "./avatar.js";
import { getStageVisual, STAGE_RELIC, getStageArt } from "./data/stageVisuals.js";
import { identityDisplayName, getIdentity, outfitForIdentity } from "./data/identities.js";

/**
 * @param {object} char
 * @param {number} identityId
 * @param {'hero'|'lg'|'md'|'sm'|'corner'} size
 * @param {object} [opts]
 */
export function renderHeroStage(char, identityId, size = "hero", opts = {}) {
  const id = Math.min(7, Math.max(0, identityId ?? 0));
  const vis = getStageVisual(id);
  const idn = getIdentity(id);
  const gender = opts.gender || char?.look?.gender || char?.gender || "male";
  const name = identityDisplayName(idn, gender);
  const outfit = outfitForIdentity(id, gender);
  const avatarSize = size === "hero" ? "lg" : size === "corner" ? "sm" : size;
  const locked = !!opts.silhouette;
  const preview = opts.previewId != null ? opts.previewId : id;
  const art = !locked && !opts.forceAvatar ? getStageArt(id, gender) : null;
  const usePoster = art && (opts.poster || size === "hero" || size === "lg" || opts.preferStageArt);

  let body;
  if (locked) {
    body = `<div class="stage-silhouette" aria-hidden="true">
        ${renderAvatar(char, preview, avatarSize, { outfitLabel: "？" })}
        <span class="sil-veil"></span>
        <span class="sil-prop hint-${getStageVisual(preview).propKey}">${getStageVisual(preview).prop}</span>
      </div>`;
  } else if (usePoster) {
    body = `<div class="stage-poster" role="img" aria-label="${name} · ${art.badge || outfit}">
      <img src="${art.src}?v=rad18" alt="${name} · ${art.badge || "階段立繪"}" loading="lazy" />
      ${art.badge ? `<span class="stage-art-badge">${art.badge}</span>` : ""}
    </div>`;
  } else {
    body = renderAvatar(char, id, avatarSize, { outfitLabel: outfit });
  }

  const quote = opts.hideQuote
    ? ""
    : `<p class="stage-quote">「${opts.quote || vis.quote}」</p>`;

  const relic =
    opts.showRelic === false || usePoster
      ? ""
      : `<span class="stage-relic" title="${STAGE_RELIC.note}">${STAGE_RELIC.label}</span>`;

  const propBadge =
    usePoster
      ? ""
      : `<div class="stage-prop-badge prop-${vis.propKey}" title="${vis.prop}">${vis.prop}</div>`;

  return `
  <div class="hero-stage-frame scene-${vis.sceneKey} pose-${vis.poseKey} size-${size} ${locked ? "is-locked" : ""} ${opts.priorityBoost && vis.priority ? "priority-stage" : ""} ${opts.poster ? "is-poster" : ""} ${usePoster ? "has-stage-art" : ""}"
       style="--stage-accent:${vis.accent}"
       data-identity="${id}">
    <div class="stage-sky" aria-hidden="true"></div>
    <div class="stage-ground" aria-hidden="true"></div>
    ${propBadge}
    <div class="stage-figure">${body}</div>
    ${relic}
    ${
      opts.compact || opts.poster || usePoster
        ? ""
        : `<div class="stage-caption">
        <p class="stage-scene">${vis.scene} · ${vis.pose}</p>
        ${quote}
      </div>`
    }
  </div>`;
}

/** 答題模式：角落陪伴頭像 */
export function renderStudyCompanion(char, identityId, line = "") {
  const vis = getStageVisual(identityId);
  return `
  <aside class="study-companion" aria-label="角色提示">
    ${renderAvatar(char, identityId, "sm", { gender: char?.look?.gender || char?.gender })}
    <div class="study-bubble">
      <p>${line || vis.quote}</p>
    </div>
  </aside>`;
}

/** 晉升揭幕層 */
export function renderPromoteReveal({ char, fromId, toId, gender, quote }) {
  const from = getIdentity(fromId);
  const to = getIdentity(toId);
  const vis = getStageVisual(toId);
  return `
  <div class="promote-reveal" id="promote-reveal" role="dialog" aria-modal="true" aria-label="晉升揭幕">
    <div class="reveal-inner">
      <p class="eyebrow ink-gold">身份躍升</p>
      <div class="reveal-swap">
        <div class="reveal-old">
          ${renderHeroStage(char, fromId, "md", { gender, compact: true, showRelic: false, hideQuote: true, preferStageArt: true })}
          <p>${identityDisplayName(from, gender)}</p>
        </div>
        <div class="reveal-arrow" aria-hidden="true">→</div>
        <div class="reveal-new">
          ${renderHeroStage(char, toId, "hero", { gender, quote: quote || vis.quote, priorityBoost: true, preferStageArt: true })}
          <p class="reveal-title">${identityDisplayName(to, gender)}</p>
        </div>
      </div>
      <p class="lead">解鎖：新場景「${vis.scene}」· 姿態「${vis.pose}」· 道具「${vis.prop}」</p>
      <div class="row-actions">
        <button type="button" class="btn" id="reveal-continue">繼續旅程</button>
        <button type="button" class="btn ghost" id="reveal-skip">略過動畫</button>
      </div>
      <button type="button" class="btn ghost" id="reveal-reduce-motion">減少動態</button>
    </div>
  </div>`;
}
