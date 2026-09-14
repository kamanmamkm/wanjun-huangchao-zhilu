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
  if (nch) return `下回：${nch.title}（關卡製作中，可先打錯史）。`;
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
  {
    id: "enc_keju_qin",
    setup: "有人話：「秦始皇用科舉揀官。」你點辨？",
    options: [
      { text: "科舉係隋唐以後先成熟，秦行郡縣任官", good: true, reply: "對。制度要對時代，唔好後世套前朝。" },
      { text: "始皇開科取士，所以秦好強", good: false, reply: "張冠李戴。科舉唔喺秦代。" },
      { text: "科舉同郡縣其實一樣", good: false, reply: "一個係選官辦法，一個係地方制度。" },
    ],
  },
  {
    id: "enc_song_changan",
    setup: "同學寫「北宋都城係長安」。你點改？",
    options: [
      { text: "北宋都開封（東京）", good: true, reply: "記穩。長安多指漢唐帝都。" },
      { text: "北宋都城係南京", good: false, reply: "南宋後來以臨安為行在，唔好混。" },
      { text: "都城唔重要，背年號就得", good: false, reply: "都城一亂，戰爭同漕運都會記錯。" },
    ],
  },
  {
    id: "enc_opium_cause",
    setup: "有人話鴉片戰爭「只因為中國唔肯開放」。你點應？",
    options: [
      { text: "要因包括貿易、禁煙同武力侵權，唔好單一歸因", good: true, reply: "善。大事往往多因交織。" },
      { text: "完全係林則徐一個人引起", good: false, reply: "把複雜事件推給一人，史觀太窄。" },
      { text: "同清朝無關，係明朝嘅事", good: false, reply: "時代錯置。鴉片戰爭在清道光年間。" },
    ],
  },
  {
    id: "enc_sun_three",
    setup: "有人問三民主義係邊三民。你點答？",
    options: [
      { text: "民族、民權、民生", good: true, reply: "記穩這三綱，後面民國史先接得上。" },
      { text: "民主、民有、民享就等於三民", good: false, reply: "那是另一套表述，課堂先記孫文三民。" },
      { text: "同孔子仁義禮一樣", good: false, reply: "時代同問題都不同，唔好硬套。" },
    ],
  },
  {
    id: "enc_reform",
    setup: "有人把改革開放講成「1949 年開始」。你點糾正？",
    options: [
      { text: "改革開放以 1978 年十一屆三中全會前後為標誌", good: true, reply: "開國同改革係兩段，年分要分開記。" },
      { text: "改革開放就係鴉片戰爭", good: false, reply: "差太遠。一個近代，一個當代。" },
      { text: "年分唔使記", good: false, reply: "當代史最易混，年分係骨架。" },
    ],
  },
  {
    id: "enc_ming_prime",
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

export function todayEncounter(day = isoDay()) {
  const n = [...String(day)].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const enc = ENCOUNTERS[n % ENCOUNTERS.length];
  return { ...enc, day };
}
