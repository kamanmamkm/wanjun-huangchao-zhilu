/**
 * 今日歷史來信、五章史館、展品。介面在 js/museum.js。
 *
 * 老師加下一星期：
 * 1. 時區固定 Asia/Hong_Kong。同一天重新整理不會換信。
 * 2. 在 LETTERS 加日期與 chapterId。日期用 YYYY-MM-DD。
 * 3. 新玩法寫在 CHAPTERS。沒有寫上的日期，首頁要說「今日沒有新來信」。
 * 4. 檔案館不鎖日期。新學生可以由第一章補玩，不強制一天一章。
 * 5. 史館、來信、館長是虛構。CHAPTERS 裡的年份與事件不要為了劇情改掉。
 * 6. 來源未逐字核對卷次的，保持「待教師核實」，不要寫成古籍原文。
 */
export const LETTER_TZ = "Asia/Hong_Kong";

export const TEACHER_LETTER_GUIDE = `時區：Asia/Hong_Kong。同一天重新整理不會換另一封信。
下一星期：打開 js/data/letters.js，在 LETTERS 加上 YYYY-MM-DD 同 chapterId。
新章節寫在 CHAPTERS，註明玩法、答案、提示、來源、完成後解鎖哪個展位。
某個日期沒有對應行，學生會看見「今日沒有新來信」，並可重玩或補未完成的章。
不要把登入當成自願學習。研究紀錄只在學生早已同意的那個開關下記。
故事裡的史館與來信是虛構。展板史實不要為分支劇情改寫。`;

export const COLORS = [
  { id: "qing", name: "青" },
  { id: "zhu", name: "朱" },
  { id: "mo", name: "墨" },
];

export const SLOTS = [
  {
    id: "s1",
    after: "m1",
    title: "時序展板",
    blurb: "755年范陽起兵，756年潼關失守、肅宗靈武即位，757年唐軍收復長安。",
    challenge: "把四件事排回先後，而不是跟着來信的語氣。",
  },
  {
    id: "s2",
    after: "m3",
    title: "證據展板",
    blurb: "安祿山兼領范陽、平盧、河東，邊鎮兵力集中。這不能改寫成「只因一個人」。",
    challenge: "比較有兵力記載的說法，同過寬的個人說法。",
  },
  {
    id: "s3",
    after: "m5",
    title: "收束展板",
    blurb: "起兵、邊鎮兵力、763年亂事告一段落，可以並陳。單用「皇帝一天沒上朝」蓋不住八年。",
    challenge: "指出哪一句把多條證據收成單一原因。",
  },
];

const SRC_QIZHI = "教學整理，不是古籍原文。通說見《資治通鑑》唐紀天寶、至德、寶應年間。卷次與原文待教師核實。";
const SRC_LUSHAN = "教學整理，不是古籍原文。安祿山兼范陽、平盧、河東，史實方向見《舊唐書》安祿山傳。卷次待教師核實。";

export const CHAPTERS = [
  {
    id: "m1",
    no: 1,
    title: "四件事，哪件在先？",
    minutes: "約4分鐘",
    topic: "安史之亂時序",
    suspense: "有人把「收復長安」放在「范陽起兵」前面。展板如果這樣排，觀眾會以為戰爭倒着打。",
    fiction: "史館、來信、館長是虛構。下面四件事的先後按通說，故事不能把它們調換。",
    kind: "timeline",
    learned: "你用事件先後核對了安史之亂前段，而不是跟着一封虛構來信的語氣。",
    slot: "s1",
    items: [
      { id: "fan", text: "安祿山在范陽起兵", year: "755年（天寶十四載）", source: SRC_QIZHI },
      { id: "tong", text: "潼關失守，玄宗離開長安", year: "756年六月（至德元載）", source: SRC_QIZHI },
      { id: "ling", text: "肅宗在靈武即位", year: "756年七月", source: SRC_QIZHI },
      { id: "chang", text: "唐軍收復長安", year: "757年（至德二載）", source: SRC_QIZHI },
    ],
    startOrder: ["chang", "fan", "ling", "tong"],
    answer: ["fan", "tong", "ling", "chang"],
    hint: "先找「起兵」。收復長安不會在起兵之前。靈武即位在潼關失守之後。",
  },
  {
    id: "m2",
    no: 2,
    title: "這句來信把結束說早了",
    minutes: "約4分鐘",
    topic: "核對說法",
    suspense: "來信寫安史之亂在756年已經打完。如果你照着寫展板，763年的事會不見。",
    fiction: "來信是虛構文本，不是史料。你要核對的是通說裡的起訖，不是改寫結局。",
    kind: "claim",
    learned: "你指出「756年已經結束」把亂事說短了。通說要看到763年史朝義敗亡。",
    slot: "",
    claim: "虛構來信：安史之亂只打了一年，756年已經結束。",
    cards: [
      {
        id: "span",
        title: "起訖",
        text: "通說由755年范陽起兵，到763年史朝義敗亡，前後約八年，不是756年就結束。",
        source: SRC_QIZHI,
      },
      {
        id: "756",
        title: "756年發生了甚麼",
        text: "756年是潼關失守、玄宗離開長安、肅宗靈武即位。這是戰事中段，不是結束。",
        source: SRC_QIZHI,
      },
    ],
    prompt: "這句來信哪裡不合通說？用哪張卡修正？",
    options: [
      {
        id: "early",
        text: "來信把結束說早了。應用「起訖」那張卡，寫到763年。",
        ok: true,
        needs: ["span", "756"],
        feedback: "對。756年是中段。結束要看到763年史朝義敗亡。",
      },
      {
        id: "never",
        text: "來信錯在安史之亂沒有發生。",
        ok: false,
        needs: ["span"],
        feedback: "起兵與收京都有記載。問題是結束年份，不是否定事件。請看「起訖」。",
      },
      {
        id: "capital",
        text: "756年長安已經永遠不再收復。",
        ok: false,
        needs: ["756"],
        feedback: "756年不是結束，也不是長安永久失守。唐軍在757年收復長安。",
      },
    ],
    hint: "先打開兩張卡。756年那張說明的是中段，不是句號。",
  },
  {
    id: "m3",
    no: 3,
    title: "兩句話，哪句有兵力證據？",
    minutes: "約4分鐘",
    topic: "證據比較",
    suspense: "展板並排了兩句：一句講三鎮兵力，一句把整個戰事收成楊貴妃一個人。觀眾會以為兩句同樣有據。",
    fiction: "史館並排是虛構布置。兩句裡只有兵力那句沿着記載；故事不能把另一句改成真。",
    kind: "compare",
    learned: "你分開了有邊鎮兵力記載的說法，同過寬的個人說法。",
    slot: "s2",
    slips: [
      {
        id: "army",
        label: "說法甲",
        text: "安祿山兼領范陽、平盧、河東，邊鎮兵力集中在他手上。",
        source: SRC_LUSHAN,
      },
      {
        id: "one",
        label: "說法乙",
        text: "所以安史之亂完全是因為楊貴妃一個人。",
        source: "這句是過寬說法，不是上面那條兵力記載的內容。",
      },
    ],
    prompt: "兩句放在一起，哪一個比較站得住？",
    options: [
      {
        id: "army-ok",
        text: "甲有兼領三鎮的記載方向。乙把戰事收成一個人，甲支持不了乙。",
        ok: true,
        needs: ["army", "one"],
        feedback: "對。兵力資料說明邊鎮力量集中，不能直接推出「完全因為一個人」。",
      },
      {
        id: "same",
        text: "兩句同樣有據，因為都出現在同一塊展板。",
        ok: false,
        needs: ["army", "one"],
        feedback: "放在一起不等於同樣有據。請分開看甲的記載同乙的推論。",
      },
      {
        id: "only-one",
        text: "乙才是兵力證據，甲只是人名。",
        ok: false,
        needs: ["army"],
        feedback: "甲先寫了三鎮與兵力。乙沒有提供新的兵力記載。",
      },
    ],
    hint: "先讀完兩張。問的是「哪句得到記載支持」，不是哪句比較醒目。",
  },
  {
    id: "m4",
    no: 4,
    title: "次序錯了，句子也錯了",
    minutes: "約5分鐘",
    topic: "時序同核對說法",
    suspense: "這封信先寫收復長安，再寫起兵，又說肅宗在起兵之前已經即位。兩層都要改，改一層不夠。",
    fiction: "信是虛構。你改的是信的錯誤，不是改史實的先後。",
    kind: "mix",
    learned: "你先把起兵、奔蜀、收京排正，再指出「即位在起兵之前」不合時序。",
    slot: "",
    items: [
      { id: "fan", text: "安祿山在范陽起兵", year: "755年", source: SRC_QIZHI },
      { id: "tong", text: "潼關失守，玄宗離開長安", year: "756年", source: SRC_QIZHI },
      { id: "chang", text: "唐軍收復長安", year: "757年", source: SRC_QIZHI },
    ],
    startOrder: ["chang", "tong", "fan"],
    answer: ["fan", "tong", "chang"],
    orderHint: "收復長安在最後。起兵在最前。",
    claim: "同一封虛構信又寫：肅宗在范陽起兵之前已經即位。",
    cards: [
      {
        id: "after",
        title: "即位在後",
        text: "肅宗靈武即位在756年七月，范陽起兵在755年。即位在起兵之後，不是之前。",
        source: SRC_QIZHI,
      },
    ],
    prompt: "次序排正之後，這句要怎樣改？",
    options: [
      {
        id: "after-ok",
        text: "這句把即位說到起兵之前。應改為：起兵在755年，靈武即位在756年。",
        ok: true,
        needs: ["after"],
        feedback: "對。先有起兵，後有靈武即位。信把兩件事的先後說反了。",
      },
      {
        id: "keep",
        text: "次序改好就夠，這句可以保留。",
        ok: false,
        needs: ["after"],
        feedback: "次序只處理了三件事。這句仍把即位放在起兵之前，還要改。",
      },
      {
        id: "never-suzong",
        text: "肅宗沒有即位。",
        ok: false,
        needs: ["after"],
        feedback: "靈武即位是通說的一部分。要改的是「在起兵之前」，不是抹掉即位。",
      },
    ],
    hint: "先排三件事。排對之後才核對那句即位。",
  },
  {
    id: "m5",
    no: 5,
    title: "三句裡，哪句收得太窄？",
    minutes: "約5分鐘",
    topic: "證據比較",
    suspense: "最後一塊展板有三句。兩句可以並陳，一句想用一天朝政蓋住整個戰爭。",
    fiction: "展板是虛構布置。你選的是哪句過寬，不能把過寬的那句改成史實。",
    kind: "compare",
    learned: "你讓起兵、邊鎮兵力、763年的結束並陳，沒有用單一的朝政句子蓋住它們。",
    slot: "s3",
    slips: [
      {
        id: "rise",
        label: "一句",
        text: "755年安祿山在范陽起兵。",
        source: SRC_QIZHI,
      },
      {
        id: "army",
        label: "二句",
        text: "他兼領范陽、平盧、河東，邊鎮兵力集中。",
        source: SRC_LUSHAN,
      },
      {
        id: "day",
        label: "三句",
        text: "因為皇帝有一天沒有上朝，所以這場約八年的戰爭只需用這一句解釋。",
        source: "這句把多條記載收成一天的朝政，不是前兩句的內容。",
      },
    ],
    prompt: "哪一句把其餘證據收得太窄？",
    options: [
      {
        id: "day-no",
        text: "三句過窄。一句同二句可以並陳；一天上朝與否，解釋不了起兵、兵力和763年才結束。",
        ok: true,
        needs: ["rise", "army", "day"],
        feedback: "對。前兩句各有記載方向。第三句用一天蓋住整個戰爭，證據不夠。",
      },
      {
        id: "rise-no",
        text: "一句不能寫，因為起兵沒有發生。",
        ok: false,
        needs: ["rise"],
        feedback: "范陽起兵是通說。過窄的是第三句，不是起兵這一句。",
      },
      {
        id: "all",
        text: "三句都要刪掉，展板不應提到安史之亂。",
        ok: false,
        needs: ["rise", "army", "day"],
        feedback: "要拿掉的是過窄的解釋，不是拿掉事件本身。",
      },
    ],
    hint: "三張都打開。問的是哪句蓋過了其他證據，不是哪句最短。",
  },
];

export const LETTERS = [
  { date: "2026-10-10", chapterId: "m1" },
  { date: "2026-10-11", chapterId: "m2" },
  { date: "2026-10-12", chapterId: "m3" },
  { date: "2026-10-13", chapterId: "m4" },
  { date: "2026-10-14", chapterId: "m5" },
];

export function letterDay(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: LETTER_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const pick = (type) => parts.find((p) => p.type === type)?.value || "";
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

export function chapterById(id) {
  return CHAPTERS.find((ch) => ch.id === id) || null;
}

export function letterForDay(day) {
  const row = LETTERS.find((item) => item.date === day);
  if (!row) return null;
  const chapter = chapterById(row.chapterId);
  return chapter ? { ...row, chapter } : null;
}

export function slotById(id) {
  return SLOTS.find((slot) => slot.id === id) || null;
}
