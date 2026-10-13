/**
 * 人工智能素養三步。經驗只在第一次完成時發一次，不加史績。
 * 保存失敗不顯示成功。
 */
import { LITERACY, LITERACY_TASKS } from "./data/literacy.js?v=rad110";
import { XP_REWARDS } from "./data/levels.js?v=rad107";
import { filterByFormYear } from "./data/formYear.js?v=rad114";
import { updateUser } from "./storage.js?v=rad114";

const OPEN_KEY = "huangchao_literacy_open";

function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function taskById(id) {
  return LITERACY_TASKS.find((t) => t.id === id) || LITERACY_TASKS[0];
}

function finishedTaskId(prev) {
  if (prev?.taskId && taskById(prev.taskId).id === prev.taskId) return prev.taskId;
  if (prev?.phase === "end") return LITERACY_TASKS[0].id;
  return prev?.taskId || "";
}

function doneIds(prev) {
  const done = Array.isArray(prev?.doneTaskIds) ? prev.doneTaskIds.slice() : [];
  const finished = prev?.phase === "end" ? finishedTaskId(prev) : "";
  if (finished && !done.includes(finished)) done.push(finished);
  return done;
}

function tasksFor(user) {
  const list = filterByFormYear(LITERACY_TASKS, user?.formYear);
  return list.length ? list : LITERACY_TASKS.filter((t) => t.grade === "中一");
}

function pickTaskId(done, avoid, tasks) {
  const list = tasks?.length ? tasks : LITERACY_TASKS.filter((t) => t.grade === "中一");
  const skip = new Set(done);
  let pool = list.filter((t) => !skip.has(t.id));
  if (!pool.length) pool = list.filter((t) => t.id !== avoid);
  if (!pool.length) pool = list;
  return pool[0].id;
}

export function taskOf(row) {
  return taskById(row?.taskId || LITERACY_TASKS[0].id);
}

export function blankLiteracy(prev, user) {
  const done = doneIds(prev);
  const avoid = prev?.phase === "end" ? finishedTaskId(prev) : "";
  const tasks = tasksFor(user);
  return {
    id: LITERACY.id,
    version: LITERACY.version,
    taskId: pickTaskId(done, avoid, tasks),
    doneTaskIds: done,
    phase: "principle",
    principleOk: false,
    promptOk: false,
    marks: [],
    draftOk: false,
    riskAt: 0,
    miss: "",
    conduct: "",
    rewarded: !!prev?.rewarded,
    completedOnce: !!prev?.completedOnce,
  };
}

export function prepareLiteracyOpen(user) {
  const row = readLiteracy(user);
  if (row && row.phase && row.phase !== "end") {
    const allowed = tasksFor(user);
    if (!row.taskId || allowed.some((t) => t.id === row.taskId)) return { ok: true };
  }
  return commit(user, blankLiteracy(row, user));
}

export function readLiteracy(user) {
  const row = user?.progress?.literacy;
  if (!row || row.id !== LITERACY.id) return null;
  return row;
}

export function rememberLiteracyOpen(username, active) {
  try {
    if (!active) {
      sessionStorage.removeItem(OPEN_KEY);
      if (sessionStorage.getItem("huangchao_resume_kind") === "literacy") {
        sessionStorage.removeItem("huangchao_resume_kind");
      }
      return;
    }
    sessionStorage.setItem(OPEN_KEY, `${String(username || "").toUpperCase()}|${LITERACY.id}`);
    sessionStorage.setItem("huangchao_resume_kind", "literacy");
  } catch {
    /* 分頁狀態寫唔到時，仍可從首頁繼續 */
  }
}

export function recallLiteracyOpen(username) {
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

function commit(user, next) {
  let granted = false;
  try {
    const saved = updateUser((u) => {
      if (String(u.username || "").toUpperCase() !== String(user.username || "").toUpperCase()) return;
      u.progress = u.progress || {};
      const prev = u.progress.literacy;
      const already = !!prev?.rewarded;
      const finishing = next.phase === "end" && next.conduct === "own";
      if (finishing && !already) {
        u.xp = Math.max(0, (Number(u.xp) || 0) + (XP_REWARDS.literacyOnce || 8));
        next.rewarded = true;
        next.completedOnce = true;
        granted = true;
      } else {
        next.rewarded = already || !!next.rewarded;
        next.completedOnce = !!prev?.completedOnce || !!next.completedOnce || finishing;
      }
      u.progress.literacy = next;
    });
    return saved ? { ok: true, granted } : { ok: false, granted: false };
  } catch {
    return { ok: false, granted: false };
  }
}

function shell(title, body, task) {
  return `<section class="inquiry play-sheet literacy-view" id="literacy-root">
    <div class="inquiry-top">
      <button type="button" class="play-back" data-literacy-home="1">返回首頁</button>
    </div>
    <header class="inquiry-head">
      <p class="inquiry-k">人工智能素養 · ${esc(title)} · ${esc(task.topic)}</p>
      <h1 class="inquiry-title">${esc(LITERACY.title)}</h1>
    </header>
    <div class="inquiry-beat">${body}</div>
  </section>`;
}

function missLine(row) {
  return row.miss ? `<p class="inquiry-miss" role="status">${esc(row.miss)}</p>` : "";
}

function options(list, attr) {
  return list
    .map(
      (opt) =>
        `<button type="button" class="inquiry-option" data-${attr}="${esc(opt.id)}">${esc(opt.text)}</button>`
    )
    .join("");
}

function principleOptions(task) {
  return [
    {
      id: "text",
      text: "它查了正史原文，所以這句是史實",
      ok: false,
      why: task.sourceWhy,
    },
    {
      id: "pattern",
      text: "它跟着例子裡重複出現的說法，接出下一句",
      ok: true,
      why: "",
    },
    {
      id: "moral",
      text: "它自己判斷誰對誰錯，所以這樣寫",
      ok: false,
      why: "人工智能沒有道德意識。它是在例子裡找重複的說法，不是在責備誰。",
    },
  ];
}

function homeworkOptions(task) {
  return [
    {
      id: "paste",
      text: "三段原句照交，當作自己的答案",
      ok: false,
      why: "這三段是示範回答的原句，而且有兩句史實不對。不能把人工智能的文字當成自己寫的。",
    },
    { id: "own", text: task.ownText, ok: true, why: "" },
  ];
}

function risksOf(task) {
  return [
    {
      id: "hallucination",
      ask: task.halluAsk,
      options: [
        { id: "hallucination", text: "幻覺：生成的內容可以很順，卻不符事實", ok: true },
        {
          id: "power",
          text: "算力不夠，所以它少寫了出處",
          ok: false,
          why: task.halluWhy,
        },
      ],
    },
    {
      id: "bias",
      ask: task.biasAsk,
      options: [
        { id: "bias", text: "數據偏見：例子一面倒，輸出就跟着偏", ok: true },
        {
          id: "feel",
          text: "它自己有立場，所以這樣寫",
          ok: false,
          why: "它沒有道德意識，也不會覺得誰該被責備。它是跟着例子裡重複的說法。",
        },
      ],
    },
    {
      id: "duty",
      ask: "用完這段回答，你要守住的是什麼？",
      options: [
        {
          id: "copy",
          text: "原句抄下當自己的功課，省得再查",
          ok: false,
          why: "這違反學術誠信，而且有兩句史實不對。最終答案要由你負責。",
        },
        {
          id: "own",
          text: "不交姓名班號，剔走錯句，用自己核對過的句子作答",
          ok: true,
        },
      ],
    },
  ];
}

function principleHtml(row) {
  const task = taskOf(row);
  const slips = task.slips
    .map((text, i) => `<p class="lit-slip"><span>例子 ${i + 1}</span>${esc(text)}</p>`)
    .join("");
  const after = row.principleOk
    ? `<p class="inquiry-note">${esc(LITERACY.principleNote)}</p>
       <ul class="lit-factors">
         ${LITERACY.factors.map((f) => `<li><strong>${esc(f.name)}</strong>　${esc(f.text)}</li>`).join("")}
       </ul>
       <div class="inquiry-actions">
         <button type="button" class="btn play-go" data-literacy-next="prompt">帶着這三樣去做功課</button>
       </div>`
    : `<p class="inquiry-ask">這句輸出跟的是什麼？</p>
       ${missLine(row)}
       <div class="inquiry-actions">${options(principleOptions(task), "literacy-principle")}</div>`;
  return shell(
    "運作原理",
    `<p class="inquiry-fiction">${esc(LITERACY.fiction)}</p>
     <p>下面三張是模擬訓練例子，不是史料。這個工具只看過這三張。</p>
     <div class="lit-slips">${slips}</div>
     <p class="inquiry-ask">有人問：${esc(task.ask)}</p>
     <p class="lit-output">${esc(task.output)}</p>
     ${after}`,
    task
  );
}

function promptHtml(row) {
  const task = taskOf(row);
  return shell(
    "一起做功課",
    `<p class="inquiry-fiction">${esc(LITERACY.fiction)}</p>
     <p>你的功課是用自己的句子，${esc(task.homework)}</p>
     <p class="inquiry-ask">${esc(LITERACY.promptAsk)}</p>
     ${missLine(row)}
     <div class="inquiry-actions">${options(LITERACY.promptOptions, "literacy-prompt")}</div>`,
    task
  );
}

function draftHtml(row) {
  const task = taskOf(row);
  const marks = Array.isArray(row.marks) ? row.marks : [];
  const sentences = task.sentences
    .map((s) => {
      const on = marks.includes(s.id);
      return `<button type="button" class="lit-sentence${on ? " is-mark" : ""}" data-literacy-mark="${esc(s.id)}" aria-pressed="${on ? "true" : "false"}">${esc(s.text)}</button>`;
    })
    .join("");
  const choose = row.draftOk
    ? `<p class="inquiry-ask">${esc(LITERACY.homeworkAsk)}</p>
       ${missLine(row)}
       <div class="inquiry-actions">${options(homeworkOptions(task), "literacy-homework")}</div>`
    : `${missLine(row)}
       <div class="inquiry-actions">
         <button type="button" class="btn play-go" data-literacy-draft="1">用標好的句子去作答</button>
       </div>`;
  return shell(
    "一起做功課",
    `<p>${esc(LITERACY.draftLead)}</p>
     <p class="inquiry-note">點句子會標上記號。標錯可以再點一次。</p>
     <div class="lit-doc">${sentences}</div>
     ${choose}`,
    task
  );
}

function riskHtml(row) {
  const task = taskOf(row);
  const risks = risksOf(task);
  const item = risks[row.riskAt] || risks[0];
  return shell(
    "反思風險",
    `<p class="inquiry-fiction">你已經交了自己核對過的句子。再把剛才看見的限制說清楚。</p>
     <p class="inquiry-ask">${esc(item.ask)}</p>
     ${missLine(row)}
     <div class="inquiry-actions">${options(item.options, "literacy-risk")}</div>`,
    task
  );
}

function endHtml(row, granted, user) {
  const task = taskOf(row);
  const xp = granted
    ? `經驗 +${XP_REWARDS.literacyOnce || 8}。史績沒有加。`
    : row.rewarded
      ? "經驗已在第一次完成時發過，這次不再發。"
      : "這次經驗未寫入。請再試一次。";
  const retry = !row.rewarded && row.conduct === "own"
    ? `<button type="button" class="btn play-go" data-literacy-grant="1">再試寫入經驗</button>`
    : "";
  const next = taskById(pickTaskId(doneIds(row), finishedTaskId(row), tasksFor(user)));
  return shell(
    "三步都做了",
    `<p class="inquiry-k">這次功課怎樣完</p>
     <p>這一題是${esc(task.topic)}。你沒有抄示範回答，交了自己核對過的句子。</p>
     <p class="inquiry-k">你的決定</p>
     <p>問法裡不寫姓名和班號。兩句說錯的都剔走了。</p>
     <p class="inquiry-k">最要核對的一句</p>
     <p>${esc(task.knowledge)}</p>
     <p class="inquiry-k">學到的三部分</p>
     <p>運作原理：輸出跟着數據裡的重複說法，靠算法去找，算力讓它看得快。這是機器學習，不是讀懂歷史。</p>
     <p>一起做功課：你決定問法，你核對內容，最終答案由你負責。</p>
     <p>反思風險：幻覺會把錯的史實寫得很順；數據偏見讓一面倒的例子變成答案；不要交出個人資料；不要把人工智能的句子當成自己的功課。它沒有道德意識，不會自己停下來。</p>
     <p class="inquiry-note">${esc(xp)}</p>
     <p class="inquiry-note">下一題：${esc(next.topic)}。做完才換，未做完不會換。</p>
     <details class="inquiry-clue"><summary>給老師的對照</summary><p>${esc(LITERACY.teacher)}</p></details>
     <div class="inquiry-actions">
       ${retry}
       <button type="button" class="btn play-quiet" data-literacy-replay="1">下一題</button>
       <button type="button" class="btn play-go" data-literacy-home="1">返回首頁</button>
     </div>`,
    task
  );
}

export function renderLiteracyEntry(user) {
  const row = readLiteracy(user);
  const tasks = tasksFor(user);
  const ongoing = row && row.phase && row.phase !== "end";
  const current = ongoing || row?.taskId ? taskOf(row) : taskById(pickTaskId(doneIds(row), "", tasks));
  const next = taskById(pickTaskId(doneIds(row), row?.phase === "end" ? finishedTaskId(row) : "", tasks));
  const label = ongoing ? "繼續這三步" : row?.phase === "end" ? "下一題" : "開始這三步";
  const hook = ongoing
    ? `這一題未做完：${current.topic}。做完才換下一題。`
    : row?.phase === "end"
      ? `下一題：${next.topic}。${next.card}`
      : `用一題中史功課，學運作原理、一起做功課，以及用完要反思的風險。這一題：${current.topic}。`;
  return `<article class="case-entry">
    <p class="case-tags">約${LITERACY.minutes}分鐘｜人工智能素養｜中史功課</p>
    <h3>${esc(LITERACY.title)}</h3>
    <p>${esc(hook)}</p>
    <button type="button" class="btn" data-open-literacy="${esc(LITERACY.id)}">${label}</button>
  </article>`;
}

export function renderLiteracy(user, granted) {
  const row = readLiteracy(user) || blankLiteracy(null, user);
  if (row.phase === "prompt") return promptHtml(row);
  if (row.phase === "draft") return draftHtml(row);
  if (row.phase === "risk") return riskHtml(row);
  if (row.phase === "end") return endHtml(row, !!granted, user);
  return principleHtml(row);
}

function paint(ctx, user, next, result) {
  if (!result.ok) {
    ctx.toast?.("進度未儲存，這三步可以再試。請再試一次。");
    return;
  }
  ctx.state.literacyGranted = !!result.granted;
  rememberLiteracyOpen(user.username, next.phase !== "end");
  ctx.render?.();
}

export function bindLiteracy(user, ctx) {
  const root = document.getElementById("literacy-root");
  if (!root || root.dataset.bound === "1") return;
  root.dataset.bound = "1";
  const heading = root.querySelector(".inquiry-title");
  if (heading) {
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
  const live = readLiteracy(user);
  rememberLiteracyOpen(user.username, live?.phase !== "end");
  const row = () => readLiteracy(ctx.getUser?.() || user) || blankLiteracy(readLiteracy(user), user);

  root.querySelector("[data-literacy-home]")?.addEventListener("click", () => {
    rememberLiteracyOpen(user.username, false);
    ctx.state.view = "home";
    ctx.render?.();
  });

  root.querySelectorAll("[data-literacy-principle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cur = row();
      const opt = principleOptions(taskOf(cur)).find((o) => o.id === btn.dataset.literacyPrinciple);
      const next = opt.ok
        ? { ...cur, principleOk: true, miss: "" }
        : { ...cur, principleOk: false, miss: opt.why };
      paint(ctx, user, next, commit(user, next));
    });
  });

  root.querySelector("[data-literacy-next]")?.addEventListener("click", () => {
    const cur = row();
    if (!cur.principleOk) return;
    paint(ctx, user, cur, commit(user, { ...cur, phase: "prompt", miss: "" }));
  });

  root.querySelectorAll("[data-literacy-prompt]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const opt = LITERACY.promptOptions.find((o) => o.id === btn.dataset.literacyPrompt);
      if (!opt) return;
      const cur = row();
      const next = opt.ok
        ? { ...cur, phase: "draft", promptOk: true, miss: "", marks: [], draftOk: false }
        : { ...cur, promptOk: false, miss: opt.why };
      paint(ctx, user, next, commit(user, next));
    });
  });

  root.querySelectorAll("[data-literacy-mark]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.literacyMark;
      const cur = row();
      if (cur.draftOk) return;
      const marks = Array.isArray(cur.marks) ? cur.marks.slice() : [];
      const i = marks.indexOf(id);
      if (i >= 0) marks.splice(i, 1);
      else marks.push(id);
      const sentence = taskOf(cur).sentences.find((s) => s.id === id);
      const miss = sentence && !sentence.bad && marks.includes(id) ? taskOf(cur).sentenceMiss.fact : "";
      paint(ctx, user, cur, commit(user, { ...cur, marks, miss }));
    });
  });

  root.querySelector("[data-literacy-draft]")?.addEventListener("click", () => {
    const cur = row();
    const marks = Array.isArray(cur.marks) ? cur.marks : [];
    const task = taskOf(cur);
    if (marks.includes("fact")) {
      paint(ctx, user, cur, commit(user, { ...cur, miss: task.sentenceMiss.fact }));
      return;
    }
    const bad = task.sentences.filter((s) => s.bad).map((s) => s.id);
    if (!bad.every((id) => marks.includes(id))) {
      paint(ctx, user, cur, commit(user, { ...cur, miss: task.sentenceMiss.need }));
      return;
    }
    paint(ctx, user, cur, commit(user, { ...cur, draftOk: true, miss: "" }));
  });

  root.querySelectorAll("[data-literacy-homework]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cur = row();
      const opt = homeworkOptions(taskOf(cur)).find((o) => o.id === btn.dataset.literacyHomework);
      const next = opt.ok
        ? { ...cur, phase: "risk", conduct: "own", draftOk: true, riskAt: 0, miss: "" }
        : { ...cur, conduct: "", miss: opt.why };
      paint(ctx, user, next, commit(user, next));
    });
  });

  root.querySelectorAll("[data-literacy-risk]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cur = row();
      const risks = risksOf(taskOf(cur));
      const item = risks[cur.riskAt] || risks[0];
      const opt = item.options.find((o) => o.id === btn.dataset.literacyRisk);
      if (!opt) return;
      if (!opt.ok) {
        paint(ctx, user, cur, commit(user, { ...cur, miss: opt.why }));
        return;
      }
      const last = cur.riskAt >= risks.length - 1;
      const done = Array.isArray(cur.doneTaskIds) ? cur.doneTaskIds.slice() : [];
      const taskId = cur.taskId || taskOf(cur).id;
      if (last && taskId && !done.includes(taskId)) done.push(taskId);
      const next = last
        ? { ...cur, phase: "end", taskId, doneTaskIds: done, riskAt: risks.length, miss: "", conduct: "own" }
        : { ...cur, riskAt: cur.riskAt + 1, miss: "" };
      paint(ctx, user, next, commit(user, next));
    });
  });

  root.querySelector("[data-literacy-replay]")?.addEventListener("click", () => {
    const cur = row();
    paint(ctx, user, cur, commit(user, blankLiteracy(cur, ctx.getUser?.() || user)));
  });

  root.querySelector("[data-literacy-grant]")?.addEventListener("click", () => {
    const cur = row();
    if (cur.phase !== "end" || cur.conduct !== "own") return;
    paint(ctx, user, cur, commit(user, { ...cur }));
  });
}
