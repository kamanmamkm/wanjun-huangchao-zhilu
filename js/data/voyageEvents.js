/**
 * 航程中後段事件卡。
 * 早段（城門、市集／山路、城樓、營帳）仍係課堂入門，不在這裡。
 * 七雄仍係方位配對。同窗布旗仍係合作謎題。
 *
 * 每一站兩張卡，隨 spin 同路線輪換：經山路偏一張，再走一程 spin 加一。
 * 揀中會扣或冒險資源，並留下後果。時代對不上的選項不扣資源，也不能過站。
 * 每張卡至少有一個不強制扣資源的做法，避免糧絲見底就走唔完。
 *
 * 站 → 類型
 * 4 河邊　風險（黃河水勢／山溪涉水）
 * 5 松山　貨殖（以絲換路／關市繞路）
 * 7 海岸　路線（下西洋或留岸／官船或夜航）
 * 8 樓閣　貨殖（書同文／度量衡）
 * 9 渡口　風險（徵發換糧／河工與搶運）
 * 10 關城　後果（開封入城／開封市結算）
 */

export const KIT_KEYS = ["grain", "silk", "coin", "hands"];

export const KIT_LABEL = {
  grain: "糧",
  silk: "絲",
  coin: "錢",
  hands: "民力",
};

export const KIT_START = { grain: 4, silk: 2, coin: 3, hands: 3 };

const EVENTS = [
  {
    stop: 4,
    kind: "risk",
    era: "黃河 · 水勢",
    who: "梢公",
    ask: "水漲。商隊點過河？",
    body: "黃河水勢會變。等水退要耗糧；搶渡省糧，貨可能濕。這不是後世那條運河。",
    choices: [
      {
        title: "等水退",
        text: "岸上多留一陣，等人畜都過得去。",
        ok: true,
        cost: { grain: 1 },
        after: "糧少了一袋，人畜都過了。黃河不宜硬搶，等水勢是常見做法。",
        clue: "黃河水勢無常",
      },
      {
        title: "連夜搶渡",
        text: "不耗糧。水急，身上的絲可能濕。",
        ok: true,
        risk: { silk: 1 },
        after: "人過了，一匹絲濕了。趕渡省糧，貨損是代價。",
        afterEmpty: "人過了。沒有絲可濕，只是衣衫濕了。",
        clue: "搶渡會損貨",
      },
      {
        title: "寫成從不氾濫",
        text: "跟梢公說這條河從不有事，直接把車趕下水。",
        ok: false,
        miss: "黃河有氾濫同改道的記載，不能寫成從不有事。",
      },
    ],
  },
  {
    stop: 4,
    kind: "risk",
    era: "山溪 · 尚未是運河",
    who: "樵夫",
    ask: "山溪水急。商隊點過？",
    body: "眼前是山溪。雇熟手要花錢；自己涉水不花錢，糧可能濕。大運河是隋代以後的工程，不是這條溪。",
    choices: [
      {
        title: "雇熟手",
        text: "出一文錢，請識水的人帶路。",
        ok: true,
        cost: { coin: 1 },
        after: "用了一文錢，人熟悉水勢，貨沒有落水。本地熟手識水道。",
        clue: "雇熟手過溪",
      },
      {
        title: "自己涉水",
        text: "不花錢。貨頂在頭上，糧可能濕。",
        ok: true,
        risk: { grain: 1 },
        after: "人過了，一袋糧濕了。涉水省錢，濕貨是代價。",
        afterEmpty: "人過了。沒有糧可濕，這次只是人累。",
        clue: "涉水會濕糧",
      },
      {
        title: "改搭運河",
        text: "叫商隊改去搭隋煬帝的運河，不走這條溪。",
        ok: false,
        miss: "這一站是山溪。大運河是隋代以後的工程，不能當成眼前這條水。",
      },
    ],
  },
  {
    stop: 5,
    kind: "trade",
    era: "松山 · 絲貨",
    who: "貨郎",
    ask: "有人願意用帶路換一匹絲。這單點做？",
    body: "絲是外運的貨物。換嚮導少一匹絲，路較穩；自己走不先交絲，糧可能多耗。",
    choices: [
      {
        title: "換嚮導",
        text: "交一匹絲，請熟路的人帶過山。",
        ok: true,
        cost: { silk: 1 },
        after: "絲少了一匹，嚮導帶商隊過山。以貨換通行，是陸上商路的一種做法。",
        clue: "以絲換通行",
      },
      {
        title: "自己走",
        text: "絲留下。路不熟，糧可能多耗一袋。",
        ok: true,
        risk: { grain: 1 },
        after: "自己過了山，一袋糧吃掉了。不換嚮導，消耗在糧上，絲還在。",
        afterEmpty: "自己過了山。沒有糧可再耗，人是餓著過的。絲還在。",
        clue: "自走耗糧",
      },
      {
        title: "拿來統一文字",
        text: "把絲交給貨郎，說這是用來統一文字的。",
        ok: false,
        miss: "絲是貨物。統一文字是書同文，兩件事不要併成一件。",
      },
    ],
  },
  {
    stop: 5,
    kind: "trade",
    era: "關市 · 陸上過關",
    who: "關卒",
    ask: "關口要過路貨。你交絲，還是繞路？",
    body: "漢代以後，西域一帶的貿易要過關市。交絲可走直路；繞路保絲，人畜較累。",
    choices: [
      {
        title: "交絲過關",
        text: "交一匹絲，走關口的直路。",
        ok: true,
        cost: { silk: 1 },
        after: "關口放行。以貨代過路，絲少了，路是直的。",
        clue: "以絲過關",
      },
      {
        title: "繞小路",
        text: "不交絲。人畜多走一天，民力可能少一分。",
        ok: true,
        risk: { hands: 1 },
        after: "繞過了關，民力少了一分。保著絲，人畜較累。",
        afterEmpty: "繞過了關。民力已經見底，這次只是更慢。絲還在。",
        clue: "繞關耗民力",
      },
      {
        title: "說是鄭和設的",
        text: "跟關卒說這道關是明朝鄭和設的，不肯理。",
        ok: false,
        miss: "松山講陸上過關與絲貨。鄭和下西洋是明代海路，不是這道山關。",
      },
    ],
  },
  {
    stop: 7,
    kind: "route",
    era: "明朝 · 海岸",
    who: "船主",
    ask: "有船要出洋。商隊跟哪一條路？",
    body: "鄭和在明朝下西洋，船隊要靠港口補給。張騫是漢代走陸路，不能放在這條船上。",
    choices: [
      {
        title: "出錢跟船",
        text: "出一文錢補給，跟船沿海岸走，換回一袋糧。",
        ok: true,
        cost: { coin: 1 },
        gain: { grain: 1 },
        after: "用了一文錢，換到一袋糧。下西洋要補給港口，不是空船出海。",
        clue: "鄭和在明",
      },
      {
        title: "留在沿岸",
        text: "不出海。資源不動，只在岸上記低這條路。",
        ok: true,
        after: "資源未動。大規模下西洋是明朝的事，補給同耗費都不輕。這次沒有遠航。",
        clue: "下西洋耗費不輕",
      },
      {
        title: "改搭張騫的船",
        text: "要求改搭張騫的船，一起去西域。",
        ok: false,
        miss: "張騫出使西域是漢代陸路。鄭和是明朝海路，兩人不同世。",
      },
    ],
  },
  {
    stop: 7,
    kind: "route",
    era: "明朝 · 海疆",
    who: "岸吏",
    ask: "岸上有官船，也有人叫你夜航。你點走？",
    body: "明代海疆時開時禁。跟官船要給錢；夜航不給錢，貨可能被截。",
    choices: [
      {
        title: "跟官船",
        text: "出一文錢，跟有許可的官船走。",
        ok: true,
        cost: { coin: 1 },
        after: "錢少了一文，貨仍在。有許可的船較穩，費用是代價。",
        clue: "官船要納費",
      },
      {
        title: "夜航趕路",
        text: "不給錢。夜裡走，絲可能被截下一匹。",
        ok: true,
        risk: { silk: 1 },
        after: "夜航躲過查問，但少了一匹絲。省了錢，貨有風險。",
        afterEmpty: "夜航躲過查問。沒有絲可被截，人是空著手走的。",
        clue: "夜航有風險",
      },
      {
        title: "說是秦代海禁",
        text: "跟岸吏說這是秦代的海禁，船不必理。",
        ok: false,
        miss: "秦代不是這一站的海疆。海岸講的是明代出海同限制。",
      },
    ],
  },
  {
    stop: 8,
    kind: "trade",
    era: "秦 · 書同文",
    who: "商人",
    ask: "各國文字不一，這封政令點送過樓閣？",
    body: "書同文是秦統一文字，方便政令傳達，不是為了寫詩。刻標準字要花錢；只送口信就省錢，但難以複核。",
    choices: [
      {
        title: "出錢刻標準字",
        text: "出一文錢，把文書改成標準字再送。",
        ok: true,
        cost: { coin: 1 },
        after: "用了一文錢，文書各地都讀得通。統一文字的用處在政令傳達。",
        clue: "書同文為政令",
      },
      {
        title: "只送口信",
        text: "不花錢。叫人把政令背過去。",
        ok: true,
        after: "口信送到，錢還在。沒有留下統一的文字，政令不容易複核。",
        clue: "口信難複核",
      },
      {
        title: "改去推廣文學",
        text: "不送政令，改用這套字來推廣文學。",
        ok: false,
        miss: "書同文是為了政令傳達，不是為了推廣文學。",
      },
    ],
  },
  {
    stop: 8,
    kind: "trade",
    era: "秦 · 度量衡",
    who: "市吏",
    ask: "樓閣市集要用同一套斗斛。你的絲點算？",
    body: "秦統一度量衡，方便交易和徵收。換標準斗要花錢；今日不賣就不虧貨，也沒有成交。",
    choices: [
      {
        title: "換標準斗",
        text: "出一文錢，改用市集的標準斗來量絲。",
        ok: true,
        cost: { coin: 1 },
        after: "用了標準斗，絲數寫得清。統一度量是為了交易和徵收。",
        clue: "統一度量便交易",
      },
      {
        title: "今日不賣",
        text: "絲不入這場市。錢同貨都先留著。",
        ok: true,
        after: "絲未賣，資源未動。不入市就用不上標準斗，也沒有成交。",
        clue: "不入市就不成交",
      },
      {
        title: "說是孔子訂的",
        text: "跟市吏說這套斗是孔子訂的，不必改。",
        ok: false,
        miss: "統一度量衡是秦統一之後的制度。孔子在春秋，兩人不同世。",
      },
    ],
  },
  {
    stop: 9,
    kind: "risk",
    era: "隋唐 · 大運河",
    who: "渠長",
    ask: "渡口接上運河。北上的糧要徵人。你點用這條河？",
    body: "大運河溝通南北，同時徵發民力。不能寫成一日建成、毫無消耗。",
    choices: [
      {
        title: "出民力換糧",
        text: "出一分民力上船，換一袋北來的糧。",
        ok: true,
        cost: { hands: 1 },
        gain: { grain: 1 },
        after: "民力少了一分，糧多了一袋。運河方便轉運，徵發就是代價。",
        clue: "運河徵發民力",
      },
      {
        title: "人先走",
        text: "貨寄在渡口，人先走。這次不上船，也不徵人。",
        ok: true,
        after: "貨未上船，民力還在。人先走就未用到轉運，也未被徵發。",
        clue: "未上船就未徵發",
      },
      {
        title: "寫成一日建成",
        text: "在簿上寫：運河一日建成，民力毫無消耗。",
        ok: false,
        miss: "大運河便利南北轉運，同時徵發民力甚眾。不能寫成一日建成。",
      },
    ],
  },
  {
    stop: 9,
    kind: "risk",
    era: "隋唐 · 河工",
    who: "漕丁",
    ask: "河堤裂了。你出工，還是照開？",
    body: "運河要保養。修堤用民力；不修就開船，糧可能損。",
    choices: [
      {
        title: "先補堤",
        text: "出一分民力，先補堤再讓糧船過。",
        ok: true,
        cost: { hands: 1 },
        after: "堤補上了，糧船過得去。河工是運河能用的條件，民力是代價。",
        clue: "河工保漕運",
      },
      {
        title: "不修照開",
        text: "不修堤。糧船照開，糧可能少一袋。",
        ok: true,
        risk: { grain: 1 },
        after: "船過了，但少了一袋糧。省了民力，風險在貨上。",
        afterEmpty: "船驚險地過了。沒有糧可損，這次只是嚇一場。",
        clue: "不修堤會損糧",
      },
      {
        title: "說西周已修成",
        text: "跟漕丁說這條河在西周已經全國修成。",
        ok: false,
        miss: "全國性的大運河是隋代的工程。西周是分封，不是這條運河的時代。",
      },
    ],
  },
  {
    stop: 10,
    kind: "aftermath",
    era: "北宋 · 開封",
    who: "城門吏",
    ask: "關城要結算。你以什麼方式入開封？",
    body: "北宋的都城是開封，不是長安。長安是漢唐舊都。繳錢可換路引做買賣；只交記錄就不買賣。",
    choices: [
      {
        title: "換路引入城",
        text: "出一文錢換路引，入開封做一單，換回一匹絲。",
        ok: true,
        cost: { coin: 1 },
        gain: { silk: 1 },
        after: "路引寫明開封。錢換成絲。北宋的商業中心在開封一帶，長安不是本朝的都。",
        clue: "北宋都開封",
      },
      {
        title: "只交記錄",
        text: "不買賣。把沿路記錄交給城門，寫明都城在開封。",
        ok: true,
        after: "記錄收下了：開封是北宋的都，長安是舊都。這次沒有再做一單。",
        clue: "開封不是長安",
      },
      {
        title: "說長安就是開封",
        text: "跟吏員說長安就是開封，請他照舊都改寫。",
        ok: false,
        miss: "北宋都城是開封。長安主要是漢唐舊都，兩地不是同一個城。",
      },
    ],
  },
  {
    stop: 10,
    kind: "aftermath",
    era: "北宋 · 開封市",
    who: "關令",
    ask: "再走一程。這一程的貨在開封點結？",
    body: "仍是北宋這一段：都城看開封。可以把絲換成錢，或原封帶出關。",
    choices: [
      {
        title: "絲換成錢",
        text: "在開封市交一匹絲，換兩文錢。",
        ok: true,
        cost: { silk: 1 },
        gain: { coin: 2 },
        after: "絲換成錢。開封有市，這單做得成。都城仍是開封，不是長安。",
        clue: "開封有市",
      },
      {
        title: "原封帶走",
        text: "貨不賣。請關令只核對地方，放商隊出關。",
        ok: true,
        after: "貨沒有動。關令核對過：北宋看開封，漢唐舊都看長安。",
        clue: "開封對長安",
      },
      {
        title: "寫成定都長安",
        text: "在結算上寫：商隊住在長安，宋代也以長安為都。",
        ok: false,
        miss: "北宋都開封。長安是漢唐舊都，不能寫成宋代始終定都長安。",
      },
    ],
  },
];

export const VOYAGE_EVENTS = EVENTS;

const EVENT_STOPS = [4, 5, 7, 8, 9, 10];

export function isEventStop(stop) {
  return EVENT_STOPS.includes(stop);
}

function clampKit(n) {
  return Math.max(0, Math.min(9, n));
}

export function readKit(raw) {
  const src = raw && typeof raw === "object" ? raw : null;
  const kit = {};
  for (const key of KIT_KEYS) {
    const fallback = KIT_START[key];
    const n = src ? Number(src[key]) : fallback;
    kit[key] = clampKit(Number.isFinite(n) ? Math.round(n) : fallback);
  }
  return kit;
}

export function readList(raw, max, size) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => String(item || "").slice(0, size))
    .filter(Boolean)
    .slice(-max);
}

export function pushUnique(list, text, max) {
  const line = String(text || "").trim().slice(0, 24);
  const next = Array.isArray(list) ? [...list] : [];
  if (!line) return next;
  if (!next.includes(line)) next.push(line);
  return next.slice(-max);
}

export function pushAfter(list, text) {
  const line = String(text || "").trim().slice(0, 80);
  const next = Array.isArray(list) ? [...list] : [];
  if (!line) return next;
  next.push(line);
  return next.slice(-6);
}

export function kitLine(kit) {
  const src = kit || KIT_START;
  return KIT_KEYS.map((key) => `${KIT_LABEL[key]}${src[key] ?? 0}`).join(" · ");
}

export function stakeText(choice) {
  const bits = [];
  for (const key of KIT_KEYS) {
    const n = Number(choice?.cost?.[key]) || 0;
    if (n) bits.push(`-${n}${KIT_LABEL[key]}`);
  }
  for (const key of KIT_KEYS) {
    const n = Number(choice?.risk?.[key]) || 0;
    if (n) bits.push(`可能 -${n}${KIT_LABEL[key]}`);
  }
  for (const key of KIT_KEYS) {
    const n = Number(choice?.gain?.[key]) || 0;
    if (n) bits.push(`+${n}${KIT_LABEL[key]}`);
  }
  return bits.length ? bits.join("　") : "不耗資源";
}

function variantOf(row) {
  const spin = Number(row?.spin) || 0;
  const ridge = row?.route === "ridge" ? 1 : 0;
  return spin + ridge;
}

export function eventFor(stop, row) {
  const list = EVENTS.filter((event) => event.stop === stop);
  if (!list.length) return null;
  const i = ((variantOf(row) % list.length) + list.length) % list.length;
  return list[i];
}

export function judgeEvent(kit, event, index) {
  const choice = event?.choices?.[index];
  if (!choice) return null;
  if (!choice.ok) {
    return { ok: false, miss: choice.miss || "這一步同這站的時代對不上。" };
  }
  const src = readKit(kit);
  const cost = choice.cost || {};
  for (const key of KIT_KEYS) {
    if (src[key] < (Number(cost[key]) || 0)) {
      return { ok: false, miss: "這一步的資源不夠。換一個做得到的做法。" };
    }
  }
  const next = { ...src };
  for (const key of KIT_KEYS) next[key] -= Number(cost[key]) || 0;
  const risk = choice.risk || null;
  let dipped = false;
  if (risk) {
    for (const key of KIT_KEYS) {
      const n = Number(risk[key]) || 0;
      if (!n || next[key] <= 0) continue;
      next[key] -= Math.min(next[key], n);
      dipped = true;
    }
  }
  const gain = choice.gain || {};
  for (const key of KIT_KEYS) next[key] = clampKit(next[key] + (Number(gain[key]) || 0));
  const echo = risk && !dipped ? choice.afterEmpty || choice.after : choice.after;
  return { ok: true, kit: next, echo: echo || "", mark: choice.clue || "" };
}
