/**
 * 「榜上多了一行」：先查線索，再判斷，最後的處事選擇會寫進存檔。
 * 經驗只在第一次結案發一次，不加史績。保存失敗不顯示成功。
 */
import { INQUIRY } from "./data/inquiry.js?v=rad103";
import { XP_REWARDS } from "./data/levels.js?v=rad103";
import { updateUser } from "./storage.js?v=rad114";
import { grantNamedRelic } from "./progress.js?v=rad167";

const OPEN_KEY = "huangchao_inquiry_open";
const RELIC_ID = "inquiry_keju_notice";

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

export function blankInquiry(prev) {
  return {
    id: INQUIRY.id,
    version: INQUIRY.version,
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

export function readInquiry(user) {
  const row = user?.progress?.inquiry;
  if (!row || row.id !== INQUIRY.id) return null;
  return row;
}

export function rememberInquiryOpen(username, active) {
  try {
    if (!active) {
      sessionStorage.removeItem(OPEN_KEY);
      if (sessionStorage.getItem("huangchao_resume_kind") === "inquiry") {
        sessionStorage.removeItem("huangchao_resume_kind");
      }
      return;
    }
    sessionStorage.setItem(OPEN_KEY, `${String(username || "").toUpperCase()}|${INQUIRY.id}`);
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

function commit(user, next, grant) {
  let granted = false;
  try {
    const saved = updateUser((u) => {
      if (String(u.username || "").toUpperCase() !== String(user.username || "").toUpperCase()) return;
      u.progress = u.progress || {};
      const prev = u.progress.inquiry;
      const already = !!prev?.rewarded;
      if (grant && !already) {
        u.xp = Math.max(0, (Number(u.xp) || 0) + (XP_REWARDS.inquiryOnce || 8));
        next.rewarded = true;
        granted = true;
      } else {
        next.rewarded = already || !!next.rewarded;
      }
      u.progress.inquiry = next;
      if (next.phase === "end" && next.choice && INQUIRY.endings[next.choice]) {
        const end = INQUIRY.endings[next.choice];
        const spec = { id: RELIC_ID, name: end.relic, hint: end.relicHint };
        if (!grantNamedRelic(u, spec)) {
          const list = u.progress.relics || [];
          const found = list.find((r) => r.id === RELIC_ID);
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

function clueButtons(row) {
  const bits = [];
  if ((row.seen || []).includes("notice")) {
    bits.push(`<details class="inquiry-clue"><summary>再看榜文</summary><p>${esc(INQUIRY.notice.surface)}</p>${row.noticeDetail ? `<p>${esc(INQUIRY.notice.detail)}</p>` : ""}</details>`);
  }
  if ((row.seen || []).includes("rolls")) {
    bits.push(`<details class="inquiry-clue"><summary>再看兩份名冊</summary><p>${esc(INQUIRY.examRoll)}</p><p>${esc(INQUIRY.clanRoll)}</p></details>`);
  }
  bits.push(`<details class="inquiry-clue"><summary>課業：${esc(INQUIRY.knowledge.title)}</summary><p>${esc(INQUIRY.knowledge.text)}</p></details>`);
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

function shell(title, body) {
  return `<section class="inquiry play-sheet" id="inquiry-root">
    <header class="play-bar">
      <button type="button" class="play-back" data-inquiry-home="1">返回首頁</button>
      <div class="play-bar-copy">
        <p class="play-kicker">${esc(INQUIRY.title)}</p>
        <h1 class="inquiry-title">${esc(title)}</h1>
      </div>
    </header>
    <div class="inquiry-beat">${body}</div>
  </section>`;
}

function renderOpen() {
  return shell(
    "關門之前",
    `<p class="inquiry-fiction">${esc(INQUIRY.fiction)}</p>
    <p class="inquiry-line">縣廨牆上的榜，有一行墨色特別深。</p>
    <p class="inquiry-say"><strong>韓石</strong>（虛構吏目）說：這缺向來按門第補。</p>
    <p class="inquiry-say"><strong>盧小榆</strong>（虛構考生）說：我的考試錄還在，榜是後來改的。</p>
    <p class="inquiry-goal">${esc(INQUIRY.hook)}</p>
    <div class="inquiry-actions">
      <button type="button" class="btn play-go" data-inquiry-route="notice">先看榜文</button>
      <button type="button" class="btn play-quiet" data-inquiry-route="lu">先問盧小榆</button>
    </div>`
  );
}

function renderNotice(row) {
  const known = row.route === "lu";
  const body = row.noticeDetail
    ? `<p>${esc(INQUIRY.notice.detail)}</p><p class="inquiry-note">這是虛構榜文上的改動，不是出土文書。</p>
       <button type="button" class="btn play-go" data-inquiry-next="1">帶着這個去問人</button>`
    : `<p>${esc(INQUIRY.notice.surface)}</p>
       ${known ? `<p class="inquiry-note">盧小榆要你核對深墨下面還有沒有字。</p>` : ""}
       <button type="button" class="btn play-go" data-inquiry-look="1">對着光看</button>`;
  return shell("榜文", body);
}

function renderHan(row) {
  const saw = !!row.noticeDetail;
  const line = saw
    ? "你看見了。深墨是我加的，族裡的薦牘不能白寫。任官向來看門第，考試改不了這個。"
    : "榜我改過，改完才清楚。你若要核，看薦牘，不要只聽考生。考試從來改不了任官。";
  return shell(
    "韓石",
    `<p class="inquiry-say"><strong>韓石</strong>：${esc(line)}</p>
     <button type="button" class="btn play-go" data-inquiry-next="1">繼續</button>`
  );
}

function renderLu(row) {
  const saw = !!row.noticeDetail;
  const line = saw
    ? "你已看見淡字。考試錄可以對上「依考試名次」那一行。薦牘寫的是他的族子，不是我。"
    : "先別信牆上那行深墨。考試錄寫我合格，薦牘寫的是韓氏族子。你先對名冊，再去看榜。";
  return shell(
    "盧小榆",
    `<p class="inquiry-say"><strong>盧小榆</strong>：${esc(line)}</p>
     <button type="button" class="btn play-go" data-inquiry-next="1">繼續</button>`
  );
}

function renderCompare(row) {
  const miss = row.miss ? `<p class="inquiry-miss" role="status">${esc(row.miss)}</p>` : "";
  const next = row.compareOk
    ? `<button type="button" class="btn play-go" data-inquiry-next="1">用這個去判斷</button>`
    : options(INQUIRY.compare.options, "inquiry-compare");
  return shell(
    "對照名冊",
    `<p>${esc(INQUIRY.examRoll)}</p>
     <p>${esc(INQUIRY.clanRoll)}</p>
     <p class="inquiry-ask">${esc(INQUIRY.compare.prompt)}</p>
     ${miss}
     <div class="inquiry-actions">${next}</div>
     ${clueButtons(row)}`
  );
}

function renderJudge(row) {
  const miss = row.miss ? `<p class="inquiry-miss" role="status">${esc(row.miss)}</p>` : "";
  const next = row.judgeOk
    ? `<p>${esc(INQUIRY.judge.options.find((o) => o.ok)?.feedback || "")}</p>
       <button type="button" class="btn play-go" data-inquiry-next="1">作出決定</button>`
    : options(INQUIRY.judge.options, "inquiry-judge");
  return shell(
    "哪句站得住",
    `<p class="inquiry-ask">${esc(INQUIRY.judge.prompt)}</p>
     ${miss}
     <div class="inquiry-actions">${next}</div>
     ${clueButtons(row)}`
  );
}

function renderChoice() {
  return shell(
    "這一缺今天怎麼辦",
    `<p>證據已經夠用。剩下的是你怎麼處理這張榜。兩條路都會留下不同的話，也都會寫進這個學號的存檔。</p>
     <div class="inquiry-actions">
       <button type="button" class="btn play-go" data-inquiry-choice="restore">當着兩人把榜改回考試名次</button>
       <button type="button" class="btn play-quiet" data-inquiry-choice="report">先不改榜，把兩份名冊送上去</button>
     </div>`
  );
}

function renderEnd(row, granted) {
  const end = INQUIRY.endings[row.choice] || INQUIRY.endings.restore;
  const xp = granted
    ? "經驗 +8。史績沒有加。"
    : row.rewarded
      ? "經驗已在第一次結案時發過，這次不再發。"
      : "";
  return shell(
    "這一案到此",
    `<p class="inquiry-k">你的決定</p>
     <p>${row.choice === "report" ? "先不改牆上的榜，把兩份名冊送上去。" : "當着兩人把榜改回考試名次。"}</p>
     <p class="inquiry-k">結果</p>
     <p>${esc(end.result)}</p>
     <p class="inquiry-say"><strong>韓石</strong>：${esc(end.han)}</p>
     <p class="inquiry-say"><strong>盧小榆</strong>：${esc(end.lu)}</p>
     <p class="inquiry-k">你用到的知識</p>
     <p>${esc(INQUIRY.knowledge.text)}</p>
     <p class="inquiry-k">紀念物</p>
     <p>${esc(end.relic)}。${esc(end.relicHint)}</p>
     ${xp ? `<p class="inquiry-note">${esc(xp)}</p>` : ""}
     <details class="inquiry-clue"><summary>出處（教師可查）</summary><p>${esc(INQUIRY.knowledge.source)}</p></details>
     <div class="inquiry-actions">
       <button type="button" class="btn play-quiet" data-inquiry-replay="1">再查一次</button>
       <button type="button" class="btn play-go" data-inquiry-home="1">返回首頁</button>
     </div>`
  );
}

export function renderInquiryEntry(user) {
  const row = readInquiry(user);
  if (row?.phase === "end") return "";
  const ongoing = row && row.phase && row.phase !== "open" && row.phase !== "end";
  const label = ongoing ? "繼續" : "查榜";
  return `<article class="case-entry">
    <h3>${esc(INQUIRY.title)}</h3>
    <button type="button" class="btn" data-open-inquiry="${esc(INQUIRY.id)}">${label}</button>
  </article>`;
}

export function renderInquiry(user, granted) {
  const row = readInquiry(user) || blankInquiry();
  if (row.phase === "notice") return renderNotice(row);
  if (row.phase === "han") return renderHan(row);
  if (row.phase === "lu") return renderLu(row);
  if (row.phase === "compare") return renderCompare(row);
  if (row.phase === "judge") return renderJudge(row);
  if (row.phase === "choice") return renderChoice();
  if (row.phase === "end") return renderEnd(row, granted);
  return renderOpen();
}

export function bindInquiry(user, ctx) {
  const { render, toast, state } = ctx;
  const root = document.getElementById("inquiry-root");
  if (!root) return;
  const heading = root.querySelector(".inquiry-title");
  if (heading) {
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
  const current = () => readInquiry(ctx.getUser?.() || user) || blankInquiry();

  const fail = () => toast?.("這一步未寫入。請再試一次。");

  const go = (next, grant) => {
    const saved = commit(ctx.getUser?.() || user, next, grant);
    if (!saved.ok) {
      fail();
      return;
    }
    state.inquiryGranted = !!saved.granted;
    rememberInquiryOpen((ctx.getUser?.() || user).username, next.phase !== "end");
    render();
  };

  root.querySelectorAll("[data-inquiry-home]").forEach((btn) => {
    btn.addEventListener("click", () => {
      rememberInquiryOpen(user.username, false);
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
        ...blankInquiry(row),
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
      const opt = INQUIRY.compare.options.find((o) => o.id === btn.dataset.inquiryCompare);
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
      const opt = INQUIRY.judge.options.find((o) => o.id === btn.dataset.inquiryJudge);
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
    go(blankInquiry(row));
  });
}
