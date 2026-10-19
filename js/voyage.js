/**
 * 上路：第三人稱自己行。城樓先有地盤，再到營帳。
 * 有了營帳，可以去榜上同窗的城門答一句。答對就在自己這邊插布旗。
 * 史實只重用已有判斷。再走一程，市集、營帳、河邊、松山換下一句：孔子與始皇不同世；西周是分封、受封的是諸侯；科舉不在秦代；夏商周有先後；百家爭鳴在春秋戰國；貞觀是唐太宗；《史記》是司馬遷。同窗城門用呢一程路上未出現的另一句。七雄、海岸、樓閣的句子留在原處。
 * 松山之後向前：七雄的圖、海岸、樓閣。答對只多一個已經屬於你的地方。樓閣有商人，講書同文。樓閣答對，馬跟住你。樓閣之後才再走一程。
 * 城門到松山之後，行旅「今晚未了」每日一句。有了樓閣，逢單數日由商人問。未到樓閣，仍然聽將領。答對只點亮已經屬於你的一個地方。
 */
import { addXp, updateUser } from "./storage.js?v=rad114";
import { mountVoyageScene } from "./voyage3d.js?v=rad157";

const XP_ONCE = 8;

function otherName(gender) {
  return gender === "female" ? "男旅人" : "女旅人";
}

const STOPS = [
  {
    name: "城門",
    lines: [
      { who: "步卒", text: "城門開了。路在前面。" },
      { who: "你", text: "我沿這條路走。" },
    ],
  },
  {
    name: "市集",
    lines: [
      { who: "other", text: "孔子幫秦始皇統一六國。" },
      {
        who: "你",
        text: "你點應？",
        choice: [
          { text: "兩人不同世。", ok: true },
          { text: "孔子做過秦相。", ok: false, miss: "孔子在春秋，始皇在其後。" },
        ],
      },
      { who: "你", text: "識人先識其時。" },
    ],
  },
  {
    name: "城樓",
    lines: [{ who: "步卒", text: "城門到城樓，可以是你的地盤。" }],
  },
  {
    name: "營帳",
    lines: [
      { who: "步卒", text: "西周已經全國設郡縣。" },
      {
        who: "你",
        text: "你點應？",
        choice: [
          { text: "西周是分封。", ok: true },
          { text: "西周同秦一樣。", ok: false, miss: "西周是世襲分封。全國置郡縣、不封子弟，是秦統一之後。" },
        ],
      },
      { who: "你", text: "營帳歸你。地盤大了。" },
    ],
  },
  {
    name: "河邊",
    lines: [
      { who: "步卒", text: "河邊有一句要辨。" },
      { who: "你", text: "你點應？", choice: [] },
      { who: "你", text: "河邊是你的。向右走到松山。" },
    ],
  },
  {
    name: "松山",
    lines: [
      { who: "步卒", text: "松山前再辨一句。" },
      { who: "你", text: "你點應？", choice: [] },
      { who: "你", text: "松山是你的。向前，有一幅七雄的圖。" },
    ],
  },
  {
    name: "七雄",
    lines: [
      { who: "步卒", text: "向前走到七雄的圖。" },
      { who: "你", text: "你點應？", choice: [] },
      { who: "你", text: "這幅圖歸你。" },
    ],
  },
  {
    name: "海岸",
    lines: [
      { who: "步卒", text: "向前走到海岸。" },
      { who: "你", text: "你點應？", choice: [] },
      { who: "你", text: "海岸歸你。" },
    ],
  },
  {
    name: "樓閣",
    lines: [
      { who: "商人", text: "向前走到樓閣。" },
      { who: "你", text: "你點應？", choice: [] },
      { who: "你", text: "城門到樓閣是你的。" },
    ],
  },
];

const QUIZ = [
  {
    who: "other",
    claim: "孔子幫秦始皇統一六國。",
    ok: "兩人不同世。",
    bad: "孔子做過秦相。",
    miss: "孔子在春秋，始皇在其後。",
    after: "識人先識其時。",
  },
  {
    who: "步卒",
    claim: "西周已經全國設郡縣。",
    ok: "西周是分封。",
    bad: "西周同秦一樣。",
    miss: "西周是世襲分封。全國置郡縣、不封子弟，是秦統一之後。",
    after: "這句記穩了。",
  },
  {
    who: "步卒",
    claim: "秦始皇用科舉揀官。",
    ok: "科舉不在秦代。",
    bad: "始皇開科取士。",
    miss: "科舉不在秦代。秦與科舉，時代不同。",
    after: "制度要對時代。",
  },
  {
    who: "步卒",
    claim: "三朝的次序是商周夏。",
    ok: "夏、商、周。",
    bad: "周最早。",
    miss: "傳統史序是夏、商、周。",
    after: "先後記穩，後面先疊得上。",
  },
  {
    who: "步卒",
    claim: "西周把土地分封給農民。",
    ok: "分封給諸侯。",
    bad: "農民可以建國。",
    miss: "周王把土地和人民分封給親族與功臣。受封的是諸侯。",
    after: "受封的是諸侯。",
  },
  {
    who: "步卒",
    claim: "百家爭鳴在秦朝。",
    ok: "在春秋戰國。",
    bad: "秦統一後才爭鳴。",
    miss: "百家爭鳴主要在春秋戰國。",
    after: "時代先對上。",
  },
  {
    who: "步卒",
    claim: "貞觀之治是唐玄宗。",
    ok: "是唐太宗。",
    bad: "是武則天。",
    miss: "貞觀之治是唐太宗在位的時候。",
    after: "皇帝要對上年號。",
  },
  {
    who: "步卒",
    claim: "《史記》是司馬光寫的。",
    ok: "是司馬遷。",
    bad: "兩人同一本。",
    miss: "《史記》是西漢司馬遷寫的。《資治通鑑》才是北宋司馬光。",
    after: "書同人，要分開。",
  },
  {
    who: "步卒",
    claim: "戰國只有秦、楚兩國。",
    ok: "有七雄。",
    bad: "就是三國。",
    miss: "戰國七雄爭霸。不要與三國混淆。",
    after: "這幅圖歸你。",
  },
  {
    who: "步卒",
    claim: "鄭和在漢代下西洋。",
    ok: "在明朝。",
    bad: "同張騫一樣。",
    miss: "鄭和在明朝下西洋。張騫出使西域是漢代。",
    after: "海岸歸你。",
  },
  {
    who: "商人",
    claim: "書同文是為了推廣文學。",
    ok: "為了政令傳達。",
    bad: "為了創作。",
    miss: "書同文是統一文字，方便政令傳達。",
    after: "樓閣歸你。",
  },
];

const ROTATE = [0, 1, 2, 3, 4, 5, 6, 7];
const ROAD_SLOT = { 1: 0, 3: 1, 4: 2, 5: 3 };
const PLACE_QUIZ = { 6: 8, 7: 9, 8: 10 };

function rotated(spin, slot) {
  const n = ROTATE.length;
  const i = (((Number(spin) || 0) + slot) % n + n) % n;
  return QUIZ[ROTATE[i]];
}

function roadQuiz(spin, stop) {
  if (PLACE_QUIZ[stop] != null) return QUIZ[PLACE_QUIZ[stop]];
  if (ROAD_SLOT[stop] == null) return null;
  return rotated(spin, ROAD_SLOT[stop]);
}

function duelQuiz(spin) {
  return rotated(spin, 4);
}

function placeWho(stop) {
  if (stop === 1) return "other";
  if (stop === 5) return "將領";
  if (stop === 8) return "商人";
  return "步卒";
}

function shownLine(row) {
  const stop = STOPS[row.stop];
  const base = stop.lines[row.line];
  const quiz = roadQuiz(row.spin, row.stop);
  if (!quiz) return base;
  if (row.line === 0) return { who: placeWho(row.stop), text: quiz.claim };
  if (row.line === 1) {
    return {
      who: "你",
      text: "你點應？",
      choice: [
        { text: quiz.ok, ok: true },
        { text: quiz.bad, ok: false, miss: quiz.miss },
      ],
    };
  }
  if (row.stop === 4) return { who: "你", text: "河邊是你的。向右走到松山。" };
  if (row.stop === 5) return { who: "將領", text: "松山是你的。向前，有一幅七雄的圖。" };
  if (row.stop === 8) return { who: "商人", text: quiz.after };
  return { who: "你", text: quiz.after };
}

function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readRow(user) {
  const raw = user?.progress?.voyage;
  const stop = Math.min(STOPS.length - 1, Math.max(0, Number(raw?.stop) || 0));
  const lineMax = STOPS[stop].lines.length - 1;
  return {
    stop,
    line: Math.min(lineMax, Math.max(0, Number(raw?.line) || 0)),
    miss: String(raw?.miss || ""),
    done: !!raw?.done,
    rewarded: !!raw?.rewarded,
    weapon: !!raw?.weapon,
    soldier: !!raw?.soldier,
    land: !!raw?.land,
    camp: !!raw?.camp,
    river: !!raw?.river,
    pine: !!raw?.pine,
    crossbow: !!raw?.crossbow,
    chariot: !!raw?.chariot,
    horse: !!raw?.horse || !!raw?.loft,
    states: !!raw?.states,
    coast: !!raw?.coast,
    loft: !!raw?.loft,
    flag: !!raw?.flag,
    flagName: String(raw?.flagName || "").slice(0, 8),
    spin: Math.max(0, Math.min(48, Number(raw?.spin) || 0)),
    night: dayKey(raw?.night),
    nightTry: dayKey(raw?.nightTry),
    nightMiss: String(raw?.nightMiss || "").slice(0, 80),
  };
}

function dayKey(value) {
  const text = String(value || "");
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

const NIGHT_PLACES = [
  { id: "gate", name: "城門", own: (row) => row.stop > 0 || row.line > 0 || row.land || row.camp || row.river || row.pine },
  { id: "tower", name: "城樓", own: (row) => !!row.land },
  { id: "camp", name: "營帳", own: (row) => !!row.camp },
  { id: "river", name: "河邊", own: (row) => !!row.river },
  { id: "pine", name: "松山", own: (row) => !!row.pine },
  { id: "flag", name: "布旗", own: (row) => !!row.flag },
  { id: "states", name: "七雄", own: (row) => !!row.states },
  { id: "coast", name: "海岸", own: (row) => !!row.coast },
  { id: "loft", name: "樓閣", own: (row) => !!row.loft },
];

export function nightOf(raw, day) {
  if (!raw?.pine) return null;
  const row = readRow({ progress: { voyage: raw } });
  const owned = NIGHT_PLACES.filter((place) => place.own(row));
  if (!owned.length) return null;
  const dayText = dayKey(day);
  const n = Number(dayText.replace(/\D/g, "")) || 0;
  const quiz = QUIZ[n % 8];
  const place = owned[n % owned.length];
  const done = !!dayText && row.night === dayText;
  return {
    who: row.loft && n % 2 === 1 ? "商人" : "將領",
    claim: quiz.claim,
    ok: quiz.ok,
    bad: quiz.bad,
    miss: quiz.miss,
    after: quiz.after,
    placeId: place.id,
    placeName: place.name,
    done,
    missShown: !done && row.nightTry === dayText ? row.nightMiss : "",
  };
}

function writeRow(username, next) {
  try {
    const saved = updateUser((u) => {
      if (String(u.username || "").toUpperCase() !== String(username || "").toUpperCase()) return;
      u.progress = u.progress || {};
      u.progress.voyage = next;
    });
    return !!saved;
  } catch {
    return false;
  }
}

function pathHtml(row) {
  const start = row.stop >= 6 ? 5 : 0;
  const end = start ? STOPS.length : 6;
  return STOPS.slice(start, end)
    .map((s, i) => {
      const index = start + i;
      const cls = index === row.stop ? "is-now" : index < row.stop ? "is-past" : "";
      return `<span class="${cls}">${esc(s.name)}</span>`;
    })
    .join("");
}

function boxHtml(row, pathOpen, gender) {
  const stop = STOPS[row.stop];
  const line = shownLine(row);
  const speaker = line.who === "other" ? otherName(gender) : line.who;
  const who = speaker ? `<p class="voyage-who">${esc(speaker)}</p>` : "";
  const last = row.line >= stop.lines.length - 1;
  const atTower = row.stop === 2 && last;
  const atCamp = row.stop === 3 && last;
  const atRiver = row.stop === 4 && last;
  const atPine = row.stop === 5 && last;
  const atStates = row.stop === 6 && last;
  const atCoast = row.stop === 7 && last;
  const atLoft = row.stop === 8 && last;
  let lineText = line.text || "";
  if (atLoft && row.loft) lineText = "城門到樓閣是你的。馬跟住你。";
  else if (atCoast && row.coast) lineText = "海岸是你的。向前走到樓閣。";
  else if (atStates && row.states) lineText = "這幅圖是你的。向前走到海岸。";
  else if (atPine && row.pine && !row.states) lineText = "城門到松山，是你的。向前，有一幅七雄的圖。";
  else if (atPine && row.pine) lineText = "城門到松山，是你的地盤。";
  else if (atRiver && row.river) lineText = "河邊是你的。向右走到松山。";
  else if (atCamp && row.camp) lineText = "城門到營帳是你的。向左走到河邊，可以再大。";
  else if (atTower && row.land) lineText = "城門到城樓是你的。再向前，營帳也可以是你的。";
  else if (atTower) lineText = "你上了城樓。這條路可以是你的地盤。";
  let controls = "";
  if (atLoft && row.loft) {
    controls = `<div class="voyage-actions">
      <button type="button" class="voyage-go" data-voyage-duel="1">去同窗</button>
      <button type="button" class="voyage-go" data-voyage-replay="1">再走一程</button>
      <button type="button" class="voyage-go" data-voyage-home="1">回到行旅</button>
    </div><p class="voyage-hint">${
      row.flag
        ? `布旗下記住${esc(row.flagName || "同窗")}。馬跟住你。`
        : "馬跟住你。"
    }</p>`;
  } else if (Array.isArray(line.choice) && line.choice.length) {
    controls = `<div class="voyage-choices">${line.choice
      .map(
        (opt, i) =>
          `<button type="button" class="voyage-choice" data-voyage-pick="${i}">${esc(opt.text)}</button>`
      )
      .join("")}</div>${row.miss ? `<p class="voyage-miss">${esc(row.miss)}</p>` : ""}`;
  } else if (last && !atPine && !atStates && !atCoast && !atLoft && pathOpen) {
    controls = `<p class="voyage-hint">${
      atRiver
        ? "向右走到松山。"
        : atCamp
          ? "向左走到河邊。"
          : atTower
            ? "向前走到營帳。"
            : row.weapon
              ? "步卒跟上。拖左下圓鈕向前。"
              : "拖左下圓鈕向前，或按鍵盤。"
    }</p>`;
  } else if (atTower && row.land) {
    controls = `<button type="button" class="voyage-go" data-voyage-next="1">向前</button>`;
  } else if (atTower) {
    controls = `<button type="button" class="voyage-go" data-voyage-claim="1">收下</button>`;
  } else if (atCamp && row.camp) {
    controls = `<button type="button" class="voyage-go" data-voyage-next="1">向前</button>`;
  } else if (atCamp) {
    controls = `<button type="button" class="voyage-go" data-voyage-finish="1">收下</button>`;
  } else if (atRiver && row.river) {
    controls = `<button type="button" class="voyage-go" data-voyage-next="1">向前</button>`;
  } else if (atRiver) {
    controls = `<button type="button" class="voyage-go" data-voyage-river="1">收下</button>`;
  } else if (atPine && row.pine) {
    controls = `<button type="button" class="voyage-go" data-voyage-next="1">向前</button>`;
  } else if (atPine) {
    controls = `<button type="button" class="voyage-go" data-voyage-pine="1">收下</button>`;
  } else if (atStates && row.states) {
    controls = `<button type="button" class="voyage-go" data-voyage-next="1">向前</button>`;
  } else if (atStates) {
    controls = `<button type="button" class="voyage-go" data-voyage-states="1">收下</button>`;
  } else if (atCoast && row.coast) {
    controls = `<button type="button" class="voyage-go" data-voyage-next="1">向前</button>`;
  } else if (atCoast) {
    controls = `<button type="button" class="voyage-go" data-voyage-coast="1">收下</button>`;
  } else if (atLoft) {
    controls = `<button type="button" class="voyage-go" data-voyage-loft="1">收下</button>`;
  } else {
    controls = `<button type="button" class="voyage-go" data-voyage-next="1">知道了</button>`;
  }
  return `${who}<p class="voyage-line">${esc(lineText)}</p>${controls}`;
}

function matesOf(user, board) {
  if (!Array.isArray(board)) return null;
  const year = user?.formYear || "";
  const me = String(user?.username || "").toUpperCase();
  return board
    .filter((r) => String(r.username || "").toUpperCase() !== me)
    .filter((r) => !year || !r.formYear || r.formYear === year)
    .slice(0, 6)
    .map((r) => ({
      username: String(r.username || "").toUpperCase(),
      name: String(r.heroName || r.username || "同窗").slice(0, 8),
      score: Number(r.score) || 0,
    }));
}

function duelHtml(duel, mates, row) {
  if (!duel) return "";
  if (duel.phase === "pick") {
    if (mates == null) {
      return `<p class="voyage-line">榜載入中。</p><button type="button" class="voyage-go" data-voyage-duel-back="1">返回</button>`;
    }
    if (!mates.length) {
      return `<p class="voyage-line">同窗未上榜。答對題目，佢哋上榜就可以來。</p><button type="button" class="voyage-go" data-voyage-duel-back="1">返回</button>`;
    }
    const buttons = mates
      .map(
        (m) =>
          `<button type="button" class="voyage-choice" data-voyage-rival="${esc(m.username)}">${esc(m.name)} · 史績 ${m.score}</button>`
      )
      .join("");
    return `<p class="voyage-who">你</p><p class="voyage-line">揀一位同窗。答對就插旗。他的城仍是他的。</p><div class="voyage-choices">${buttons}</div><button type="button" class="voyage-go" data-voyage-duel-back="1">返回</button>`;
  }
  if (duel.phase === "won") {
    return `<p class="voyage-who">你</p><p class="voyage-line">布旗插上。${esc(duel.name)}的城仍是他的。</p><button type="button" class="voyage-go" data-voyage-duel-back="1">回到自己的路</button>`;
  }
  const quiz = duelQuiz(row?.spin);
  const miss = duel.miss ? `<p class="voyage-miss">${esc(duel.miss)}</p>` : "";
  return `<p class="voyage-who">步卒 · ${esc(duel.name)}的城門</p><p class="voyage-line">${esc(quiz.claim)}</p><div class="voyage-choices">
    <button type="button" class="voyage-choice" data-voyage-flag="1">${esc(quiz.ok)}</button>
    <button type="button" class="voyage-choice" data-voyage-flag="0">${esc(quiz.bad)}</button>
  </div>${miss}<button type="button" class="voyage-go" data-voyage-repick="1">另揀一位</button>`;
}

export function renderVoyage() {
  return `<section class="voyage is-loading" id="voyage-root">
    <canvas class="voyage-view" id="voyage-view" aria-hidden="true"></canvas>
    <p class="voyage-load" id="voyage-load">載入中</p>
    <button type="button" class="voyage-back" data-voyage-home="1">返回</button>
    <div class="voyage-path" id="voyage-path" aria-label="這一程"></div>
    <div class="voyage-stick" id="voyage-stick" aria-label="行走">
      <div class="voyage-knob" id="voyage-knob"></div>
    </div>
    <div class="voyage-box" id="voyage-box"></div>
  </section>`;
}

export function bindVoyage(user, ctx) {
  const root = document.getElementById("voyage-root");
  if (!root || root.dataset.bound === "1") return;
  root.dataset.bound = "1";
  const name = String(user?.username || "");
  let pathOpen = false;
  let world = null;
  let boardTries = 0;
  const openDuel = !!ctx.state?.voyageDuel;
  if (ctx.state) ctx.state.voyageDuel = false;
  let duel = openDuel ? { phase: "pick" } : null;

  const fail = () => ctx.toast?.("這一步未寫入。請再試一次。");

  const paint = () => {
    const current = ctx.getUser?.() || user;
    const row = readRow(current);
    const mates = matesOf(current, ctx.state?.cloudBoard);
    const path = document.getElementById("voyage-path");
    const box = document.getElementById("voyage-box");
    if (path) path.innerHTML = pathHtml(row);
    if (box) box.innerHTML = duel ? duelHtml(duel, mates, row) : boxHtml(row, pathOpen, current?.gender);
    root.classList.toggle("is-rival", !!(duel && duel.phase !== "pick"));
    if (duel?.phase === "pick" && mates == null && boardTries < 8) {
      boardTries += 1;
      setTimeout(() => {
        if (duel?.phase === "pick") paint();
      }, 500);
    }
  };

  const save = (next) => {
    if (!writeRow(name, next)) {
      fail();
      return false;
    }
    paint();
    return true;
  };

  const claimLand = (row) => {
    const next = { ...row, land: true, weapon: true, soldier: true, done: false, miss: "" };
    let granted = false;
    if (!row.rewarded) {
      const saved = updateUser((u) => {
        if (String(u.username || "").toUpperCase() !== name.toUpperCase()) return;
        u.progress = u.progress || {};
        u.progress.voyage = { ...next, rewarded: true };
      });
      if (!saved) {
        fail();
        return;
      }
      addXp(XP_ONCE);
      granted = true;
    } else if (!writeRow(name, next)) {
      fail();
      return;
    }
    pathOpen = true;
    world?.setOpen(true);
    if (granted) ctx.toast?.(`城門到城樓是你的地盤。經驗 +${XP_ONCE}`);
    paint();
  };

  const claimCamp = (row) => {
    const next = { ...row, camp: true, done: false, miss: "", land: true, weapon: true, soldier: true };
    if (!writeRow(name, next)) {
      fail();
      return;
    }
    pathOpen = true;
    world?.setOpen(true);
    if (!row.camp) ctx.toast?.("地盤大了。城門到營帳是你的。向左走到河邊。");
    paint();
  };

  const claimRiver = (row) => {
    const next = { ...row, river: true, crossbow: true, done: false, miss: "" };
    if (!writeRow(name, next)) {
      fail();
      return;
    }
    pathOpen = true;
    world?.setOpen(true);
    world?.arm();
    if (!row.river) ctx.toast?.("河邊是你的。向右走到松山。");
    paint();
  };

  const claimPine = (row) => {
    const next = { ...row, pine: true, chariot: true, done: true, miss: "" };
    if (!writeRow(name, next)) {
      fail();
      return;
    }
    world?.hitch();
    if (!row.pine) ctx.toast?.("松山是你的。向前，有一幅七雄的圖。");
    paint();
  };

  const claimPlace = (row, key, toast) => {
    const next = { ...row, [key]: true, done: key === "loft", miss: "" };
    if (key === "loft") next.horse = true;
    if (!writeRow(name, next)) {
      fail();
      return;
    }
    pathOpen = true;
    world?.setOpen(true);
    if (key === "loft") world?.lead();
    if (!row[key]) ctx.toast?.(key === "loft" ? "馬跟住你。城門到樓閣是你的。" : toast);
    paint();
  };

  const claimFlag = (row, rivalName) => {
    const next = { ...row, flag: true, flagName: String(rivalName || "").slice(0, 8), miss: "" };
    if (!writeRow(name, next)) {
      fail();
      return;
    }
    world?.raise();
    const fresh = !row.flag;
    duel = { phase: "won", name: rivalName };
    if (fresh) ctx.toast?.(`布旗插上。${rivalName}的城仍是他的。`);
    paint();
  };

  const goHome = () => {
    world?.dispose();
    world = null;
    ctx.state.view = "home";
    ctx.render?.();
  };

  paint();
  world = mountVoyageScene({
    canvas: document.getElementById("voyage-view"),
    stick: document.getElementById("voyage-stick"),
    knob: document.getElementById("voyage-knob"),
    gender: user?.gender,
    stop: readRow(user).stop,
    follow: !!readRow(user).weapon,
    banner: !!readRow(user).flag,
    crossbow: !!readRow(user).crossbow,
    chariot: !!readRow(user).chariot,
    horse: !!readRow(user).horse,
    onProgress: (text) => {
      const el = document.getElementById("voyage-load");
      if (el) el.textContent = text;
    },
    onReady: () => {
      root.classList.remove("is-loading");
      const el = document.getElementById("voyage-load");
      if (el) el.hidden = true;
    },
    onFail: () => {
      const el = document.getElementById("voyage-load");
      if (el) el.textContent = "場景載入不到。請返回再試。";
    },
    onArrive: (stop) => {
      const row = readRow(ctx.getUser?.() || user);
      pathOpen = false;
      world?.setOpen(false);
      save({ ...row, stop, line: 0, miss: "", done: false });
    },
  });

  root.addEventListener("click", (e) => {
    const home = e.target.closest("[data-voyage-home]");
    if (home) {
      goHome();
      return;
    }
    const row = readRow(ctx.getUser?.() || user);
    if (e.target.closest("[data-voyage-repick]")) {
      duel = { phase: "pick" };
      boardTries = 0;
      world?.leaveRival();
      if (pathOpen) world?.setOpen(true);
      paint();
      return;
    }
    if (e.target.closest("[data-voyage-duel-back]")) {
      duel = null;
      world?.leaveRival();
      if (pathOpen) world?.setOpen(true);
      paint();
      return;
    }
    if (e.target.closest("[data-voyage-duel]")) {
      if (row.camp) {
        duel = { phase: "pick" };
        boardTries = 0;
        paint();
      }
      return;
    }
    const rivalBtn = e.target.closest("[data-voyage-rival]");
    if (rivalBtn) {
      const id = String(rivalBtn.dataset.voyageRival || "").toUpperCase();
      const mates = matesOf(ctx.getUser?.() || user, ctx.state?.cloudBoard) || [];
      const mate = mates.find((m) => m.username === id);
      if (!mate) return;
      duel = { phase: "ask", name: mate.name, miss: "" };
      world?.meet(mate.name);
      paint();
      return;
    }
    const flagBtn = e.target.closest("[data-voyage-flag]");
    if (flagBtn && duel?.phase === "ask") {
      if (flagBtn.dataset.voyageFlag === "1") claimFlag(row, duel.name);
      else {
        duel = { ...duel, miss: duelQuiz(row.spin).miss };
        paint();
      }
      return;
    }
    const stop = STOPS[row.stop];
    if (e.target.closest("[data-voyage-next]")) {
      if (row.line < stop.lines.length - 1) {
        save({ ...row, line: row.line + 1, miss: "", done: false });
        return;
      }
      if (row.stop < STOPS.length - 1) {
        pathOpen = true;
        world?.setOpen(true);
        paint();
      }
      return;
    }
    const pick = e.target.closest("[data-voyage-pick]");
    if (pick) {
      const line = shownLine(row);
      const opt = line.choice?.[Number(pick.dataset.voyagePick)];
      if (!opt) return;
      if (!opt.ok) {
        save({ ...row, miss: opt.miss || "再揀一句。" });
        return;
      }
      if (row.line < stop.lines.length - 1) {
        const next = { ...row, line: row.line + 1, miss: "" };
        if (row.stop < 6) {
          next.weapon = true;
          next.soldier = true;
        }
        if (row.stop === 4) next.crossbow = true;
        if (row.stop === 5) next.chariot = true;
        if (save(next)) {
          if (row.stop < 6) world?.grant();
          if (row.stop === 4) world?.arm();
          if (row.stop === 5) world?.hitch();
        }
      }
      return;
    }
    if (e.target.closest("[data-voyage-claim]")) {
      claimLand(row);
      return;
    }
    if (e.target.closest("[data-voyage-finish]")) {
      claimCamp(row);
      return;
    }
    if (e.target.closest("[data-voyage-river]")) {
      claimRiver(row);
      return;
    }
    if (e.target.closest("[data-voyage-pine]")) {
      claimPine(row);
      return;
    }
    if (e.target.closest("[data-voyage-states]")) {
      claimPlace(row, "states", "這幅圖是你的。");
      return;
    }
    if (e.target.closest("[data-voyage-coast]")) {
      claimPlace(row, "coast", "海岸是你的。");
      return;
    }
    if (e.target.closest("[data-voyage-loft]")) {
      claimPlace(row, "loft", "城門到樓閣是你的。");
      return;
    }
    if (e.target.closest("[data-voyage-replay]")) {
      pathOpen = false;
      world?.place(0);
      world?.setOpen(false);
      save({ ...row, stop: 0, line: 0, miss: "", done: false, spin: (Number(row.spin) || 0) + 1 });
    }
  });
}
