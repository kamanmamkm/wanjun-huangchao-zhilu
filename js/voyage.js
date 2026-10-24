/**
 * 上路：第三人稱自己行。城樓先有地盤，再到營帳。
 * 有了營帳，可以去榜上同窗的城門答一句。答對就在自己這邊插布旗。
 * 史實只重用已有判斷。市集先問兩個人分辨傳聞，再判斷信邊句。答錯先出提示，再換另一個例子。營帳先接任務，再揀先查哪份情報。河邊睇線索揀渡口。七雄在圖上配方位，秦在西、楚在南，蜀屬三國。樓閣睇兩份材料，解決商人傳達政令。關城把沿路線索放在一起，核對北宋都城。松山、海岸仍然是一句判斷。渡口先讀運輸同民力，再揀。再走一程，市集傳聞同河邊渡口換下一組，松山換下一句。同窗城門用呢一程路上未出現的另一句。
 * 關城之後先再走一程。商隊沿歷史時空旅程行，每站解一件事再交去下一站。年代分開，唔好當成同一時的人。再走可以改經山路，市集同山路碰到的事唔同，河邊渡口亦會換一組。同一條次序換另一種石上寫法。同窗要帶自己的線索，同佢留下的一句一齊放，他的城仍是他的。關城列出探索、進步、未發現的支線。
 * 城門到松山之後，行旅「今晚未了」每日一句。有了樓閣，逢單數日由商人問。未到樓閣，仍然聽將領。答對只點亮已經屬於你的一個地方。
 */
import { addXp, updateUser } from "./storage.js?v=rad114";
import { mountVoyageScene } from "./voyage3d.js?v=rad173";
import {
  taleActive,
  taleApply,
  taleGoal,
  taleHtml,
  taleOffer,
  taleOfferHtml,
  talePath,
  taleRow,
  taleToast,
  taleWalking,
} from "./data/tale.js?v=rad173";

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
  {
    name: "渡口",
    lines: [
      { who: "步卒", text: "向前走到渡口。" },
      { who: "你", text: "你點應？", choice: [] },
      { who: "你", text: "渡口是你的。向前走到關城。" },
    ],
  },
  {
    name: "關城",
    lines: [
      { who: "步卒", text: "向前走到關城。" },
      { who: "你", text: "你點應？", choice: [] },
      { who: "你", text: "關城是你的。" },
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
  {
    who: "步卒",
    claim: "大運河一日建成，民力毫無消耗。",
    ok: "溝通南北，同時徵發民力。",
    bad: "一日建成才算。",
    miss: "大運河便利南北轉運，同時徵發民力甚眾。",
    after: "渡口是你的。向前走到關城。",
  },
  {
    who: "步卒",
    claim: "北宋始終以長安為都。",
    ok: "北宋都開封。",
    bad: "長安就是開封。",
    miss: "北宋都城是開封。長安主要是漢唐舊都。",
    after: "關城是你的。",
  },
];

const ROTATE = [0, 1, 2, 3, 4, 5, 6, 7];
const ROAD_SLOT = { 5: 3 };
const PLACE_QUIZ = { 7: 9, 9: 11 };

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

const PLAY = { 1: "rumor", 3: "task", 4: "ford", 6: "match", 8: "slip", 9: "haul", 10: "seal" };

const RUMORS = [
  {
    ask: "邊句係錯誤傳聞？",
    voices: [
      { who: "攤主", text: "孔子在春秋講學。" },
      { who: "other", text: "孔子幫秦始皇統一六國。", false: true },
    ],
    miss: "孔子在春秋，始皇在其後。",
  },
  {
    ask: "邊句係錯誤傳聞？",
    voices: [
      { who: "攤主", text: "貞觀之治是唐玄宗。", false: true },
      { who: "other", text: "貞觀之治是唐太宗。" },
    ],
    miss: "貞觀之治是唐太宗在位的時候。",
  },
  {
    ask: "邊句係錯誤傳聞？",
    voices: [
      { who: "攤主", text: "百家爭鳴在春秋戰國。" },
      { who: "other", text: "百家爭鳴在秦朝。", false: true },
    ],
    miss: "百家爭鳴主要在春秋戰國。",
  },
  {
    ask: "邊句係錯誤傳聞？",
    voices: [
      { who: "攤主", text: "《史記》是司馬光寫的。", false: true },
      { who: "other", text: "《史記》是司馬遷寫的。" },
    ],
    miss: "《史記》是西漢司馬遷寫的。《資治通鑑》才是北宋司馬光。",
  },
];

const FORDS = [
  {
    ask: "睇三處線索，揀合適的渡河位置。",
    spots: [
      { name: "中流", clue: "牌子寫「商周夏」。" },
      { name: "東渡", clue: "石上是「夏、商、周」。", ok: true },
      { name: "西灘", clue: "牌子寫「周最早」。" },
    ],
    miss: "傳統史序是夏、商、周。",
  },
  {
    ask: "睇三處線索，揀合適的渡河位置。",
    spots: [
      { name: "南渡", clue: "牌子寫「始皇開科取士」。" },
      { name: "淺灘", clue: "牌子寫「秦與科舉同一時代」。" },
      { name: "北渡", clue: "石上是「科舉不在秦代」。", ok: true },
    ],
    miss: "科舉不在秦代。秦與科舉，時代不同。",
  },
];

function routeOf(row) {
  return row?.route === "ridge" ? "ridge" : "market";
}

function needsRoute(row) {
  if (!row || row.stop !== 0 || row.route === "market" || row.route === "ridge") return false;
  return row.spin > 0 || !!row.pass || !!row.marketClue || !!row.ridgeClue;
}

function askForm(row) {
  return (((Number(row?.spin) || 0) + (routeOf(row) === "ridge" ? 1 : 0)) % 2);
}

function shareClue(row) {
  if (routeOf(row) === "ridge" && (row.ridgeClue || row.stop > 1)) return "三朝有先後";
  if (row.marketClue || row.stop > 1) return "孔子在春秋";
  if (row.ridgeClue) return "三朝有先後";
  return "";
}

function playOf(stop, row) {
  if (stop === 1 && row && routeOf(row) === "ridge") return "trail";
  return PLAY[stop] || "";
}

const HAULS = [
  {
    ask: "睇完運輸同民力。邊句先寫得上？",
    ok: "溝通南北，同時徵發民力。",
    bad: "一日建成，民力毫無消耗。",
  },
  {
    ask: "換一個例子。邊句先接得上河道？",
    ok: "轉運靠河道，工期裡征發民力。",
    bad: "河道一日可成，不必征人。",
  },
];

const MAP_TASKS = [
  { name: "秦", slot: "西", ask: "這是戰國。點國名，再點到圖上。先放秦。" },
  { name: "楚", slot: "南", ask: "換一個例子。點國名，再點到圖上。放楚。" },
];

function rumorAt(row) {
  return rumorOf((Number(row?.spin) || 0) + (row?.drill ? 1 : 0));
}

function missRow(row, result) {
  return {
    ...row,
    miss: result.miss || "再看一次。",
    drill: result.drill ? 1 : 0,
    hold: result.hold ? 1 : 0,
    line: result.line != null ? result.line : row.line,
  };
}

function rumorOf(spin) {
  return RUMORS[((Number(spin) || 0) % RUMORS.length + RUMORS.length) % RUMORS.length];
}

function fordOf(row) {
  const spin = (Number(row?.spin) || 0) + (routeOf(row) === "ridge" ? 1 : 0);
  return FORDS[((spin % FORDS.length) + FORDS.length) % FORDS.length];
}

function fordEra(row) {
  return fordOf(row) === FORDS[0] ? "夏、商、周" : "隋唐以後的科舉";
}

function coopOf(row) {
  const mine = shareClue(row);
  const quiz = duelQuiz(row?.spin);
  const claim = String(quiz.claim || "").replace(/。$/, "");
  const piece = mine === "三朝有先後" ? "三朝有先後" : "孔子在春秋";
  return {
    mine: piece,
    claim: quiz.claim,
    ask: "兩份放在一起。邊種放法先係一齊解？",
    ok: `「${piece}」放可用。「${claim}」放再核對。`,
    bad: `「${piece}」同「${claim}」當成同一時。`,
    miss: `${piece}。你這句可用，同窗那句要再核對。`,
  };
}

const TRAILS = [
  { ok: "夏之後是商，商之後是周。", bad: "周比夏更早。" },
  { ok: "商在夏之後，周在商之後。", bad: "夏在周之後。" },
];

function trailOf(row) {
  const spin = Number(row?.spin) || 0;
  return TRAILS[((spin % TRAILS.length) + TRAILS.length) % TRAILS.length];
}

function clueChips(row) {
  const chips = [];
  if (row.marketClue) chips.push("孔子在春秋");
  if (row.ridgeClue) chips.push("三朝有先後");
  if (row.camp) chips.push("西周是分封");
  if (row.river) chips.push(fordOf(row) === FORDS[0] ? "夏、商、周" : "科舉不在秦代");
  if (row.states) chips.push("戰國七雄");
  if (row.coast) chips.push("鄭和在明");
  if (row.loft) chips.push("書同文為政令");
  if (row.ferry) chips.push("運河徵發民力");
  return chips;
}

function stopSettled(row) {
  if (!row) return false;
  if (row.stop === 1) return routeOf(row) === "ridge" ? !!row.ridgeClue : !!row.marketClue;
  const key = ownedKey(row.stop);
  if (key) return !!row[key];
  const stop = STOPS[row.stop];
  return !!stop && row.line >= stop.lines.length - 1;
}

function carryLine(row) {
  const settled = stopSettled(row);
  const ridge = routeOf(row) === "ridge";
  if (row.stop === 0) return "商隊要出發。每站是不同年代，路上的人不是同一時存在。";
  if (row.stop === 1 && ridge) {
    return settled
      ? "三朝次序對上了。商隊帶住這句去城樓歇。"
      : "商隊轉入山路。這一站是夏、商、周，三朝有先後。";
  }
  if (row.stop === 1) {
    return settled
      ? "市集分清了：孔子在春秋，始皇在後。商隊帶住這句去城樓。"
      : "商隊入市集。這一站把春秋的孔子同後來的始皇分開。";
  }
  if (row.stop === 2) {
    if (settled) return "城樓歸商隊歇腳。下一站是西周的營帳，同春秋、秦都不是同一時。";
    return ridge
      ? "山路的次序對上了。商隊在城樓歇，這段路可以歸你。"
      : "市集的年代分清了。商隊在城樓歇，這段路可以歸你。";
  }
  if (row.stop === 3) {
    return settled
      ? "營帳記低西周是分封。可以重溫線索。商隊帶住這句去河邊。"
      : "城樓已是你的。商隊要核對西周：受封的是諸侯，不是秦的郡縣。";
  }
  if (row.stop === 4) {
    const era = fordEra(row);
    return settled
      ? "河邊揀對了。商隊帶住渡口的判斷上松山。"
      : `營帳寫低西周是分封。這一站是${era}，同西周不是同一時。`;
  }
  if (row.stop === 5) {
    return settled
      ? "松山這一句的年代對上了。商隊去看戰國的圖，要同三國分開。"
      : "河邊揀對了。松山這一句是另一個年代，同剛才的渡口不是同一時。";
  }
  if (row.stop === 6) {
    return settled
      ? "戰國的方位對上了。秦在西，楚在南。商隊出海岸，下一站是明朝。"
      : "松山過了。這幅圖是戰國，不是三國。蜀唔好放到圖上。";
  }
  if (row.stop === 7) {
    return settled
      ? "海岸記低鄭和在明。商隊入樓閣，書同文是秦統一之後的事。"
      : "戰國的圖對上了。這一站是明朝的鄭和，張騫是漢代，兩人不同世。";
  }
  if (row.stop === 8) {
    return settled
      ? "樓閣的馬跟住商隊。已經屬於你的路可以快跑。下一站是隋唐的渡口。"
      : "海岸是明朝的事。樓閣要送政令：書同文是秦統一之後，為了政令。";
  }
  if (row.stop === 9) {
    return settled
      ? "渡口可以抄捷徑。商隊去關城，下一站是北宋。"
      : "馬跟住商隊。這一站是隋唐的大運河：溝通南北，同時徵發民力。";
  }
  if (row.stop === 10) {
    return row.pass
      ? "商隊按年代過了關。各站的人沒有變成同時存在。"
      : "渡口抄過路。關城核對北宋：都城是開封，長安是漢唐舊都。";
  }
  return "協助商隊完成旅程。";
}

function threadHtml(row, compact) {
  const title = compact ? "" : `<p class="voyage-story">歷史時空旅程 · 協助商隊完成旅程</p>`;
  return `${title}<p class="voyage-story">${esc(carryLine(row))}</p>`;
}

function canSprint(row) {
  return !!row.horse && segmentDone(row);
}

function shortcutTarget(row) {
  if (!row.ferry || !canWalk(row, false)) return -1;
  if (row.pass && row.stop < 10) return 10;
  if (row.stop < 9) return 9;
  return -1;
}

function roadActions(row) {
  if (!canWalk(row, false)) return "";
  const buttons = [];
  if (row.camp) buttons.push(`<button type="button" class="voyage-go" data-voyage-review="1">重溫線索</button>`);
  if (canSprint(row)) buttons.push(`<button type="button" class="voyage-go" data-voyage-skip="1">快返</button>`);
  const cut = shortcutTarget(row);
  if (cut > row.stop) buttons.push(`<button type="button" class="voyage-go" data-voyage-cut="1">抄捷徑</button>`);
  if (!buttons.length) return "";
  return `<div class="voyage-actions">${buttons.join("")}</div>`;
}

function reviewHtml(row) {
  const chips = clueChips(row)
    .map((text) => `<span class="voyage-clue">${esc(text)}</span>`)
    .join("");
  const body = chips
    ? `<div class="voyage-clues">${chips}</div>`
    : `<p class="voyage-line">線索還未收齊。</p>`;
  return `<p class="voyage-who">營帳</p><p class="voyage-line">收過的線索放在這裡。</p>${body}<button type="button" class="voyage-go" data-voyage-review-back="1">返回道路</button>`;
}

function mixSeed(text) {
  let h = 2166136261;
  const s = String(text || "");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function choiceOrder(seed, count) {
  const order = [];
  for (let i = 0; i < count; i++) order.push(i);
  let state = mixSeed(seed) || 1;
  for (let i = count - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    const swap = order[i];
    order[i] = order[j];
    order[j] = swap;
  }
  return order;
}

function joinChoices(buttons, seed) {
  return choiceOrder(seed, buttons.length).map((i) => buttons[i]).join("");
}

function choiceSeed(row, mix, play) {
  return `${mix}|${row?.stop}|${row?.line}|${row?.spin}|${row?.drill ? 1 : 0}|${routeOf(row)}|${askForm(row)}|${play}`;
}

function playHtml(row, gender, mix, held) {
  const play = playOf(row.stop, row);
  const form = askForm(row);
  const seed = choiceSeed(row, mix, play);
  const miss = row.miss ? `<p class="voyage-miss">${esc(row.miss)}</p>` : "";
  const choices = (buttons) => `<div class="voyage-choices">${joinChoices(buttons, seed)}</div>`;
  if (play === "trail") {
    const trail = trailOf(row);
    const ask = form === 0 ? "山路石上有兩句次序。邊句先可以沿住走？" : "山路石上有兩句次序。邊句會帶錯路？";
    return `<p class="voyage-who">山路</p><p class="voyage-line">${esc(ask)}</p>${choices([
      `<button type="button" class="voyage-choice" data-voyage-pick="0"><b>石甲</b>${esc(trail.ok)}</button>`,
      `<button type="button" class="voyage-choice" data-voyage-pick="1"><b>石乙</b>${esc(trail.bad)}</button>`,
    ])}${miss}`;
  }
  if (play === "rumor") {
    if (row.hold) {
      return `<p class="voyage-who">市集</p><p class="voyage-line">${esc(row.miss)}</p><button type="button" class="voyage-go" data-voyage-retry="1">再分辨一次</button>`;
    }
    const rumor = rumorAt(row);
    const distinguishing = row.line <= 0;
    const ask = distinguishing ? "兩個人都講過。邊句先係傳聞？" : "分辨完。商隊應該信邊句？";
    const voices = rumor.voices.map((voice, i) => {
      const name = voice.who === "other" ? otherName(gender) : voice.who;
      return `<button type="button" class="voyage-choice" data-voyage-pick="${i}"><b>${esc(name)}</b>${esc(voice.text)}</button>`;
    });
    return `<p class="voyage-who">市集</p><p class="voyage-line">${esc(ask)}</p>${choices(voices)}${miss}`;
  }
  if (play === "task") {
    if (row.line <= 0 && form === 0) {
      return `<p class="voyage-who">步卒</p><p class="voyage-line">營帳要核對西周點管地方。你接哪一項任務？</p>${choices([
        `<button type="button" class="voyage-choice" data-voyage-pick="0">查受封的是誰。</button>`,
        `<button type="button" class="voyage-choice" data-voyage-pick="1">當作西周已全國設郡縣。</button>`,
      ])}${miss}`;
    }
    const ask = form === 0 ? "任務接了。兩份情報，先查哪一份？" : "營帳要回報。邊一份情報先寫得上？";
    return `<p class="voyage-who">步卒</p><p class="voyage-line">${esc(ask)}</p>${choices([
      `<button type="button" class="voyage-choice" data-voyage-pick="0">周王把土地分封給諸侯。</button>`,
      `<button type="button" class="voyage-choice" data-voyage-pick="1">土地分封給農民。</button>`,
    ])}${miss}`;
  }
  if (play === "ford") {
    const ford = fordOf(row);
    const ask = form === 0 ? ford.ask : "商隊要過河。邊一處先可信？";
    const spots = ford.spots.map(
      (spot, i) =>
        `<button type="button" class="voyage-choice" data-voyage-pick="${i}"><b>${esc(spot.name)}</b>${esc(spot.clue)}</button>`
    );
    return `<p class="voyage-who">步卒</p><p class="voyage-line">${esc(ask)}</p>${choices(spots)}${miss}`;
  }
  if (play === "match") {
    if (row.hold) {
      return `<p class="voyage-who">七雄</p><p class="voyage-line">${esc(row.miss)}</p><button type="button" class="voyage-go" data-voyage-retry="1">再放一次</button>`;
    }
    const task = MAP_TASKS[row.drill ? 1 : 0];
    const names = ["秦", "齊", "楚", "燕", "蜀"].map((name) => {
      const on = held === name ? " is-held" : "";
      return `<button type="button" class="voyage-choice${on}" data-voyage-map="${name}">${name}</button>`;
    });
    return `<p class="voyage-who">七雄</p><p class="voyage-line">${esc(task.ask)}</p><div class="voyage-map" aria-label="戰國方位">
      <button type="button" class="voyage-slot" data-voyage-slot="北">北</button>
      <button type="button" class="voyage-slot" data-voyage-slot="西">西</button>
      <span class="voyage-map-mid">中</span>
      <button type="button" class="voyage-slot" data-voyage-slot="東">東</button>
      <button type="button" class="voyage-slot" data-voyage-slot="南">南</button>
    </div><div class="voyage-choices voyage-names">${joinChoices(names, seed)}</div>${miss}`;
  }
  if (play === "haul") {
    if (row.hold) {
      return `<p class="voyage-who">渡口</p><p class="voyage-line">${esc(row.miss)}</p><button type="button" class="voyage-go" data-voyage-retry="1">再判斷一次</button>`;
    }
    const haul = HAULS[row.drill ? 1 : 0];
    const clues = `<div class="voyage-clues"><span class="voyage-clue">運輸：溝通南北</span><span class="voyage-clue">民力：徵發甚眾</span></div>`;
    return `<p class="voyage-who">渡口</p><p class="voyage-line">${esc(haul.ask)}</p>${clues}${choices([
      `<button type="button" class="voyage-choice" data-voyage-pick="0">${esc(haul.ok)}</button>`,
      `<button type="button" class="voyage-choice" data-voyage-pick="1">${esc(haul.bad)}</button>`,
    ])}${miss}`;
  }
  if (play === "slip") {
    const ask = form === 0 ? "各國文字不一，政令送不出。邊份材料先解決溝通？" : "商人要送政令。邊份材料先讀得通？";
    return `<p class="voyage-who">商人</p><p class="voyage-line">${esc(ask)}</p>${choices([
      `<button type="button" class="voyage-choice" data-voyage-pick="0"><b>材料甲</b>統一文字，方便政令傳達。</button>`,
      `<button type="button" class="voyage-choice" data-voyage-pick="1"><b>材料乙</b>統一文字，為了推廣文學。</button>`,
    ])}${miss}`;
  }
  if (play === "seal") {
    const chips = clueChips(row)
      .map((text) => `<span class="voyage-clue">${esc(text)}</span>`)
      .join("");
    const lead = chips ? `<div class="voyage-clues">${chips}</div>` : "";
    const ask = form === 0
      ? "把沿路線索放在一起。這句「北宋始終以長安為都」，邊句先對？"
      : "沿路都係先對時代同地方。這句都城，邊句先接得上？";
    return `<p class="voyage-who">步卒</p><p class="voyage-line">${esc(ask)}</p>${lead}${choices([
      `<button type="button" class="voyage-choice" data-voyage-pick="0">北宋都開封。長安是漢唐舊都。</button>`,
      `<button type="button" class="voyage-choice" data-voyage-pick="1">長安就是開封。</button>`,
    ])}${miss}`;
  }
  return "";
}

function judgePlay(row, pick) {
  const play = playOf(row.stop, row);
  const form = askForm(row);
  const n = Number(pick);
  if (play === "trail") {
    const trust = n === 0;
    if (n !== 0 && n !== 1) return null;
    const ok = form === 0 ? trust : !trust;
    return ok ? { ok: true } : { ok: false, miss: "傳統史序是夏、商、周。" };
  }
  if (play === "rumor") {
    const voice = rumorAt(row).voices[n];
    if (!voice) return null;
    const distinguishing = row.line <= 0;
    const ok = distinguishing ? !!voice.false : !voice.false;
    if (ok) return distinguishing ? { ok: true, advance: true } : { ok: true };
    const miss = rumorAt(row).miss;
    if (!row.drill) return { ok: false, miss, drill: 1, line: 0, hold: 0 };
    return { ok: false, miss, drill: 1, line: 0, hold: 1 };
  }
  if (play === "task") {
    if (row.line <= 0 && form === 0) {
      if (n === 0) return { ok: true, advance: true };
      if (n === 1) return { ok: false, miss: "西周是世襲分封。全國置郡縣、不封子弟，是秦統一之後。" };
      return null;
    }
    if (n === 0) return { ok: true };
    if (n === 1) return { ok: false, miss: "周王把土地和人民分封給親族與功臣。受封的是諸侯。" };
    return null;
  }
  if (play === "ford") {
    const spot = fordOf(row).spots[n];
    if (!spot) return null;
    return spot.ok ? { ok: true } : { ok: false, miss: fordOf(row).miss };
  }
  if (play === "match") {
    return null;
  }
  if (play === "haul") {
    const hint = "大運河便利南北轉運，同時徵發民力甚眾。";
    if (n === 0) return { ok: true };
    if (n === 1) {
      if (!row.drill) return { ok: false, miss: hint, drill: 1, line: 0, hold: 0 };
      return { ok: false, miss: hint, drill: 1, line: 0, hold: 1 };
    }
    return null;
  }
  if (play === "slip") {
    if (n === 0) return { ok: true };
    if (n === 1) return { ok: false, miss: "書同文是統一文字，方便政令傳達。不是為了推廣文學。" };
    return null;
  }
  if (play === "seal") {
    if (n === 0) return { ok: true };
    if (n === 1) return { ok: false, miss: "北宋都城是開封。長安主要是漢唐舊都。" };
    return null;
  }
  return null;
}

function judgeMap(row, name, slot) {
  const task = MAP_TASKS[row?.drill ? 1 : 0];
  const hint = "秦在西，齊在東。楚在南，燕在北。蜀屬三國。";
  if (!name) return { ok: false, miss: "先點國名，再點圖上的一面。", drill: row?.drill ? 1 : 0, hold: 0, line: row?.line || 0 };
  if (name === task.name && slot === task.slot) return { ok: true };
  if (!row?.drill) return { ok: false, miss: hint, drill: 1, line: 0, hold: 0 };
  return { ok: false, miss: hint, drill: 1, line: 0, hold: 1 };
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
  if (row.stop === 9) return { who: "你", text: "渡口是你的。向前走到關城。" };
  if (row.stop === 10) return { who: "你", text: "關城是你的。" };
  return { who: "你", text: quiz.after };
}

const GOAL = [
  "到市集打聽消息",
  "去城樓",
  "去營帳接任務",
  "去河邊揀渡口",
  "去松山",
  "去七雄配一組",
  "去海岸",
  "去樓閣睇材料",
  "去渡口",
  "去關城對線索",
  "",
];

function ownedKey(stop) {
  return ["", "", "land", "camp", "river", "pine", "states", "coast", "loft", "ferry", "pass"][stop] || "";
}

function placeOwned(row) {
  const key = ownedKey(row.stop);
  return key ? !!row[key] : false;
}

function segmentDone(row) {
  const next = row.stop + 1;
  if (next <= 2) return !!row.land;
  const key = ownedKey(next);
  return key ? !!row[key] : false;
}

function isAsking(row) {
  const stop = STOPS[row.stop];
  if (!stop || row.line >= stop.lines.length - 1) return false;
  if (playOf(row.stop, row)) return true;
  return !!roadQuiz(row.spin, row.stop);
}

function canWalk(row, duel) {
  if (duel || needsRoute(row)) return false;
  if (isAsking(row)) return false;
  if (row.stop >= STOPS.length - 1) return false;
  if (row.stop === 0) return true;
  if (roadQuiz(row.spin, row.stop) && row.line < STOPS[row.stop].lines.length - 1) return false;
  return true;
}

function coachText(row) {
  if (row.guide >= 3) return "";
  if (playOf(row.stop, row) === "rumor") return row.line > 0 ? "再判斷商隊信邊句。" : "先分辨邊句係傳聞。";
  if (playOf(row.stop, row) === "trail") return "揀出可以沿住走的次序。";
  if (isAsking(row) || row.guide >= 2) return "揀一句回應。";
  if (row.stop > 0) return "";
  if (row.guide <= 0) return "拖左下圓鈕，向前走。";
  return "光柱那邊。走近旅人。";
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
    ferry: !!raw?.ferry,
    pass: !!raw?.pass,
    guide: raw?.guide == null ? (raw?.land ? 3 : 0) : Math.max(0, Math.min(3, Number(raw.guide) || 0)),
    flag: !!raw?.flag,
    flagName: String(raw?.flagName || "").slice(0, 8),
    spin: Math.max(0, Math.min(48, Number(raw?.spin) || 0)),
    route: raw?.route === "ridge" || raw?.route === "market" ? raw.route : "",
    marketClue: !!raw?.marketClue,
    ridgeClue: !!raw?.ridgeClue,
    drill: raw?.drill ? 1 : 0,
    hold: raw?.hold ? 1 : 0,
    night: dayKey(raw?.night),
    nightTry: dayKey(raw?.nightTry),
    nightMiss: String(raw?.nightMiss || "").slice(0, 80),
    ...taleRow(raw),
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
      const name = index === 1 && routeOf(row) === "ridge" ? "山路" : s.name;
      return `<span class="${cls}">${esc(name)}</span>`;
    })
    .join("");
}

function routeHtml(row) {
  const marketNote = row.marketClue ? "走過" : "未走過";
  const ridgeNote = row.ridgeClue ? "走過" : "未走過";
  return `<p class="voyage-who">步卒</p><p class="voyage-line">這一程走邊條？支線同河邊遇到的事會唔同。</p><div class="voyage-choices">
    <button type="button" class="voyage-choice" data-voyage-route="market"><b>經市集</b>${marketNote}。聽兩個人的傳聞。河邊是另一組渡口。</button>
    <button type="button" class="voyage-choice" data-voyage-route="ridge"><b>經山路</b>${ridgeNote}。睇石上的次序。河邊換成另一組渡口。</button>
  </div>`;
}

function ledgerHtml(row) {
  const walked = [];
  if (row.marketClue || (routeOf(row) !== "ridge" && row.stop > 1)) walked.push("市集");
  if (row.ridgeClue || (routeOf(row) === "ridge" && row.stop > 1)) walked.push("山路");
  [
    ["land", "城樓"],
    ["camp", "營帳"],
    ["river", "河邊"],
    ["pine", "松山"],
    ["states", "七雄"],
    ["coast", "海岸"],
    ["loft", "樓閣"],
    ["ferry", "渡口"],
    ["pass", "關城"],
  ].forEach(([key, name]) => {
    if (row[key]) walked.push(name);
  });
  const concepts = clueChips(row);
  const unseen = [];
  if (!row.marketClue) unseen.push("市集");
  if (!row.ridgeClue) unseen.push("山路");
  return `<p class="voyage-who">關城</p><p class="voyage-line">這一程結算</p>
    <p class="voyage-story">探索：${esc(walked.join("、") || "城門")}</p>
    <p class="voyage-story">進步：${esc(concepts.join("、") || "沿路再收")}</p>
    <p class="voyage-story">未發現：${esc(unseen.length ? unseen.join("、") : "市集同山路都走過")}</p>`;
}

function goalText(row) {
  if (needsRoute(row)) return "揀一條路";
  if (row.stop === 0 && routeOf(row) === "ridge") return "去山路睇次序";
  return GOAL[row.stop] || "";
}

function boxHtml(row, pathOpen, gender, mix, held) {
  if (taleActive(row)) return taleHtml(row);
  if (taleOffer(row)) return taleOfferHtml();
  if (needsRoute(row)) return routeHtml(row);
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
  const atFerry = row.stop === 9 && last;
  const atPass = row.stop === 10 && last;
  let lineText = line.text || "";
  if (atPass && row.pass) lineText = "商隊按年代過了關。馬跟住你。";
  else if (atFerry && row.ferry) lineText = "渡口是你的。可以抄捷徑。向前走到關城。";
  else if (atLoft && row.loft) lineText = "馬跟住你。已經屬於你的路可以快跑。向前走到渡口。";
  else if (atCoast && row.coast) lineText = "海岸是你的。向前走到樓閣。";
  else if (atStates && row.states) lineText = "這幅圖是你的。向前走到海岸。";
  else if (atPine && row.pine && !row.states) lineText = "城門到松山，是你的。向前，有一幅七雄的圖。";
  else if (atPine && row.pine) lineText = "城門到松山，是你的地盤。";
  else if (atRiver && row.river) lineText = "河邊是你的。向右走到松山。";
  else if (atCamp && row.camp) lineText = "城門到營帳是你的。可以重溫線索。向左走到河邊。";
  else if (atTower && row.land) lineText = "城門到城樓是你的。再向前，營帳也可以是你的。";
  else if (atTower) lineText = "你上了城樓。這條路可以是你的地盤。";
  let controls = "";
  const asking = isAsking(row);
  const quiz = asking ? roadQuiz(row.spin, row.stop) : null;
  if (asking && playOf(row.stop, row)) {
    const coach = coachText(row);
    const note = coach ? `<p class="voyage-coach-line">${esc(coach)}</p>` : "";
    return `${threadHtml(row, true)}${playHtml(row, gender, mix, held)}${note}`;
  }
  if (asking && quiz) {
    lineText = quiz.claim;
    const quizButtons = joinChoices([
      `<button type="button" class="voyage-choice" data-voyage-pick="0">${esc(quiz.ok)}</button>`,
      `<button type="button" class="voyage-choice" data-voyage-pick="1">${esc(quiz.bad)}</button>`,
    ], choiceSeed(row, mix, "quiz"));
    controls = `<div class="voyage-choices">${quizButtons}</div>${row.miss ? `<p class="voyage-miss">${esc(row.miss)}</p>` : ""}`;
  } else if (atPass && row.pass) {
    controls = `${ledgerHtml(row)}<div class="voyage-actions">
      <button type="button" class="voyage-go" data-voyage-duel="1">去同窗</button>
      <button type="button" class="voyage-go" data-voyage-replay="1">再走一程</button>
      <button type="button" class="voyage-go" data-voyage-home="1">回到行旅</button>
      ${row.camp ? `<button type="button" class="voyage-go" data-voyage-review="1">重溫線索</button>` : ""}
    </div><p class="voyage-hint">${
      row.flag
        ? `布旗下記住${esc(row.flagName || "同窗")}。馬跟住你。已經屬於你的路可以快跑。`
        : "馬跟住你。已經屬於你的路可以快跑。"
    }</p>`;
  } else if (needsClaim(row)) {
    const kind = claimKind(row.stop);
    controls = `<button type="button" class="voyage-go" data-voyage-${kind}="1">收下</button>`;
  } else if (canWalk(row, false)) {
    controls = roadActions(row);
  }
  const coach = coachText(row);
  const note = coach ? `<p class="voyage-coach-line">${esc(coach)}</p>` : "";
  const taleBack =
    row.bookSkip && !row.book && !row.bookDone
      ? `<button type="button" class="voyage-go" data-tale="accept">接阿禾的求援信</button>`
      : "";
  const storyHtml = atPass && row.pass ? "" : threadHtml(row, asking);
  const head = asking && quiz
    ? `<p class="voyage-who">${esc(quiz.who === "other" ? otherName(gender) : quiz.who)}</p>`
    : who;
  return `${head}<p class="voyage-line">${esc(lineText)}</p>${storyHtml}${note}${taleBack}${controls}`;
}

function needsClaim(row) {
  if (isAsking(row)) return false;
  if (row.line < STOPS[row.stop].lines.length - 1 && row.stop !== 2) return false;
  return !!claimKind(row.stop) && !placeOwned(row);
}

function claimKind(stop) {
  if (stop === 2) return "claim";
  if (stop === 3) return "finish";
  if (stop === 4) return "river";
  if (stop === 5) return "pine";
  if (stop === 6) return "states";
  if (stop === 7) return "coast";
  if (stop === 8) return "loft";
  if (stop === 9) return "ferry";
  if (stop === 10) return "pass";
  return "";
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

function duelHtml(duel, mates, row, mix) {
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
          `<button type="button" class="voyage-choice" data-voyage-rival="${esc(m.username)}">${esc(m.name)}</button>`
      )
      .join("");
    return `<p class="voyage-who">你</p><p class="voyage-line">揀一位同窗。帶自己的線索，同佢留下的一句一齊解。他的城仍是他的。</p><div class="voyage-choices">${buttons}</div><button type="button" class="voyage-go" data-voyage-duel-back="1">返回</button>`;
  }
  if (duel.phase === "won") {
    return `<p class="voyage-who">你</p><p class="voyage-line">兩份放在一起。布旗插上。${esc(duel.name)}的城仍是他的。</p><button type="button" class="voyage-go" data-voyage-duel-back="1">回到自己的路</button>`;
  }
  const mine = shareClue(row);
  if (!mine) {
    return `<p class="voyage-who">你</p><p class="voyage-line">先經市集或山路，帶一份線索再來。</p><button type="button" class="voyage-go" data-voyage-duel-back="1">返回</button>`;
  }
  const puzzle = coopOf(row);
  const miss = duel.miss ? `<p class="voyage-miss">${esc(duel.miss)}</p>` : "";
  const flags = joinChoices([
    `<button type="button" class="voyage-choice" data-voyage-flag="1">${esc(puzzle.ok)}</button>`,
    `<button type="button" class="voyage-choice" data-voyage-flag="0">${esc(puzzle.bad)}</button>`,
  ], `${mix}|duel|${row?.spin}|${puzzle.mine}|${duel.name}`);
  return `<p class="voyage-who">步卒 · ${esc(duel.name)}的城門</p><p class="voyage-line">你的線索：${esc(puzzle.mine)}</p><p class="voyage-line">同窗留下：${esc(puzzle.claim)}</p><p class="voyage-story">${esc(puzzle.ask)}他的城仍是他的。</p><div class="voyage-choices">${flags}</div>${miss}<button type="button" class="voyage-go" data-voyage-repick="1">另揀一位</button>`;
}

export function renderVoyage() {
  return `<section class="voyage is-loading" id="voyage-root">
    <canvas class="voyage-view" id="voyage-view" aria-hidden="true"></canvas>
    <p class="voyage-load" id="voyage-load">載入中</p>
    <button type="button" class="voyage-back" data-voyage-home="1">返回</button>
    <button type="button" class="voyage-tale" id="voyage-tale" data-tale="accept" hidden>求援信</button>
    <div class="voyage-path" id="voyage-path" aria-label="這一程"></div>
    <p class="voyage-goal" id="voyage-goal" hidden></p>
    <div class="voyage-arrow" id="voyage-arrow" hidden aria-hidden="true">↑</div>
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

  let review = false;

  const choiceMix = Math.floor(Math.random() * 0x7fffffff).toString(16);
  let heldName = "";
  const fail = () => ctx.toast?.("這一步未寫入。請再試一次。");

  const paint = () => {
    const current = ctx.getUser?.() || user;
    const row = readRow(current);
    const mates = matesOf(current, ctx.state?.cloudBoard);
    const path = document.getElementById("voyage-path");
    const box = document.getElementById("voyage-box");
    if (review && !row.camp) review = false;
    if (path) path.innerHTML = taleActive(row) ? talePath(row) : pathHtml(row);
    const taleBtn = document.getElementById("voyage-tale");
    if (taleBtn) taleBtn.hidden = !!row.bookDone || taleActive(row) || taleOffer(row);
    if (box) box.innerHTML = duel ? duelHtml(duel, mates, row, choiceMix) : review ? reviewHtml(row) : boxHtml(row, pathOpen, current?.gender, choiceMix, heldName);
    const walking = taleActive(row)
      ? taleWalking(row)
      : taleOffer(row)
        ? false
        : !duel && !review && canWalk(row, duel);
    const talking = taleActive(row) ? !walking : taleOffer(row) ? true : !!duel || review || isAsking(row) || needsRoute(row);
    pathOpen = walking;
    world?.setOpen(walking);
    world?.setHold(talking);
    world?.setPace(!!row.horse && segmentDone(row));
    world?.setRoute?.(routeOf(row));
    world?.setTale?.({
      on: taleActive(row),
      post: row.post,
      cart: !!row.cart,
    });
    world?.settle?.({
      land: !!row.land,
      camp: !!row.camp,
      river: !!row.river,
      states: !!row.states,
      coast: !!row.coast,
      loft: !!row.loft,
      ferry: !!row.ferry,
      pass: !!row.pass,
    });
    root.classList.toggle("is-rival", !!(duel && duel.phase !== "pick"));
    root.classList.toggle("is-talk", talking);
    const goal = document.getElementById("voyage-goal");
    if (goal) {
      const text = taleActive(row)
        ? taleGoal(row)
        : taleOffer(row)
          ? "聽阿禾把求援信交托"
          : needsRoute(row) || walking
            ? goalText(row)
            : "";
      goal.hidden = !text;
      goal.textContent = text;
    }
    const arrow = document.getElementById("voyage-arrow");
    if (arrow && !walking) arrow.hidden = true;
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
    if (!row.camp) ctx.toast?.("地盤大了。城門到營帳是你的。可以重溫線索。向左走到河邊。");
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
    pathOpen = true;
    world?.setOpen(true);
    if (!row.pine) ctx.toast?.("松山是你的。向前，有一幅七雄的圖。");
    paint();
  };

  const claimPlace = (row, key, toast) => {
    const next = { ...row, [key]: true, done: key === "pass" ? true : row.done, miss: "" };
    if (key === "loft") next.horse = true;
    if (!writeRow(name, next)) {
      fail();
      return;
    }
    if (key !== "pass") {
      pathOpen = true;
      world?.setOpen(true);
    }
    if (key === "loft") world?.lead();
    if (!row[key]) ctx.toast?.(toast);
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
    if (fresh) ctx.toast?.(`兩份放在一起。布旗插上。${rivalName}的城仍是他的。`);
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
    land: !!readRow(user).land,
    camp: !!readRow(user).camp,
    river: !!readRow(user).river,
    states: !!readRow(user).states,
    coast: !!readRow(user).coast,
    loft: !!readRow(user).loft,
    ferry: !!readRow(user).ferry,
    pass: !!readRow(user).pass,
    route: routeOf(readRow(user)),
    onProgress: (text) => {
      const el = document.getElementById("voyage-load");
      if (el) el.textContent = text;
    },
    onReady: () => {
      root.classList.remove("is-loading");
      const el = document.getElementById("voyage-load");
      if (el) el.hidden = true;
      const row = readRow(ctx.getUser?.() || user);
      if (taleActive(row) && !row.walk) world?.standTale?.(row.post);
    },
    onFail: () => {
      const el = document.getElementById("voyage-load");
      if (el) el.textContent = "場景載入不到。請返回再試。";
    },
    onArrive: (stop, keep) => {
      const row = readRow(ctx.getUser?.() || user);
      if (taleActive(row)) return;
      pathOpen = false;
      world?.setOpen(false);
      const owned = !!keep && placeOwned({ ...row, stop });
      const line = owned ? STOPS[stop].lines.length - 1 : 0;
      const next = { ...row, stop, line, miss: "", hold: 0, drill: 0, done: stop === 10 && !!row.pass };
      if (!save(next)) return;
      if (stop === 2 && !row.land) claimLand(readRow(ctx.getUser?.() || user));
    },
    onWalk: () => {
      const row = readRow(ctx.getUser?.() || user);
      if (row.guide !== 0) return;
      save({ ...row, guide: 1 });
    },
    onNear: () => {
      const row = readRow(ctx.getUser?.() || user);
      if (row.guide !== 1) return;
      save({ ...row, guide: 2 });
    },
    onTaleArrive: () => {
      const row = readRow(ctx.getUser?.() || user);
      if (!taleWalking(row)) return;
      pathOpen = false;
      world?.setOpen(false);
      save(taleApply(row, "arrive"));
    },
    onAim: (aim) => {
      const arrow = document.getElementById("voyage-arrow");
      if (!arrow) return;
      if (!aim?.show) {
        arrow.hidden = true;
        return;
      }
      const x = Math.max(12, Math.min(88, 50 + aim.x * 38));
      const y = Math.max(18, Math.min(62, 50 - aim.y * 28));
      arrow.hidden = false;
      arrow.style.left = `${x}%`;
      arrow.style.top = `${y}%`;
      arrow.style.transform = `rotate(${aim.deg || 0}deg)`;
    },
  });
  paint();

  const finishStop = (row) => {
    heldName = "";
    const doneRow = {
      ...row,
      line: STOPS[row.stop].lines.length - 1,
      miss: "",
      hold: 0,
      drill: 0,
      guide: row.guide < 3 ? 3 : row.guide,
    };
    if (row.stop < 6) {
      doneRow.weapon = true;
      doneRow.soldier = true;
    }
    if (row.stop === 1) {
      if (routeOf(row) === "ridge") doneRow.ridgeClue = true;
      else doneRow.marketClue = true;
    }
    if (row.stop === 4) doneRow.crossbow = true;
    if (row.stop === 5) doneRow.chariot = true;
    if (row.stop === 3) {
      claimCamp(doneRow);
      return;
    }
    if (row.stop === 4) {
      claimRiver(doneRow);
      return;
    }
    if (row.stop === 5) {
      claimPine(doneRow);
      return;
    }
    if (row.stop === 6) {
      claimPlace(doneRow, "states", "這幅圖是你的。向前走到海岸。");
      return;
    }
    if (row.stop === 7) {
      claimPlace(doneRow, "coast", "海岸是你的。向前走到樓閣。");
      return;
    }
    if (row.stop === 8) {
      claimPlace(doneRow, "loft", "馬跟住你。已經屬於你的路可以快跑。向前走到渡口。");
      return;
    }
    if (row.stop === 9) {
      claimPlace(doneRow, "ferry", "渡口是你的。可以抄捷徑。向前走到關城。");
      return;
    }
    if (row.stop === 10) {
      claimPlace(doneRow, "pass", "關城是你的。城門到關城是你的。");
      return;
    }
    if (save(doneRow)) {
      pathOpen = true;
      world?.setOpen(true);
      if (row.stop < 6) world?.grant();
      if (row.stop === 4) world?.arm();
      if (row.stop === 5) world?.hitch();
    }
  };

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
    const taleBtn = e.target.closest("[data-tale]");
    if (taleBtn) {
      const next = taleApply(row, taleBtn.dataset.tale);
      const note = taleToast(row, next, taleBtn.dataset.tale);
      const pay = taleBtn.dataset.tale === "finish" && !row.bookPay && next.bookDone;
      if (!save(next)) return;
      if (pay) addXp(XP_ONCE);
      if (next.book && !row.book) world?.standTale?.(0);
      if (next.bookDone) world?.place(next.stop || 0);
      if (note) ctx.toast?.(pay ? `${note}經驗 +${XP_ONCE}` : note);
      return;
    }
    const routeBtn = e.target.closest("[data-voyage-route]");
    if (routeBtn && needsRoute(row)) {
      const next = routeBtn.dataset.voyageRoute === "ridge" ? "ridge" : "market";
      save({ ...row, route: next, line: 0, miss: "" });
      return;
    }
    if (e.target.closest("[data-voyage-duel]")) {
      if (row.camp || row.pass) {
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
        duel = { ...duel, miss: coopOf(row).miss };
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
    if (e.target.closest("[data-voyage-retry]")) {
      heldName = "";
      save({ ...row, hold: 0 });
      return;
    }
    const mapBtn = e.target.closest("[data-voyage-map]");
    if (mapBtn && playOf(row.stop, row) === "match" && isAsking(row)) {
      heldName = mapBtn.dataset.voyageMap || "";
      paint();
      return;
    }
    const slotBtn = e.target.closest("[data-voyage-slot]");
    if (slotBtn && playOf(row.stop, row) === "match" && isAsking(row)) {
      const result = judgeMap(row, heldName, slotBtn.dataset.voyageSlot || "");
      heldName = "";
      if (!result.ok) {
        save(missRow(row, result));
        return;
      }
      finishStop(row);
      return;
    }
    const pick = e.target.closest("[data-voyage-pick]");
    if (pick) {
      const n = Number(pick.dataset.voyagePick);
      if (playOf(row.stop, row) && isAsking(row)) {
        const result = judgePlay(row, n);
        if (!result) return;
        if (!result.ok) {
          heldName = "";
          save(missRow(row, result));
          return;
        }
        if (result.advance) {
          heldName = "";
          save({ ...row, line: row.line + 1, miss: "", hold: 0, done: false });
          return;
        }
      }
      const quiz = roadQuiz(row.spin, row.stop);
      const opt = quiz && isAsking(row)
        ? (n === 0 ? { ok: true } : { ok: false, miss: quiz.miss })
        : shownLine(row).choice?.[n];
      if (playOf(row.stop, row) && isAsking(row)) {
        /* 玩法已在上面判完，落到完成這站 */
      } else {
        if (!opt) return;
        if (!opt.ok) {
          save({ ...row, miss: opt.miss || "再揀一句。" });
          return;
        }
      }
      finishStop(row);
      return;
    }
    if (e.target.closest("[data-voyage-review]")) {
      review = true;
      paint();
      return;
    }
    if (e.target.closest("[data-voyage-review-back]")) {
      review = false;
      paint();
      return;
    }
    if (e.target.closest("[data-voyage-cut]")) {
      const target = shortcutTarget(row);
      if (target > row.stop) world?.skipTo(target);
      return;
    }
    if (e.target.closest("[data-voyage-skip]")) {
      world?.skip();
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
      claimPlace(row, "loft", "馬跟住你。已經屬於你的路可以快跑。向前走到渡口。");
      return;
    }
    if (e.target.closest("[data-voyage-ferry]")) {
      claimPlace(row, "ferry", "渡口是你的。可以抄捷徑。向前走到關城。");
      return;
    }
    if (e.target.closest("[data-voyage-pass]")) {
      claimPlace(row, "pass", "關城是你的。城門到關城是你的。");
      return;
    }
    if (e.target.closest("[data-voyage-replay]")) {
      world?.place(0);
      save({ ...row, stop: 0, line: 0, miss: "", hold: 0, drill: 0, done: false, route: "", spin: (Number(row.spin) || 0) + 1 });
    }
  });
}
