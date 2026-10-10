/**
 * 今日機緣裡的連載。介面在 js/flavorSerial.js，唔係另一套遊戲。
 *
 * 學校時區 SCHOOL_TZ。同一天重新整理不會換成另一章。
 * 只有 playable: true 的章會出現。大綱章不會被說成今日新事件。
 * 下一章要等玩法確認後，先改 OUTLINES 再改成 playable，並寫上日期。
 *
 * 史實按通說整理，不是古籍原文。卷次待教師核實。
 * 書吏、案卷、路線是虛構，不能改寫分封或郡縣。
 */
export const SCHOOL_TZ = "Asia/Hong_Kong";

const SRC_ZHOU = "教學整理，不是古籍原文。西周分封諸侯、爵位世襲，方向見《史記·周本紀》。卷次與原文待教師核實。";
const SRC_QIN = "教學整理，不是古籍原文。統一後廷議分封、始皇從李斯而置郡縣，方向見《史記·秦始皇本紀》。卷次與原文待教師核實。";
const SRC_SHANG = "教學整理，不是古籍原文。商鞅在秦國境內推行縣制，方向見《史記·商君列傳》。年份與原文待教師核實。";

export const SERIAL_GOALS = [
  {
    id: "r_serial_junxian",
    name: "郡縣印",
    hint: "秦統一後，地方長官由朝廷任命，不是把子弟封成世襲諸侯。",
  },
  {
    id: "r_serial_fengjian",
    name: "分封圭",
    hint: "西周諸侯的爵位由子孫承繼。這套辦法不能改寫成秦的郡縣。",
  },
  {
    id: "r_serial_duizhao",
    name: "對照籤",
    hint: "兩套管地辦法要分開放。都是管地方，也不等於同一件事。",
  },
];

export const SERIAL_CHAPTERS = [
  {
    id: "c1",
    no: 1,
    playable: true,
    date: "2026-10-10",
    title: "兩套管地辦法",
    minutes: "約4分鐘",
    topic: "西周分封與秦郡縣",
    suspense: "有人把「分封諸侯」和「設立郡縣」叠成同一件事。你要先分開，再決定哪一句可以留在案上。",
    fiction: "書吏、案卷和兩條路線是虛構。制度按通說，故事不能把西周改成郡縣，也不能說全國郡縣在西周已經施行。",
    learned: "你分開了西周的世襲分封，同秦統一後由朝廷任命的郡縣。縣制在戰國的秦國已經有推行；不封子弟、在全國置郡縣，是統一之後的決定。",
    routes: {
      compare: {
        id: "compare",
        name: "先比較兩張卡",
        blurb: "一張講任命長官，一張講爵位世襲。先歸位，再釘一句證據。",
        hint: "看誰在講「子孫承繼」，誰在講「朝廷任命」。頌詞沒有制度，不能當證據。",
        cards: [
          {
            id: "jia",
            title: "卡片甲",
            bin: "qin",
            text: "傳統記載：秦統一六國後，朝廷議論過把土地分封給子弟。始皇採納李斯，沒有封子弟做世襲諸侯，而在地方設郡、縣，長官由朝廷任命。",
            source: SRC_QIN,
            wrong: "這張講的是統一之後的任命，不是西周的世襲爵位。",
          },
          {
            id: "yi",
            title: "卡片乙",
            bin: "zhou",
            text: "通說：西周由周天子分封諸侯，授土授民，爵位由子孫承繼。這是世襲分封，不是由朝廷任免的郡縣長官。",
            source: SRC_ZHOU,
            wrong: "這張講的是爵位世襲，不是秦的郡縣任命。",
          },
        ],
        trays: [
          { id: "qin", name: "秦的郡縣" },
          { id: "zhou", name: "西周的分封" },
        ],
        evidencePrompt: "兩張都歸位之後，哪一句可以釘在案上？",
        slips: [
          {
            id: "appoint",
            ok: true,
            text: "卡片甲：統一後不封子弟為世襲諸侯，地方長官由朝廷任命。",
            feedback: "這句沿着卡片甲，講的是制度，不是頌詞。縣制在統一前的秦國已有推行；全國這樣做、並且不封子弟，是統一後的決定。",
          },
          {
            id: "slogan",
            ok: false,
            text: "始皇天縱英明，所以任何制度都是他一天發明的。",
            feedback: "這句沒有寫出誰任命、誰世襲。空泛的稱讚不能代替兩張卡。",
          },
          {
            id: "same",
            ok: false,
            text: "兩張卡都在說：西周已經在全國設郡縣。",
            feedback: "卡片乙講的是世襲分封。把兩張卡收成同一句，就改寫了西周。",
          },
        ],
      },
      order: {
        id: "order",
        name: "先排三件事",
        blurb: "年份先不揭開。排對之後，再改一句把郡縣說成西周的批註。",
        hint: "世襲分封在最前。秦國境內的縣制在統一之前。全國置郡縣、不封子弟在最後。",
        items: [
          { id: "zhou", text: "西周分封諸侯，爵位由子孫承繼", year: "西周，在秦統一之前", source: SRC_ZHOU },
          { id: "shang", text: "商鞅在秦國變法，於秦國境內推行縣制", year: "戰國，秦孝公在位時", source: SRC_SHANG },
          { id: "unify", text: "秦統一後置郡縣，長官任命，不封子弟為諸侯", year: "公元前221年統一之後", source: SRC_QIN },
        ],
        startOrder: ["unify", "zhou", "shang"],
        answer: ["zhou", "shang", "unify"],
        claim: "虛構批註：郡縣從西周就已經是全國制度，秦沒有改過。",
        claimPrompt: "次序排正之後，這句批註要怎樣處理？",
        options: [
          {
            id: "early",
            ok: true,
            text: "這句把時間說早了。縣制在戰國的秦國已有；不封子弟、全國置郡縣，是統一之後的決定。",
            feedback: "對。三件事的先後不能收成「西周已經全國郡縣」。",
          },
          {
            id: "never",
            ok: false,
            text: "秦沒有郡縣，批註錯在捏造秦的制度。",
            feedback: "秦有郡縣。批註錯在把全國郡縣說成西周舊制，不是否定秦。",
          },
          {
            id: "keep",
            ok: false,
            text: "次序改好就夠，這句可以保留。",
            feedback: "次序只排正三件事。這句仍把郡縣說成西周全國制度，還要改。",
          },
        ],
      },
    },
  },
];

/** 其餘四章只供確認，學生畫面不會把它們當成今日新事件。 */
export const SERIAL_OUTLINES = [
  {
    id: "c2",
    no: 2,
    playable: false,
    date: "2026-10-11",
    title: "三十六郡，先分數字和制度",
    minutes: "約4分鐘",
    topic: "傳統郡數與任命制度",
    learned: "課堂先記長官由朝廷任命、不是世襲。傳統記載有三十六郡，確實郡數學者有討論，不能用一個數字取代制度。",
    routes: [
      "甲：比較「分天下以為三十六郡」的教學整理，同一句「所以郡數永遠是三十六，多一郡就不是秦」。",
      "乙：把廷議、從李斯、置郡排回先後，再選哪句只是數字、哪句是制度。",
    ],
    ops: ["比較資料", "整理時序", "選證據"],
    relic: "不另抽新信物。沿用學生已選的那一件，加上「郡數不能取代任命」一句。",
  },
  {
    id: "c3",
    no: 3,
    playable: false,
    date: "2026-10-12",
    title: "長城不要收成郡縣的同一句",
    minutes: "約4分鐘",
    topic: "秦連接北方舊牆的通說",
    learned: "通說是秦把燕、趙、秦的北方舊牆連接起來。這不等於今天看見的明長城，也不等於郡縣制度本身。",
    routes: [
      "甲：比較「連接舊牆」和「始皇一天從零砌出整條今天的長城」。",
      "乙：排戰國各國長城、秦統一、連接北方舊牆，再選哪句把工程說成一天。",
    ],
    ops: ["比較資料", "整理時序", "選證據"],
    relic: "同一件信物加上長城這一行。沒有限時獎，也沒有抽獎。",
  },
  {
    id: "c4",
    no: 4,
    playable: false,
    date: "2026-10-13",
    title: "焚書的範圍",
    minutes: "約5分鐘",
    topic: "焚書與坑術士不要併成一下午",
    learned: "通說：非秦記的史書、以及民間所藏的詩書百家要收繳；博士官所職、醫藥卜筮種樹之書不在此列。坑術士是次年的另一件事。不能說成所有書一天燒光。",
    routes: [
      "甲：比較本紀方向的焚書範圍，同「連醫藥卜筮和秦國史書都燒盡」。",
      "乙：排統一、焚書（三十四年）、坑術士（三十五年），再指出哪句把兩件事收成一下午。",
    ],
    ops: ["比較資料", "整理時序", "選證據"],
    relic: "同一件信物加上焚書範圍。重玩不加首次獎勵。",
  },
  {
    id: "c5",
    no: 5,
    playable: false,
    date: "2026-10-14",
    title: "三句並陳",
    minutes: "約5分鐘",
    topic: "郡縣、焚書、長城不能收成一天",
    learned: "三件事可以並陳：任命長官、焚書有範圍、長城是連接舊牆。不能用「始皇一天做完」蓋住它們。",
    routes: [
      "甲：三張卡並排，選出把三件事收成單一原因的那一句。",
      "乙：先把三件事排回大致先後，再選可以留下的證據。",
    ],
    ops: ["比較資料", "整理時序", "選證據"],
    relic: "連載收束。仍是學生一開始選的那一件信物，不新發第二件首次獎勵。",
  },
];

export function schoolDay(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SCHOOL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const pick = (type) => parts.find((p) => p.type === type)?.value || "";
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

export function serialChapter(id) {
  return SERIAL_CHAPTERS.find((ch) => ch.id === id) || null;
}

export function serialForDay(day) {
  return SERIAL_CHAPTERS.find((ch) => ch.playable && ch.date === day) || null;
}

export function serialGoal(id) {
  return SERIAL_GOALS.find((goal) => goal.id === id) || null;
}
