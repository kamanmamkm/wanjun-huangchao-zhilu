/**
 * 七國行記：公元前318年。第一程只跑韓境、魏境、河渡。
 * 第二程在同一條路核對趙、燕、齊、楚、秦。修魚戰果不改。
 * 通行文書、五個人口中的條件，是這趟任務的安排，不是史料原句。
 * 阿禾在韓境交出的期限，到河渡先用到；文書在河渡取得，回到魏境糧車才走。
 */

function bit(v) {
  return v ? 1 : 0;
}

function num(v, max) {
  return Math.max(0, Math.min(max, Number(v) || 0));
}

export function taleRow(raw) {
  return {
    book: bit(raw?.book),
    bookDone: bit(raw?.bookDone),
    bookPay: bit(raw?.bookPay),
    bookSkip: bit(raw?.bookSkip),
    post: num(raw?.post, 3),
    beat: num(raw?.beat, 4),
    walk: bit(raw?.walk),
    letter: bit(raw?.letter),
    term: bit(raw?.term),
    log: bit(raw?.log),
    passDoc: bit(raw?.passDoc),
    told: bit(raw?.told),
    cart: bit(raw?.cart),
    rush: bit(raw?.rush),
    fake: bit(raw?.fake),
    pact: bit(raw?.pact),
    pactDone: bit(raw?.pactDone),
    pactPay: bit(raw?.pactPay),
    pactSkip: bit(raw?.pactSkip),
    pactPost: num(raw?.pactPost, 5),
    pactBeat: num(raw?.pactBeat, 5),
    pactWalk: bit(raw?.pactWalk),
    pactSlip: num(raw?.pactSlip, 31),
  };
}

export function taleActive(row) {
  return !!row?.book && !row?.bookDone;
}

export function taleOffer(row) {
  if (!row || row.book || row.bookDone || row.bookSkip) return false;
  return true;
}

export function taleWalking(row) {
  return taleActive(row) && !!row.walk;
}

export function pactActive(row) {
  return !!row?.bookDone && !!row?.pact && !row?.pactDone;
}

export function pactOffer(row) {
  if (!row?.bookDone || row.pact || row.pactDone || row.pactSkip) return false;
  return true;
}

export function pactWalking(row) {
  return pactActive(row) && !!row.pactWalk;
}

const POSTS = ["韓境驛站", "魏境糧場", "河渡", "魏境糧場"];

export function talePath(row) {
  const tale = taleRow(row);
  return POSTS.map((name, index) => {
    const here = index === tale.post || (index === 1 && tale.post === 3);
    const past = index < tale.post && !(index === 1 && tale.post === 3);
    const cls = here ? "is-now" : past ? "is-past" : "";
    return `<span class="${cls}">${esc(name)}</span>`;
  }).join("");
}

export function taleGoal(row) {
  const tale = taleRow(row);
  if (!taleActive({ ...row, ...tale })) return "";
  if (tale.walk && tale.post === 0) return "去魏境糧場，把求援信交給裴叔";
  if (tale.walk && tale.post === 1) return "去河渡，對照求援信同告示";
  if (tale.walk && tale.post === 2) return "返回魏境糧場，交出通行文書";
  if (tale.post === 0) return "聽阿禾把求援信交托";
  if (tale.post === 1) return "查清糧車為何還未走";
  if (tale.post === 2) return "對照兩份文字，再決定文書";
  if (tale.beat <= 0) return "把通行文書交給裴叔";
  if (tale.beat === 1) return "看糧車出發之後，誰知道這件事";
  return "看完史實、爭議同這趟虛構";
}

function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function doc(title, text) {
  return `<div class="voyage-doc"><b>${esc(title)}</b>${esc(text)}</div>`;
}

function intel(lines) {
  return lines.map((line) => `<p class="voyage-story">${esc(line)}</p>`).join("");
}

function choice(action, text) {
  return `<button type="button" class="voyage-choice" data-tale="${esc(action)}">${esc(text)}</button>`;
}

export function taleOfferHtml() {
  return `<p class="voyage-who">阿禾</p><p class="voyage-line">我的腿受傷了。這封求援信要送到魏境糧場，裴叔才會發糧。我家還在等我。</p>
    <div class="voyage-choices">
      ${choice("accept", "我替你送。信我先收好。")}
      ${choice("ask", "我替你送。先問清期限。")}
      ${choice("skip", "我先沿原來的路走。")}
    </div>`;
}

function notes(tale) {
  const lines = [];
  if (tale.term) lines.push("已查證：求援信寫明十天內送到。");
  else if (tale.letter) lines.push("待查：期限寫在信上，你還沒有打開看。");
  if (tale.log) lines.push("已查證：糧已裝車，車仍在場，未有文書。");
  else if (tale.post >= 1) lines.push("轉述：裴叔說糧車還沒有走。");
  if (tale.fake) lines.push("對不上：求援信不能代替通行文書。");
  if (tale.passDoc) lines.push("已查證：通行文書准糧車過河。這張文書是任務安排。");
  else if (tale.post >= 2) lines.push("待查：河渡告示寫沒有文書不能過河。");
  if (tale.told) lines.push("已查證：阿蓉知道糧車會過河。");
  else if (tale.post >= 2) lines.push("轉述：阿蓉說趙境軍士的家屬要知道糧幾時到。");
  if (tale.cart) lines.push("已查證：糧車已經出發。");
  return intel(lines);
}

export function taleHtml(row) {
  const tale = taleRow(row);
  if (tale.walk) {
    return `<p class="voyage-who">你</p><p class="voyage-line">${esc(taleGoal(row))}</p>${notes(tale)}`;
  }
  if (tale.post === 0 && tale.beat <= 0) return taleOfferHtml();
  if (tale.post === 0) {
    const term = tale.term
      ? "期限是十天內。信上寫了，我記下了。"
      : "期限寫在信上。上路前可以打開看。";
    return `<p class="voyage-who">阿禾</p><p class="voyage-line">信還是求援信。附頁先不要拆，送到再看。${term}我家等我回來。</p>
      ${doc("求援信", "韓境請魏境把已裝的軍糧送出。十天內送到。道路通不通，信上沒有寫。附頁是會盟草案，送到才可拆。")}
      <div class="voyage-choices">
        ${tale.term ? "" : choice("read", "打開信，看清期限。")}
        ${choice("depart", "去魏境糧場。")}
      </div>${notes(tale)}`;
  }
  if (tale.post === 1) {
    const rush = tale.rush ? `<p class="voyage-miss">裴叔說車不能先走。沒有文書，過不了河。</p>` : "";
    const body = tale.log
      ? doc("糧運紀錄", "糧已裝車。車仍在場。未有文書。")
      : `<p class="voyage-line">求援信我收下了。糧已裝車，車還沒有走。借道的文書未到。</p>`;
    return `<p class="voyage-who">裴叔</p>${body}${rush}<div class="voyage-choices">
      ${tale.log ? "" : choice("log", "睇糧運紀錄。")}
      ${choice("rush", "叫糧車先出發。")}
      ${choice("depart", "去河渡核對告示。")}
    </div>${notes(tale)}`;
  }
  if (tale.post === 2 && !tale.passDoc) {
    const fake = tale.fake ? `<p class="voyage-miss">兩份對不上。求援信沒有寫道路已通，不能當作通行文書。</p>` : "";
    const termBtn = tale.term ? "" : choice("read", "先看信上的期限。");
    return `<p class="voyage-who">阿蓉</p><p class="voyage-line">丈夫是趙境軍士。出兵前，家裡要知道糧幾時到。</p>
      ${doc("求援信", tale.term ? "請魏境運糧。十天內送到。道路是否已通，信上沒有寫。" : "請魏境運糧。道路是否已通，信上沒有寫。")}
      ${doc("渡口告示", "沒有通行文書，糧車不得過河借道。")}
      ${fake}
      <div class="voyage-choices">
        ${termBtn}
        ${tale.log ? "" : choice("log", "補看糧運紀錄。")}
        ${choice("permit", "按告示辦通行文書。")}
        ${choice("fake", "拿求援信當作文書。")}
      </div>${notes(tale)}`;
  }
  if (tale.post === 2) {
    return `<p class="voyage-who">阿蓉</p><p class="voyage-line">文書辦好了。這張是這趟送信的安排，不是史書記過的外交文件。</p>
      ${doc("通行文書", "准魏境這輛糧車過河。糧運紀錄要對得上。")}
      <div class="voyage-choices">
        ${choice("tell-go", "告訴阿蓉糧車會過河，再回糧場。")}
        ${choice("depart", "先回糧場，回頭再通知。")}
      </div>${notes(tale)}`;
  }
  if (tale.beat <= 0) {
    return `<p class="voyage-who">裴叔</p><p class="voyage-line">文書同糧運紀錄對得上。車可以走了。</p>
      <div class="voyage-choices">${choice("roll", "讓糧車出發。")}</div>${notes(tale)}`;
  }
  if (tale.beat === 1) {
    const family = tale.told
      ? "阿蓉在河渡已開始收拾。她說知道糧食在路上。"
      : "阿蓉還不知道車已走。";
    const term = tale.term
      ? "你在韓境就看過期限，這趟趕得上阿禾說的十天。"
      : "期限是你上路之後才補看的。信還是同一封。";
    return `<p class="voyage-who">裴叔</p><p class="voyage-line">糧車走了。${family}${term}</p>
      <div class="voyage-choices">
        ${tale.told ? "" : choice("tell", "補通知阿蓉。")}
        ${choice("draft", "打開求援信的附頁。")}
      </div>${notes(tale)}`;
  }
  return `<p class="voyage-who">附頁</p>
    <p class="voyage-line">求援信還是求援信。附頁另寫各國怎樣出兵、運糧，那是盟書草案，不是這封信變成的。</p>
    ${doc("真實歷史", "公元前318年，楚懷王在位第十一年。《史記·楚世家》寫他這一年被推為合縱的約長。《史記·秦本紀》寫韓、趙、魏、燕、齊攻秦，秦軍在修魚打敗聯軍。")}
    ${doc("史料記載或有爭議", "兩篇細節不完全相同。楚世家提到打到函谷關後退兵，又把這次約從寫在蘇秦名下；秦本紀寫的是修魚之戰。齊出了多少力，各篇也不一致。所以蘇秦不在這趟出場。")}
    ${doc("遊戲虛構", "你、阿禾、裴叔、阿蓉、求援信、通行文書，以及糧車要等你辦好文書才出發。修魚的戰果沒有改寫。")}
    ${doc("你的選擇", resultLine(tale))}
    <div class="voyage-choices">${choice("finish", "看完，記下這程。")}</div>`;
}

function resultLine(tale) {
  const parts = [
    tale.term ? "在韓境就看過期限。" : "期限是路上才補看的。",
    tale.passDoc ? "在河渡辦了通行文書。" : "還沒有文書。",
    tale.told ? "有通知阿蓉。" : "回糧場後才補通知，或尚未通知。",
    tale.cart ? "糧車已出發。" : "糧車未走。",
    tale.rush ? "曾叫糧車先走，裴叔沒有答應。" : "沒有催車先走。",
  ];
  return parts.join("");
}

const PACT_POSTS = ["趙境", "燕境", "齊境", "楚境", "秦境", "對條件"];

const SORTS = [
  { say: "出兵要等糧到。", ok: "趙", bad: ["燕", "齊"], miss: "這句是趙牧說的。趙境出兵，要等糧到。" },
  { say: "等約長的信到了再動。", ok: "燕", bad: ["楚", "秦"], miss: "這句是燕成核對的。燕國等約長的信，不是現在就開拔。" },
  { say: "先看到楚國約長的信，才出兵。", ok: "齊", bad: ["趙", "燕"], miss: "這句是齊寅說的。齊境要先收到約長的信。" },
  { say: "約長是楚懷王。", ok: "楚", bad: ["秦", "齊"], miss: "楚簡說約長是楚懷王。蘇秦不在這份記錄上。" },
  { say: "秦不在這份合縱上。", ok: "秦", bad: ["楚", "燕"], miss: "秦雍說秦不簽這份約。修魚的戰果不能改。" },
];

function slipOn(tale, index) {
  return (tale.pactSlip & (1 << index)) !== 0;
}

function slipSet(tale, index) {
  return tale.pactSlip | (1 << index);
}

export function pactPath(row) {
  const tale = taleRow(row);
  return PACT_POSTS.map((name, index) => {
    const here = index === tale.pactPost;
    const past = index < tale.pactPost;
    const cls = here ? "is-now" : past ? "is-past" : "";
    return `<span class="${cls}">${esc(name)}</span>`;
  }).join("");
}

export function pactGoal(row) {
  const tale = taleRow(row);
  if (!pactActive({ ...row, ...tale })) return "";
  if (tale.pactWalk && tale.pactPost === 0) return "去找趙牧，核對糧期";
  if (tale.pactWalk && tale.pactPost === 1) return "去找燕成，核對燕國那句";
  if (tale.pactWalk && tale.pactPost === 2) return "去找齊寅，聽齊國的條件";
  if (tale.pactWalk && tale.pactPost === 3) return "去找楚簡，看誰是約長";
  if (tale.pactPost === 0) return "聽趙牧怎樣說出兵";
  if (tale.pactPost === 1) return "聽燕成手裡的一句";
  if (tale.pactPost === 2) return "聽齊寅要先看到什麼";
  if (tale.pactPost === 3) return "聽楚簡誰是約長";
  if (tale.pactPost === 4) return "聽秦雍怎麼說這次出兵";
  if (tale.pactBeat < 5) return "把這句放回對的國";
  return "看完史實、爭議同這趟虛構";
}

export function pactOfferHtml() {
  return `<p class="voyage-who">附頁</p><p class="voyage-line">草案寫韓、趙、魏、燕、齊攻秦，約長是楚。這五句還沒有跟人核對。</p>
    <div class="voyage-choices">
      ${choice("pact", "沿路核對這五句。")}
      ${choice("pact-skip", "我先沿原來的路走。")}
    </div>`;
}

function pactButtons(tale, spin) {
  const step = SORTS[tale.pactBeat];
  if (!step) return "";
  const items = [step.ok, ...step.bad];
  const turn = (Number(spin) + tale.pactBeat) % items.length;
  const ordered = items.slice(turn).concat(items.slice(0, turn));
  return ordered.map((name) => choice(`sort:${name}`, `這句是${name}境`)).join("");
}

function pactPage(who, line, buttons, docs, row) {
  const miss = row.miss ? `<p class="voyage-miss">${esc(row.miss)}</p>` : "";
  return `<p class="voyage-who">${esc(who)}</p><p class="voyage-line">${esc(line)}</p><div class="voyage-choices">${buttons}</div>${miss}${docs}`;
}

export function pactHtml(row) {
  const tale = taleRow(row);
  if (tale.pactWalk) {
    return `<p class="voyage-who">你</p><p class="voyage-line">${esc(pactGoal(row))}</p>`;
  }
  if (tale.pactPost === 0) {
    const heard = tale.told ? "阿蓉已知糧車過河。" : "阿蓉還未必知道糧車已走。";
    return pactPage(
      "趙牧",
      `我是趙境軍士。出兵要等糧到。阿蓉問的是這個期限。${heard}`,
      `${slipOn(tale, 0) ? "" : choice("zhao-rush", "當成趙境已經開拔。")}
        ${tale.told ? "" : choice("zhao-tell", "告訴他糧車已過河。")}
        ${choice("pact-depart", "去找燕成。")}`,
      doc("草案", "趙出兵。沒有寫要等糧。"),
      row
    );
  }
  if (tale.pactPost === 1) {
    return pactPage(
      "燕成",
      "我核對的一句是：等約長的信到了再動。草案寫燕出兵。兩句要分開放。",
      `${slipOn(tale, 1) ? "" : choice("yan-same", "當成同草案一樣，現在出兵。")}
        ${choice("pact-depart", "去找齊寅。")}`,
      doc("草案", "燕出兵。沒有寫等信。"),
      row
    );
  }
  if (tale.pactPost === 2) {
    return pactPage(
      "齊寅",
      "齊境要先收到約長的信，才把出兵回報上去。草案寫五國同時，這句還沒有對上。",
      `${slipOn(tale, 2) ? "" : choice("qi-same", "當成看見名單就出發。")}
        ${choice("pact-depart", "去找楚簡。")}`,
      doc("草案", "五國同時出兵。沒有寫齊要先看約長的信。"),
      row
    );
  }
  if (tale.pactPost === 3) {
    return pactPage(
      "楚簡",
      "草案開頭應是楚懷王為約長。這是楚國這份記錄。蘇秦的名字不在上面。",
      `${slipOn(tale, 3) ? "" : choice("chu-other", "約長寫成蘇秦。")}
        ${choice("pact-depart", "去找秦雍。")}`,
      doc("楚國記錄", "約長是楚懷王。蘇秦不在這份上面。"),
      row
    );
  }
  if (tale.pactPost === 4) {
    return pactPage(
      "秦雍",
      "秦不簽這份約。若五國來攻，史書記的是修魚。這句我改不了。",
      `${slipOn(tale, 4) ? "" : choice("qin-sign", "當成秦簽了約。")}
        ${choice("pact-sort", "把五句放回各國。")}`,
      doc("秦境", "秦不在合縱裡。修魚的戰果不改。"),
      row
    );
  }
  if (tale.pactBeat < 5) {
    const step = SORTS[tale.pactBeat];
    return pactPage(
      "對條件",
      step.say,
      pactButtons(tale, row.spin),
      "",
      row
    );
  }
  return `<p class="voyage-who">附頁</p>
    <p class="voyage-line">五句都放回對的國。求援信還是求援信。草案仍是草案。</p>
    <div class="voyage-choices">${choice("pact-finish", "看完，記下這程。")}</div>
    ${doc("真實歷史", "公元前318年，楚懷王在位第十一年。《史記·楚世家》寫他這一年被推為合縱的約長。《史記·秦本紀》寫韓、趙、魏、燕、齊攻秦，秦軍在修魚打敗聯軍。")}
    ${doc("史料記載或有爭議", "兩篇細節不完全相同。楚世家提到打到函谷關後退兵，又把這次約從寫在蘇秦名下；秦本紀寫的是修魚之戰。齊出了多少力，各篇也不一致。所以蘇秦不在這趟出場。")}
    ${doc("遊戲虛構", "趙牧、燕成、齊寅、楚簡、秦雍口中的條件，以及你、阿禾、裴叔、阿蓉、求援信、通行文書。修魚的戰果沒有改寫。")}
    ${doc("你的選擇", `${resultLine(tale)}${pactResult(tale)}`)}`;
}

function pactResult(tale) {
  const bits = [
    slipOn(tale, 0) ? "趙境那句曾放錯。" : "",
    slipOn(tale, 1) ? "燕境那句曾放錯。" : "",
    slipOn(tale, 2) ? "齊境那句曾放錯。" : "",
    slipOn(tale, 3) ? "約長那句曾放錯。" : "",
    slipOn(tale, 4) ? "秦境那句曾放錯。" : "",
  ].filter(Boolean);
  return bits.length ? bits.join("") : "五句都按他們親口說的放回。";
}

function pactApply(next, tale, action) {
  const stay = () => next;
  if (action === "zhao-rush" && tale.pactPost === 0) {
    return { ...next, pactSlip: slipSet(tale, 0), miss: "趙牧說還沒有開拔。出兵要等糧到。" };
  }
  if (action === "zhao-tell" && tale.pactPost === 0) return { ...next, told: 1, miss: "" };
  if (action === "yan-same" && tale.pactPost === 1) {
    return { ...next, pactSlip: slipSet(tale, 1), miss: "兩句不是同一件。草案寫出兵，燕成說等約長的信。" };
  }
  if (action === "qi-same" && tale.pactPost === 2) {
    return { ...next, pactSlip: slipSet(tale, 2), miss: "齊寅說要先收到約長的信，不是看見名單就出發。" };
  }
  if (action === "chu-other" && tale.pactPost === 3) {
    return { ...next, pactSlip: slipSet(tale, 3), miss: "楚簡說蘇秦不在這份記錄上。約長是楚懷王。" };
  }
  if (action === "qin-sign" && tale.pactPost === 4) {
    return { ...next, pactSlip: slipSet(tale, 4), miss: "秦雍說秦不簽約。修魚的戰果不能改。" };
  }
  if (action === "pact-depart" && tale.pactPost < 4) return { ...next, pactWalk: 1, miss: "" };
  if (action === "pact-sort" && tale.pactPost === 4) return { ...next, pactPost: 5, pactBeat: 0, pactWalk: 0, miss: "" };
  if (action.startsWith("sort:") && tale.pactPost === 5 && tale.pactBeat < 5) {
    const step = SORTS[tale.pactBeat];
    const picked = action.slice(5);
    if (picked === step.ok) return { ...next, pactBeat: tale.pactBeat + 1, miss: "" };
    return { ...next, pactSlip: slipSet(tale, tale.pactBeat), miss: step.miss };
  }
  if (action === "pact-finish" && tale.pactPost === 5 && tale.pactBeat >= 5) {
    return { ...next, pact: 0, pactDone: 1, pactPay: 1, pactWalk: 0, miss: "" };
  }
  if (action === "arrive" && tale.pactWalk && tale.pactPost < 4) {
    return { ...next, pactPost: tale.pactPost + 1, pactBeat: 0, pactWalk: 0, miss: "" };
  }
  return stay();
}

export function taleApply(row, action) {
  const tale = taleRow(row);
  const next = { ...row, ...tale, miss: "" };
  const stay = () => next;
  if (action === "pact-skip" && tale.bookDone && !tale.pactDone) return { ...next, pactSkip: 1 };
  if (action === "pact" && tale.bookDone && !tale.pact && !tale.pactDone) {
    return { ...next, bookDone: 1, pact: 1, pactSkip: 0, pactPost: 0, pactBeat: 0, pactWalk: 0 };
  }
  if (tale.pact && !tale.pactDone) return pactApply(next, tale, action);
  if (action === "skip") return { ...next, bookSkip: 1 };
  if (action === "accept" || action === "ask") {
    return {
      ...next,
      book: 1,
      bookSkip: 0,
      letter: 1,
      term: action === "ask" ? 1 : tale.term,
      post: 0,
      beat: 1,
      walk: 0,
    };
  }
  if (!tale.book || tale.bookDone) return stay();
  if (action === "read") return { ...next, term: 1 };
  if (action === "log") return { ...next, log: 1 };
  if (action === "rush" && tale.post === 1 && !tale.cart) return { ...next, rush: 1 };
  if (action === "fake" && tale.post === 2 && !tale.passDoc) return { ...next, fake: 1 };
  if (action === "permit" && tale.post === 2 && !tale.passDoc) return { ...next, passDoc: 1, beat: 1, fake: tale.fake };
  if (action === "tell") return { ...next, told: 1 };
  if (action === "tell-go" && tale.post === 2 && tale.passDoc) return { ...next, told: 1, walk: 1 };
  if (action === "depart") {
    if (tale.post === 0 && tale.letter) return { ...next, walk: 1 };
    if (tale.post === 1 && tale.letter) return { ...next, walk: 1 };
    if (tale.post === 2 && tale.passDoc) return { ...next, walk: 1 };
    return stay();
  }
  if (action === "roll" && tale.post === 3 && tale.passDoc && !tale.cart) return { ...next, cart: 1, beat: 1 };
  if (action === "draft" && tale.post === 3 && tale.cart) return { ...next, beat: 2 };
  if (action === "finish" && tale.post === 3 && tale.beat >= 2 && tale.cart) {
    return { ...next, book: 0, bookDone: 1, bookPay: 1, walk: 0 };
  }
  if (action === "arrive" && tale.walk) {
    return { ...next, post: Math.min(3, tale.post + 1), beat: 0, walk: 0 };
  }
  return stay();
}

export function taleToast(before, after, action) {
  if (!after) return "";
  if ((action === "accept" || action === "ask") && !before?.book && after.book) return "求援信已收下。進度已記下。";
  if (action === "pact" && !before?.pact && after.pact) return "沿路核對五國的條件。進度已記下。";
  if (!before?.cart && after.cart) return "糧車出發了。進度已記下。";
  if (!before?.bookDone && after.bookDone) return "這程已記下。附頁還有五國未核對。";
  if (!before?.pactDone && after.pactDone) return "五國的條件已記下。";
  return "";
}
