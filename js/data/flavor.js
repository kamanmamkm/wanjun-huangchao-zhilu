/**
 * 短循環趣味：答題旁白、過關信物、今日機緣、下回鉤。
 */
import { CHAPTERS, chapterList } from "./chapters.js";

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
  if (nch) return `下回：${nch.title}（關卡製作中，可先練習或打錯史）。`;
  return "下回：晉升殿待你來試煉。";
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
    setup: "城門外有人爭論：「孔子輔佐秦始皇統一六國。」你點應？",
    options: [
      { text: "二人不同世，屬張冠李戴", good: true, reply: "正是。識人先識其時。" },
      { text: "孔子確實做過秦相", good: false, reply: "時代錯置。孔子在春秋，始皇在戰國末。" },
      { text: "唔關我事，走開", good: false, reply: "史識之路，遇錯便辨，方有長進。" },
    ],
  },
  {
    id: "enc_ode",
    setup: "攤販吹噓某官「愛民如子」，但講不出一件政事。你覺得？",
    options: [
      { text: "這是頌詞，缺少可核實的作為", good: true, reply: "善。評價要另找制度、詔令來核。" },
      { text: "古人不可能說謊，一定是仁君", good: false, reply: "舊書記載不一定等於客觀事實。" },
      { text: "文字越少越可信", good: false, reply: "材料少更要小心，唔等於更真。" },
    ],
  },
  {
    id: "enc_zhenguan",
    setup: "童子背書：「貞觀之治就是八股取士。」你點糾正？",
    options: [
      { text: "貞觀指唐太宗時期較清明的治世", good: true, reply: "對。八股是明清科舉文體，時代不同。" },
      { text: "貞觀就是鴉片戰爭", good: false, reply: "差太遠。鴉片戰爭是近代。" },
      { text: "背錯都冇所謂", good: false, reply: "名實一亂，後面史序會全歪。" },
    ],
  },
  {
    id: "enc_zhenghe",
    setup: "有人把鄭和下西洋當成張騫出使西域。你點辨？",
    options: [
      { text: "鄭和在明朝；張騫是漢代", good: true, reply: "正是。都係「西行」，時代與任務不同。" },
      { text: "其實係同一件事", good: false, reply: "相隔千多年，只是方向都往西。" },
      { text: "都係唐朝玄奘", good: false, reply: "玄奘西行取經在唐，又係另一條線。" },
    ],
  },
  {
    id: "enc_summer",
    setup: "路邊賭先後：「商周夏」。你點排？",
    options: [
      { text: "傳統史序是夏→商→周", good: true, reply: "記穩這條骨幹，後面朝代先疊得上去。" },
      { text: "周最早，因為有武王", good: false, reply: "武王克商在後，夏商在前。" },
      { text: "三朝同時", good: false, reply: "傳統說法有先後，唔好混成一鍋。" },
    ],
  },
];

export function isoDay(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayEncounter(day = isoDay()) {
  const n = [...String(day)].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const enc = ENCOUNTERS[n % ENCOUNTERS.length];
  return { ...enc, day };
}
