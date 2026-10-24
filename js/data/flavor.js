/**
 * 短循環趣味：答題旁白、過關信物、今日機緣、下回鉤。
 */
import { CHAPTERS, chapterList } from "./chapters.js?v=rad171";
import { QUESTIONS } from "./questions.js?v=rad83";
import { filterByFormYear } from "./formYear.js?v=rad114";

const GOOD_LINES = [
  "善。這一點站得住。",
  "正是。先把理據記穩。",
  "對。識史先識其時。",
  "記住這個判斷，後面用得著。",
];
const BAD_LINES = [
  "未中。再問：證據在哪？",
  "差一線。排除明顯不合理的。",
  "再睇材料，勿急於定論。",
  "張冠李戴最常見——先核時代。",
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function flavorLine({ ok, streak = 0 }) {
  if (ok && streak >= 5) return "連捷五題——史識漸成骨血。";
  if (ok && streak >= 3) return `連捷 ${streak} 題。先記下這條理據。`;
  return ok ? pick(GOOD_LINES) : pick(BAD_LINES);
}

/** 每關第一次完成可偶得；唔加經驗。 */
export const RELICS = {
  "ch1_escape:story": { id: "r_gate", name: "城門路引", hint: "啟程時袖中一紙，提醒勤學是出路。" },
  "ch1_escape:basic": { id: "r_nameplate", name: "識名木牌", hint: "夏商周與科舉，先識其名。" },
  "ch1_escape:interact": { id: "r_ribbon", name: "時序絲帶", hint: "事件要放回較合理的先後。" },
  "ch1_escape:source": { id: "r_scrap", name: "殘簡一頁", hint: "頌詞不是證據，要找可核實的作為。" },
  "ch1_escape:boss": { id: "r_cinnabar", name: "校正朱筆", hint: "辨錯、修正、舉證，史頁才算修好。" },
  "ch2_figures:story": { id: "r_namelist", name: "人物名冊", hint: "識人先識其時其職。" },
  "ch2_figures:basic": { id: "r_era_seal", name: "時代印記", hint: "孔子春秋、鄭和在明，勿混為一談。" },
  "ch2_figures:interact": { id: "r_voice", name: "對談牙牌", hint: "用符合史實的回應，把對話說完。" },
  "ch2_figures:source": { id: "r_bio", name: "本紀夾註", hint: "正史經過編纂，宜對照其他材料。" },
  "ch2_figures:boss": { id: "r_mismatch", name: "張冠李戴籤", hint: "孔子與始皇不同世，這籤專揭錯置。" },
  "ch3_events:story": { id: "r_spine", name: "年代骨幹", hint: "商鞅在戰國，安史在唐，鴉片戰爭在清。" },
  "ch3_events:basic": { id: "r_year_tag", name: "事件年籤", hint: "先問這件事在哪一朝。" },
  "ch3_events:interact": { id: "r_river", name: "長河細繩", hint: "由早到晚，把事件串起來。" },
  "ch3_events:source": { id: "r_treaty", name: "條約對讀", hint: "戰爭要配對它的條約。" },
  "ch3_events:boss": { id: "r_wrong_page", name: "錯頁朱印", hint: "《南京條約》不割台灣。" },
  "ch4_cause:story": { id: "r_why", name: "問因紙箋", hint: "先問為何，再記發生了什麼。" },
  "ch4_cause:basic": { id: "r_cause_tag", name: "原因木籤", hint: "書同文是為了政令傳達。" },
  "ch4_cause:interact": { id: "r_ask", name: "問因牙牌", hint: "用符合史實的理由回答古人。" },
  "ch4_cause:source": { id: "r_single", name: "單因夾註", hint: "一件結果往往不能只歸於一件事。" },
  "ch4_cause:boss": { id: "r_false_link", name: "偽因果印", hint: "相隔極遠的事，不宜寫成直接因果。" },
  "ch5_policy:story": { id: "r_scale", name: "權衡秤", hint: "措施有功，仍要問代價。" },
  "ch5_policy:basic": { id: "r_measure", name: "措施木籤", hint: "先問這項政策用來做什麼。" },
  "ch5_policy:interact": { id: "r_policy_ribbon", name: "政策絲帶", hint: "政策也要放回它的年代。" },
  "ch5_policy:source": { id: "r_cost", name: "代價夾註", hint: "只寫好處，通常講得太盡。" },
  "ch5_policy:boss": { id: "r_both", name: "並陳朱筆", hint: "開拓有功，民力負擔也要寫上。" },
  "ch6_compare:story": { id: "r_clip", name: "對讀夾", hint: "材料有限，先問它能證明到哪裡。" },
  "ch6_compare:basic": { id: "r_scope", name: "範圍木籤", hint: "一郡的話，只到這一郡。" },
  "ch6_compare:interact": { id: "r_source_ribbon", name: "材料絲帶", hint: "材料也要放回它的年代。" },
  "ch6_compare:source": { id: "r_pair", name: "兩則夾", hint: "立場不同，先分開再對讀。" },
  "ch6_compare:boss": { id: "r_over", name: "過度朱筆", hint: "一郡自述，不能講成全國人人如此。" },
  "ch7_synthesis:story": { id: "r_three", name: "三線夾", hint: "時代、制度、原因要分開再合看。" },
  "ch7_synthesis:basic": { id: "r_place", name: "歸位木籤", hint: "郡縣不是封建，科舉不是秦制。" },
  "ch7_synthesis:interact": { id: "r_span", name: "跨章絲帶", hint: "不同章的事，仍排在同一條線上。" },
  "ch7_synthesis:source": { id: "r_split", name: "拆句夾註", hint: "一句裡可以有多過一處錯。" },
  "ch7_synthesis:boss": { id: "r_return", name: "歸位朱筆", hint: "人物、制度、條約各自歸位。" },
  "ch8_finale_prep:story": { id: "r_crown", name: "登基紙箋", hint: "沒有一句可以同時刪去邊防同民生。" },
  "ch8_finale_prep:basic": { id: "r_rule", name: "治策木籤", hint: "推恩是削弱王國，不是恢復封建。" },
  "ch8_finale_prep:interact": { id: "r_rule_ribbon", name: "治策絲帶", hint: "制度先放回它的年代。" },
  "ch8_finale_prep:source": { id: "r_both_sides", name: "並顧夾註", hint: "邊防要顧，民力也要顧。" },
  "ch8_finale_prep:boss": { id: "r_pending", name: "待定朱筆", hint: "天下待定之前，先把代價寫上。" },
};

export function relicFor(chapterId, stageId) {
  return RELICS[`${chapterId}:${stageId}`] || null;
}

export function nextHook(chapterId, stageId) {
  const ch = CHAPTERS[chapterId];
  const stages = ch?.stages || [];
  const i = stages.findIndex((s) => s.id === stageId);
  const nxt = i >= 0 ? stages[i + 1] : null;
  if (nxt) return `下回：${nxt.title}——${nxt.goal || "接續前路。"}`;
  const list = chapterList();
  const ci = list.findIndex((c) => c.id === chapterId);
  const nch = ci >= 0 ? list[ci + 1] : null;
  if (nch?.stages?.length) return `下回：${nch.title}——${nch.blurb || ""}`;
  if (nch) return `下回：${nch.title}。關卡製作中。`;
  return "下回：行旅待你來試煉。";
}

export function nextStageAfter(chapterId, stageId) {
  const ch = CHAPTERS[chapterId];
  const stages = ch?.stages || [];
  const i = stages.findIndex((s) => s.id === stageId);
  if (i >= 0 && stages[i + 1]) return { chapterId, stageId: stages[i + 1].id, title: stages[i + 1].title };
  const list = chapterList();
  const ci = list.findIndex((c) => c.id === chapterId);
  const nch = ci >= 0 ? list[ci + 1] : null;
  if (nch?.stages?.[0]) {
    return { chapterId: nch.id, stageId: nch.stages[0].id, title: nch.stages[0].title };
  }
  return null;
}

export const ENCOUNTERS = [
  {
    id: "enc_confucius_qin",
    grade: "中一",
    topic: "人物識時",
    setup: "城門外有人爭論：「孔子輔佐秦始皇統一六國。」你點應？",
    options: [
      { text: "二人不同世，屬張冠李戴", good: true, reply: "正是。識人先識其時。" },
      { text: "孔子確實做過秦相", good: false, reply: "時代錯置。孔子在春秋，始皇在戰國末。" },
      { text: "唔關我事，走開", good: false, reply: "史識之路，遇錯便辨，方有長進。" },
    ],
  },
  {
    id: "enc_ode",
    grade: "中一",
    topic: "史料",
    setup: "攤販吹噓某官「愛民如子」，但講不出一件政事。你覺得？",
    options: [
      { text: "這是頌詞，缺少可核實的作為", good: true, reply: "善。評價要另找制度、詔令來核。" },
      { text: "古人不可能說謊，一定是仁君", good: false, reply: "舊書記載不一定等於客觀事實。" },
      { text: "文字越少越可信", good: false, reply: "材料少更要小心，唔等於更真。" },
    ],
  },
  {
    id: "enc_zhenguan",
    grade: "中一",
    topic: "隋唐",
    setup: "童子背書：「貞觀之治就是八股取士。」你點糾正？",
    options: [
      { text: "貞觀指唐太宗時期較清明的治世", good: true, reply: "對。八股是明清科舉文體，時代不同。" },
      { text: "貞觀就是鴉片戰爭", good: false, reply: "差太遠。鴉片戰爭是近代。" },
      { text: "背錯都冇所謂", good: false, reply: "名實一亂，後面史序會全歪。" },
    ],
  },
  {
    id: "enc_zhenghe",
    grade: "中二",
    topic: "明",
    setup: "有人把鄭和下西洋當成張騫出使西域。你點辨？",
    options: [
      { text: "鄭和在明朝；張騫是漢代", good: true, reply: "正是。都係「西行」，時代與任務不同。" },
      { text: "其實係同一件事", good: false, reply: "相隔千多年，只是方向都往西。" },
      { text: "都係唐朝玄奘", good: false, reply: "玄奘西行取經在唐，又係另一條線。" },
    ],
  },
  {
    id: "enc_summer",
    grade: "中一",
    topic: "夏商周",
    setup: "路邊賭先後：「商周夏」。你點排？",
    options: [
      { text: "傳統史序是夏→商→周", good: true, reply: "記穩這條骨幹，後面朝代先疊得上去。" },
      { text: "周最早，因為有武王", good: false, reply: "武王克商在後，夏商在前。" },
      { text: "三朝同時", good: false, reply: "傳統說法有先後，唔好混成一鍋。" },
    ],
  },
  {
    id: "enc_keju_qin",
    grade: "中一",
    topic: "秦漢",
    setup: "有人話：「秦始皇用科舉揀官。」你點辨？",
    options: [
      { text: "科舉係隋唐以後先成熟，秦行郡縣任官", good: true, reply: "對。制度要對時代，唔好後世套前朝。" },
      { text: "始皇開科取士，所以秦好強", good: false, reply: "張冠李戴。科舉唔喺秦代。" },
      { text: "科舉同郡縣其實一樣", good: false, reply: "一個係選官辦法，一個係地方制度。" },
    ],
  },
  {
    id: "enc_song_changan",
    grade: "中二",
    topic: "宋元",
    setup: "同學寫「北宋都城係長安」。你點改？",
    options: [
      { text: "北宋都開封（東京）", good: true, reply: "記穩。長安多指漢唐帝都。" },
      { text: "北宋都城係南京", good: false, reply: "南宋後來以臨安為行在，唔好混。" },
      { text: "都城唔重要，背年號就得", good: false, reply: "都城一亂，戰爭同漕運都會記錯。" },
    ],
  },
  {
    id: "enc_opium_cause",
    grade: "中二",
    topic: "清",
    setup: "有人話鴉片戰爭「只因為中國唔肯開放」。你點應？",
    options: [
      { text: "要因包括貿易、禁煙同武力侵權，唔好單一歸因", good: true, reply: "善。大事往往多因交織。" },
      { text: "完全係林則徐一個人引起", good: false, reply: "把複雜事件推給一人，史觀太窄。" },
      { text: "同清朝無關，係明朝嘅事", good: false, reply: "時代錯置。鴉片戰爭在清道光年間。" },
    ],
  },
  {
    id: "enc_sun_three",
    grade: "中三",
    topic: "民國",
    setup: "有人問三民主義係邊三民。你點答？",
    options: [
      { text: "民族、民權、民生", good: true, reply: "記穩這三綱，後面民國史先接得上。" },
      { text: "民主、民有、民享就等於三民", good: false, reply: "那是另一套表述，課堂先記孫文三民。" },
      { text: "同孔子仁義禮一樣", good: false, reply: "時代同問題都不同，唔好硬套。" },
    ],
  },
  {
    id: "enc_reform",
    grade: "中三",
    topic: "當代",
    setup: "有人把改革開放講成「1949 年開始」。你點糾正？",
    options: [
      { text: "改革開放以 1978 年十一屆三中全會前後為標誌", good: true, reply: "開國同改革係兩段，年分要分開記。" },
      { text: "改革開放就係鴉片戰爭", good: false, reply: "差太遠。一個近代，一個當代。" },
      { text: "年分唔使記", good: false, reply: "當代史最易混，年分係骨架。" },
    ],
  },
  {
    id: "enc_ming_prime",
    grade: "中二",
    topic: "明",
    setup: "有人話「明朝宰相權最大」。你點辨？",
    options: [
      { text: "明太祖廢丞相，六部直隸皇帝", good: true, reply: "對。明朝君權加強，唔好當成漢唐宰相。" },
      { text: "明朝同漢朝一樣設丞相", good: false, reply: "洪武廢相，後來有內閣，但唔係舊相權。" },
      { text: "宰相係清朝先有", good: false, reply: "相權源遠流長，明朝係廢相集權。" },
    ],
  },
];

export function isoDay(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function hashStr(s) {
  let n = 2166136261;
  for (const ch of String(s)) {
    n ^= ch.charCodeAt(0);
    n = Math.imul(n, 16777619);
  }
  return n >>> 0;
}

function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = seed >>> 0;
  for (let i = a.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function mcToEncounter(q) {
  return {
    id: q.id,
    grade: q.grade,
    topic: q.topic,
    setup: q.q,
    options: (q.options || []).map((text, i) => ({
      text,
      good: i === q.answer,
      reply: i === q.answer ? q.explain : "未中。先核時代同史實，聽日仲有新題。",
    })),
  };
}

export function dailyEncounterPool(user) {
  const year = user?.formYear;
  const debates = filterByFormYear(ENCOUNTERS, year);
  const quizzes = filterByFormYear(QUESTIONS.mc || [], year).map(mcToEncounter);
  const pool = [...debates, ...quizzes].filter((e) => e.id && e.setup && e.options?.length);
  if (pool.length) return pool;
  return filterByFormYear(ENCOUNTERS, "中一").filter((e) => e.id && e.setup && e.options?.length);
}

export const DAILY_FLAVOR_HITS = 3;
export const STAGE_QUIZ_COUNT = 8;

export function flavorHitsToday(user, day = isoDay()) {
  const f = user?.progress?.flavor || {};
  if (f.day !== day) return 0;
  const hits = Number(f.hits);
  if (Number.isFinite(hits) && hits > 0) return Math.min(DAILY_FLAVOR_HITS, hits);
  return f.id ? 1 : 0;
}

export function flavorDoneToday(user, day = isoDay()) {
  return flavorHitsToday(user, day) >= DAILY_FLAVOR_HITS;
}

/** 這個帳號做過的題目 id：長卷答題、今日機緣最近做過、以及機緣累積。 */
function doneQuestionIds(user) {
  const ids = new Set();
  const answered = user?.answered || {};
  Object.keys(answered).forEach((id) => {
    if (answered[id]) ids.add(id);
  });
  const flavor = user?.progress?.flavor || {};
  (flavor.doneIds || []).forEach((id) => id && ids.add(id));
  (flavor.seen || []).forEach((id) => id && ids.add(id));
  return ids;
}

function takeShuffled(list, seed) {
  return list.length ? seededShuffle(list, hashStr(seed)) : [];
}

/** 按年級每日最多三題。這個帳號做過的先換走；刷新唔會換未做過的同一題。 */
export function todayEncounter(user, day = isoDay()) {
  const pool = dailyEncounterPool(user);
  const year = user?.formYear || "中一";
  const done = doneQuestionIds(user);
  const hits = flavorHitsToday(user, day);
  const unseen = pool.filter((e) => e.id && !done.has(e.id));
  const src = unseen.length ? unseen : pool;
  let idx = hashStr(`${day}|${year}|${hits}`) % Math.max(src.length, 1);
  if (src.length > 1) {
    const prevIdx = hashStr(`${day}|${year}|${Math.max(0, hits - 1)}`) % src.length;
    if (idx === prevIdx) idx = (idx + 1) % src.length;
  }
  const enc = src[idx] || pool[0];
  return {
    ...enc,
    options: seededShuffle(enc.options, hashStr(`${day}|${enc.id}|${hits}`)),
    day,
    hit: hits + 1,
    remain: Math.max(0, DAILY_FLAVOR_HITS - hits),
  };
}

function mcToStageQuestion(q) {
  const a = Number(q.answer);
  return {
    id: q.id,
    type: q.type || "mc",
    skill: q.skill || "recall",
    topic: q.topic || "",
    q: q.q,
    options: [...(q.options || [])],
    answer: Number.isFinite(a) ? a : 0,
    explain: q.explain || "",
    misconception: q.misconception || "",
    grade: q.grade || "",
  };
}

function shuffleStageQuestion(q, seed) {
  const labeled = (q.options || []).map((text, i) => ({ text, i }));
  if (labeled.length < 2) return q;
  const mixed = seededShuffle(labeled, seed);
  return {
    ...q,
    options: mixed.map((o) => o.text),
    answer: mixed.findIndex((o) => o.i === q.answer),
  };
}

function stageQuestionPool(user, stage) {
  const baked = (stage.questions || []).map(mcToStageQuestion).filter((q) => q.q && q.options?.length);
  if (stage.onlyBaked) return baked;
  const year = user?.formYear || "中一";
  const source = Array.isArray(stage.questionIds) && stage.questionIds.length
    ? stage.questionIds.map((id) => (QUESTIONS.mc || []).find((q) => q.id === id)).filter(Boolean)
    : QUESTIONS.mc || [];
  const bank = filterByFormYear(source, year).map(mcToStageQuestion);
  const seen = new Set();
  const pool = [];
  for (const q of [...bank, ...baked]) {
    if (!q?.id || seen.has(q.id)) continue;
    seen.add(q.id);
    pool.push(q);
  }
  return pool.length ? pool : baked;
}

export function hydrateStageQuestions(user, stage, chapterId, ids, drawN) {
  const pool = stageQuestionPool(user, stage);
  const byId = new Map(pool.map((q) => [q.id, q]));
  const out = [];
  (ids || []).forEach((id, i) => {
    const q = byId.get(id);
    if (!q) return;
    out.push(shuffleStageQuestion(q, hashStr(`${chapterId}|${stage.id}|${drawN}|${id}|${i}`)));
  });
  return out;
}

/**
 * 長卷答題關：每次約 8 題。
 * 這個帳號未做過的先出；做過的只在新題不夠時補尾。
 * 上一組未用盡題庫之前不會原封再出。
 */
export function dailyStageQuestions(user, stage, chapterId, opts = {}) {
  const baked = (stage.questions || []).map(mcToStageQuestion).filter((q) => q.q && q.options?.length);
  const hasIds = Array.isArray(stage.questionIds) && stage.questionIds.length > 0;
  if (!baked.length && !hasIds) return baked;
  const pool = stageQuestionPool(user, stage);
  const n = Math.min(STAGE_QUIZ_COUNT, Math.max(baked.length, pool.length));
  const exclude = new Set(opts.excludeIds || []);
  const done = doneQuestionIds(user);
  const fresh = pool.filter((q) => q.id && !done.has(q.id) && !exclude.has(q.id));
  const freshLast = pool.filter((q) => q.id && !done.has(q.id) && exclude.has(q.id));
  const doneRest = pool.filter((q) => q.id && done.has(q.id) && !exclude.has(q.id));
  const doneLast = pool.filter((q) => q.id && done.has(q.id) && exclude.has(q.id));
  const drawN = Number(opts.drawN) || 1;
  const year = user?.formYear || "中一";
  const seed = `${year}|${chapterId}|${stage.id}|${drawN}`;
  const order = [
    ...takeShuffled(fresh, `${seed}|fresh`),
    ...takeShuffled(freshLast, `${seed}|fresh-last`),
    ...takeShuffled(doneRest, `${seed}|done`),
    ...takeShuffled(doneLast, `${seed}|done-last`),
  ].slice(0, n);
  return order.map((q, i) => shuffleStageQuestion(q, hashStr(`${chapterId}|${stage.id}|${drawN}|${q.id}|${i}`)));
}
