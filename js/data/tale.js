/**
 * 七國行記第一期：公元前318年的背景，玩家只跑韓境、魏境、河渡。
 * 修魚戰果不改。通行文書是這趟任務的安排，不是史料記過的外交文件。
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
  };
}

export function taleActive(row) {
  return !!row?.book && !row?.bookDone;
}

export function taleOffer(row) {
  if (!row || row.book || row.bookDone || row.bookSkip) return false;
  return row.stop === 0 && row.line === 0 && !row.land && !row.weapon;
}

export function taleWalking(row) {
  return taleActive(row) && !!row.walk;
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

export function taleApply(row, action) {
  const tale = taleRow(row);
  const next = { ...row, ...tale, miss: "" };
  const stay = () => next;
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
  if (!before?.cart && after.cart) return "糧車出發了。進度已記下。";
  if (!before?.bookDone && after.bookDone) return "這程已記下。";
  return "";
}
