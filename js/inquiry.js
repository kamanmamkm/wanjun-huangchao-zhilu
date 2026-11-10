/**
 * 探究：先查線索，再判斷，最後的處事選擇會寫進存檔。
 * 經驗只在每一題第一次結案發一次，不加史績。保存失敗不顯示成功。
 * 舊存檔若仍是單一課題，讀取時會當成該題的紀錄，不會清掉。
 */
import { INQUIRIES, INQUIRY, getInquiry } from "./data/inquiry.js?v=rad177";
import { isGradeAllowed } from "./data/formYear.js?v=rad114";
import { XP_REWARDS } from "./data/levels.js?v=rad103";
import { updateUser } from "./storage.js?v=rad114";
import { grantNamedRelic } from "./progress.js?v=rad176";

const OPEN_KEY = "huangchao_inquiry_open";

const ORDER = {
  notice: ["notice", "han", "lu", "compare", "judge", "choice", "end"],
  lu: ["lu", "notice", "han", "compare", "judge", "choice", "end"],
};

function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function packOf(id) {
  return getInquiry(id) || INQUIRY;
}

function inquiryMap(raw) {
  if (!raw || typeof raw !== "object") return {};
  if (raw.id && (raw.phase || raw.version)) return { [raw.id]: raw };
  const map = {};
  for (const value of Object.values(raw)) {
    if (value && typeof value === "object" && value.id) map[value.id] = value;
  }
  return map;
}

export function blankInquiry(prev, pack = INQUIRY) {
  return {
    id: pack.id,
    version: pack.version,
    phase: "open",
    route: "",
    noticeDetail: false,
    compareOk: false,
    judgeOk: false,
    miss: "",
    choice: "",
    rewarded: !!prev?.rewarded,
    seen: [],
  };
}

export function readInquiry(user, id) {
  const pack = packOf(id || INQUIRY.id);
  const row = inquiryMap(user?.progress?.inquiry)[pack.id];
  if (!row || row.id !== pack.id) return null;
  return row;
}

export function rememberInquiryOpen(username, inquiryId) {
  try {
    if (!inquiryId) {
      sessionStorage.removeItem(OPEN_KEY);
      if (sessionStorage.getItem("huangchao_resume_kind") === "inquiry") {
        sessionStorage.removeItem("huangchao_resume_kind");
      }
      return;
    }
    sessionStorage.setItem(OPEN_KEY, `${String(username || "").toUpperCase()}|${inquiryId}`);
    sessionStorage.setItem("huangchao_resume_kind", "inquiry");
  } catch {
    /* 分頁狀態寫唔到時，仍可從首頁繼續 */
  }
}

export function recallInquiryOpen(username) {
  try {
    const raw = sessionStorage.getItem(OPEN_KEY) || "";
    const i = raw.indexOf("|");
    if (i < 0) return "";
    if (raw.slice(0, i) !== String(username || "").toUpperCase()) return "";
    return raw.slice(i + 1);
  } catch {
    return "";
  }
}

function see(row, id) {
  const seen = Array.isArray(row.seen) ? row.seen : [];
  return seen.includes(id) ? seen : [...seen, id];
}

function commit(user, pack, next, grant) {
  let granted = false;
  try {
    const saved = updateUser((u) => {
      if (String(u.username || "").toUpperCase() !== String(user.username || "").toUpperCase()) return;
      u.progress = u.progress || {};
      const map = inquiryMap(u.progress.inquiry);
      const prev = map[pack.id];
      const already = !!prev?.rewarded;
      if (grant && !already) {
        u.xp = Math.max(0, (Number(u.xp) || 0) + (XP_REWARDS.inquiryOnce || 8));
        next.rewarded = true;
        granted = true;
      } else {
        next.rewarded = already || !!next.rewarded;
      }
      map[pack.id] = next;
      u.progress.inquiry = map;
      if (next.phase === "end" && next.choice && pack.endings[next.choice]) {
        const end = pack.endings[next.choice];
        const spec = { id: pack.relicId, name: end.relic, hint: end.relicHint };
        if (!grantNamedRelic(u, spec)) {
          const list = u.progress.relics || [];
          const found = list.find((r) => r.id === pack.relicId);
          if (found) {
            found.name = spec.name;
            found.hint = spec.hint;
          }
        }
      }
    });
    return saved ? { ok: true, granted } : { ok: false, granted: false };
  } catch {
    return { ok: false, granted: false };
  }
}

function advance(row, route) {
  const steps = ORDER[route] || ORDER.notice;
  const i = steps.indexOf(row.phase);
  const phase = steps[Math.min(steps.length - 1, i + 1)] || "end";
  return { ...row, phase, miss: "", route };
}

function clueButtons(pack, row) {
  const scene = pack.scene;
  const bits = [];
  if ((row.seen || []).includes("notice")) {
    bits.push(
      `<details class="inquiry-clue"><summary>${esc(scene.noticeClue)}</summary><p>${esc(pack.notice.surface)}</p>${row.noticeDetail ? `<p>${esc(pack.notice.detail)}</p>` : ""}</details>`
    );
  }
  if ((row.seen || []).includes("rolls")) {
    bits.push(
      `<details class="inquiry-clue"><summary>${esc(scene.rollsClue)}</summary><p>${esc(pack.examRoll)}</p><p>${esc(pack.clanRoll)}</p></details>`
    );
  }
  bits.push(
    `<details class="inquiry-clue"><summary>課業：${esc(pack.knowledge.title)}</summary><p>${esc(pack.knowledge.text)}</p></details>`
  );
  return bits.join("");
}

function options(list, attr) {
  return list
    .map(
      (opt) =>
        `<button type="button" class="inquiry-option" data-${attr}="${esc(opt.id)}">${esc(opt.text)}</button>`
    )
    .join("");
}

function shell(pack, title, body) {
  return `<section class="inquiry play-sheet" id="inquiry-root" data-inquiry="${esc(pack.id)}">
    <header class="play-bar">
      <button type="button" class="play-back" data-inquiry-home="1">返回首頁</button>
      <div class="play-bar-copy">
        <p class="play-kicker">${esc(pack.title)}</p>
        <h1 class="inquiry-title">${esc(title)}</h1>
      </div>
    </header>
    <div class="inquiry-beat">${body}</div>
  </section>`;
}

function renderOpen(pack) {
  const scene = pack.scene;
  return shell(
    pack,
    scene.openTitle,
    `<p class="inquiry-fiction">${esc(pack.fiction)}</p>
    <p class="inquiry-line">${esc(scene.openLine)}</p>
    <p class="inquiry-say"><strong>${esc(scene.openA.name)}</strong>（${esc(scene.openA.role)}）說：${esc(scene.openA.text)}</p>
    <p class="inquiry-say"><strong>${esc(scene.openB.name)}</strong>（${esc(scene.openB.role)}）說：${esc(scene.openB.text)}</p>
    <p class="inquiry-goal">${esc(pack.hook)}</p>
    <div class="inquiry-actions">
      <button type="button" class="btn play-go" data-inquiry-route="notice">${esc(scene.routeA)}</button>
      <button type="button" class="btn play-quiet" data-inquiry-route="lu">${esc(scene.routeB)}</button>
    </div>`
  );
}

function renderNotice(pack, row) {
  const scene = pack.scene;
  const known = row.route === "lu";
  const body = row.noticeDetail
    ? `<p>${esc(pack.notice.detail)}</p><p class="inquiry-note">${esc(scene.noticeNote)}</p>
       <button type="button" class="btn play-go" data-inquiry-next="1">${esc(scene.noticeNext)}</button>`
    : `<p>${esc(pack.notice.surface)}</p>
       ${known ? `<p class="inquiry-note">${esc(scene.noticeKnown)}</p>` : ""}
       <button type="button" class="btn play-go" data-inquiry-look="1">${esc(scene.noticeLook)}</button>`;
  return shell(pack, scene.noticeTitle, body);
}

function renderHan(pack, row) {
  const scene = pack.scene;
  const line = row.noticeDetail ? scene.hanSaw : scene.hanBlind;
  return shell(
    pack,
    scene.hanTitle,
    `<p class="inquiry-say"><strong>${esc(scene.hanTitle)}</strong>：${esc(line)}</p>
     <button type="button" class="btn play-go" data-inquiry-next="1">繼續</button>`
  );
}

function renderLu(pack, row) {
  const scene = pack.scene;
  const line = row.noticeDetail ? scene.luSaw : scene.luBlind;
  return shell(
    pack,
    scene.luTitle,
    `<p class="inquiry-say"><strong>${esc(scene.luTitle)}</strong>：${esc(line)}</p>
     <button type="button" class="btn play-go" data-inquiry-next="1">繼續</button>`
  );
}

function renderCompare(pack, row) {
  const scene = pack.scene;
  const miss = row.miss ? `<p class="inquiry-miss" role="status">${esc(row.miss)}</p>` : "";
  const next = row.compareOk
    ? `<button type="button" class="btn play-go" data-inquiry-next="1">用這個去判斷</button>`
    : options(pack.compare.options, "inquiry-compare");
  return shell(
    pack,
    scene.compareTitle,
    `<p>${esc(pack.examRoll)}</p>
     <p>${esc(pack.clanRoll)}</p>
     <p class="inquiry-ask">${esc(pack.compare.prompt)}</p>
     ${miss}
     <div class="inquiry-actions">${next}</div>
     ${clueButtons(pack, row)}`
  );
}

function renderJudge(pack, row) {
  const miss = row.miss ? `<p class="inquiry-miss" role="status">${esc(row.miss)}</p>` : "";
  const next = row.judgeOk
    ? `<p>${esc(pack.judge.options.find((o) => o.ok)?.feedback || "")}</p>
       <button type="button" class="btn play-go" data-inquiry-next="1">作出決定</button>`
    : options(pack.judge.options, "inquiry-judge");
  return shell(
    pack,
    pack.scene.judgeTitle,
    `<p class="inquiry-ask">${esc(pack.judge.prompt)}</p>
     ${miss}
     <div class="inquiry-actions">${next}</div>
     ${clueButtons(pack, row)}`
  );
}

function renderChoice(pack) {
  const scene = pack.scene;
  return shell(
    pack,
    scene.choiceTitle,
    `<p>${esc(scene.choiceLead)}</p>
     <div class="inquiry-actions">
       <button type="button" class="btn play-go" data-inquiry-choice="restore">${esc(scene.choiceRestore)}</button>
       <button type="button" class="btn play-quiet" data-inquiry-choice="report">${esc(scene.choiceReport)}</button>
     </div>`
  );
}

function renderEnd(pack, row, granted) {
  const scene = pack.scene;
  const end = pack.endings[row.choice] || pack.endings.restore;
  const xp = granted
    ? `經驗 +${XP_REWARDS.inquiryOnce || 8}。史績沒有加。`
    : row.rewarded
      ? "經驗已在第一次結案時發過，這次不再發。"
      : "";
  const decision = row.choice === "report" ? scene.decisionReport : scene.decisionRestore;
  return shell(
    pack,
    scene.endTitle,
    `<p class="inquiry-k">你的決定</p>
     <p>${esc(decision)}</p>
     <p class="inquiry-k">結果</p>
     <p>${esc(end.result)}</p>
     <p class="inquiry-say"><strong>${esc(scene.openA.name)}</strong>：${esc(end.han)}</p>
     <p class="inquiry-say"><strong>${esc(scene.openB.name)}</strong>：${esc(end.lu)}</p>
     <p class="inquiry-k">你用到的知識</p>
     <p>${esc(pack.knowledge.text)}</p>
     <p class="inquiry-k">紀念物</p>
     <p>${esc(end.relic)}。${esc(end.relicHint)}</p>
     ${xp ? `<p class="inquiry-note">${esc(xp)}</p>` : ""}
     <details class="inquiry-clue"><summary>出處（教師可查）</summary><p>${esc(pack.knowledge.source)}</p></details>
     <div class="inquiry-actions">
       <button type="button" class="btn play-quiet" data-inquiry-replay="1">${esc(scene.replay)}</button>
       <button type="button" class="btn play-go" data-inquiry-home="1">返回首頁</button>
     </div>`
  );
}

function allowedPack(pack, user) {
  return !pack?.grade || isGradeAllowed(pack.grade, user?.formYear);
}

export function renderInquiryEntry(user) {
  return INQUIRIES.filter((pack) => allowedPack(pack, user))
    .map((pack) => {
      const row = readInquiry(user, pack.id);
      if (row?.phase === "end") return "";
      const ongoing = row && row.phase && row.phase !== "open" && row.phase !== "end";
      const label = ongoing ? "繼續" : pack.scene.entryLabel;
      return `<article class="case-entry">
    <h3>${esc(pack.title)}</h3>
    <button type="button" class="btn" data-open-inquiry="${esc(pack.id)}">${esc(label)}</button>
  </article>`;
    })
    .join("");
}

export function renderInquiry(user, granted, inquiryId) {
  const pack = packOf(inquiryId);
  if (!allowedPack(pack, user)) {
    return shell(
      pack,
      "不在本年級",
      `<p>這題不在本年級範圍。</p><button type="button" class="btn play-go" data-inquiry-home="1">返回首頁</button>`
    );
  }
  const row = readInquiry(user, pack.id) || blankInquiry(null, pack);
  if (row.phase === "notice") return renderNotice(pack, row);
  if (row.phase === "han") return renderHan(pack, row);
  if (row.phase === "lu") return renderLu(pack, row);
  if (row.phase === "compare") return renderCompare(pack, row);
  if (row.phase === "judge") return renderJudge(pack, row);
  if (row.phase === "choice") return renderChoice(pack);
  if (row.phase === "end") return renderEnd(pack, row, granted);
  return renderOpen(pack);
}

export function bindInquiry(user, ctx) {
  const { render, toast, state } = ctx;
  const root = document.getElementById("inquiry-root");
  if (!root) return;
  const pack = packOf(root.dataset.inquiry);
  const heading = root.querySelector(".inquiry-title");
  if (heading) {
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
  const current = () => readInquiry(ctx.getUser?.() || user, pack.id) || blankInquiry(null, pack);

  const fail = () => toast?.("這一步未寫入。請再試一次。");

  const go = (next, grant) => {
    const saved = commit(ctx.getUser?.() || user, pack, next, grant);
    if (!saved.ok) {
      fail();
      return;
    }
    state.inquiryGranted = !!saved.granted;
    rememberInquiryOpen((ctx.getUser?.() || user).username, next.phase !== "end" ? pack.id : "");
    render();
  };

  root.querySelectorAll("[data-inquiry-home]").forEach((btn) => {
    btn.addEventListener("click", () => {
      rememberInquiryOpen(user.username, "");
      state.view = "home";
      render();
    });
  });

  root.querySelectorAll("[data-inquiry-route]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const route = btn.dataset.inquiryRoute === "lu" ? "lu" : "notice";
      const phase = ORDER[route][0];
      const row = current();
      go({
        ...blankInquiry(row, pack),
        rewarded: row.rewarded,
        phase,
        route,
        seen: see(row, phase === "notice" ? "notice" : "lu"),
      });
    });
  });

  root.querySelector("[data-inquiry-look]")?.addEventListener("click", () => {
    const row = current();
    go({ ...row, noticeDetail: true, seen: see(row, "notice") });
  });

  root.querySelector("[data-inquiry-next]")?.addEventListener("click", () => {
    const row = current();
    let next = advance(row, row.route || "notice");
    if (next.phase === "notice" || next.phase === "han" || next.phase === "lu") {
      const key = next.phase === "notice" ? "notice" : next.phase;
      next = { ...next, seen: see(next, key) };
    }
    if (next.phase === "compare") next = { ...next, seen: see(next, "rolls") };
    go(next);
  });

  root.querySelectorAll("[data-inquiry-compare]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = current();
      const opt = pack.compare.options.find((o) => o.id === btn.dataset.inquiryCompare);
      if (!opt) return;
      if (!opt.ok) {
        go({ ...row, compareOk: false, miss: opt.miss, seen: see(row, "rolls") });
        return;
      }
      go({ ...row, compareOk: true, miss: "", seen: see(row, "rolls") });
    });
  });

  root.querySelectorAll("[data-inquiry-judge]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = current();
      const opt = pack.judge.options.find((o) => o.id === btn.dataset.inquiryJudge);
      if (!opt) return;
      if (!opt.ok) {
        go({ ...row, judgeOk: false, miss: opt.miss });
        return;
      }
      go({ ...row, judgeOk: true, miss: "" });
    });
  });

  root.querySelectorAll("[data-inquiry-choice]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const choice = btn.dataset.inquiryChoice === "report" ? "report" : "restore";
      const row = current();
      if (!row.judgeOk) return;
      go({ ...row, phase: "end", choice, miss: "" }, true);
    });
  });

  root.querySelector("[data-inquiry-replay]")?.addEventListener("click", () => {
    const row = current();
    go(blankInquiry(row, pack));
  });
}
