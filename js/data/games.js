import { filterByFormYear, isGradeAllowed, normalizeFormYear } from "./formYear.js?v=rad114";

/** 時間線事件（排先後）——每套題池較大，開局隨機抽若干題，打亂後由學生排成由早到晚 */
export const TIMELINE_SETS = [
  {
    id: "tl1",
    title: "上古至秦漢",
    grade: "中一",
    pick: 5,
    items: [
      { id: "a", label: "西周封建開始", year: -1046, hint: "約公元前11世紀" },
      { id: "b", label: "春秋時期開始", year: -770, hint: "平王東遷前後" },
      { id: "c", label: "商鞅變法", year: -356, hint: "戰國秦國" },
      { id: "d", label: "秦滅六國統一", year: -221, hint: "公元前221年" },
      { id: "e", label: "張騫首次出使西域", year: -138, hint: "漢武帝時期" },
      { id: "f", label: "王莽篡漢", year: 9, hint: "公元9年" },
      { id: "g", label: "赤壁之戰", year: 208, hint: "東漢末" },
    ],
  },
  {
    id: "tl2",
    title: "魏晉至隋唐",
    grade: "中一",
    pick: 5,
    items: [
      { id: "a", label: "西晉統一三國", year: 280, hint: "公元280年" },
      { id: "b", label: "北魏孝文帝遷都洛陽", year: 494, hint: "漢化改革" },
      { id: "c", label: "隋統一南北", year: 589, hint: "公元589年" },
      { id: "d", label: "唐朝建立", year: 618, hint: "公元618年" },
      { id: "e", label: "武則天稱帝", year: 690, hint: "武周" },
      { id: "f", label: "安史之亂爆發", year: 755, hint: "公元755年" },
      { id: "g", label: "唐朝滅亡", year: 907, hint: "公元907年" },
    ],
  },
  {
    id: "tl3",
    title: "宋遼金元",
    grade: "中二",
    pick: 5,
    items: [
      { id: "a", label: "陳橋兵變／北宋建立", year: 960, hint: "公元960年" },
      { id: "b", label: "王安石開始變法", year: 1069, hint: "熙寧年間" },
      { id: "c", label: "靖康之變", year: 1127, hint: "北宋滅亡" },
      { id: "d", label: "蒙古滅金", year: 1234, hint: "金朝滅亡" },
      { id: "e", label: "元朝建立（忽必烈）", year: 1271, hint: "公元1271年" },
      { id: "f", label: "崖山海戰／南宋亡", year: 1279, hint: "宋元易代" },
    ],
  },
  {
    id: "tl4",
    title: "明清盛世與危機",
    grade: "中二",
    pick: 5,
    items: [
      { id: "a", label: "明朝建立", year: 1368, hint: "公元1368年" },
      { id: "b", label: "鄭和首次下西洋", year: 1405, hint: "永樂年間" },
      { id: "c", label: "明成祖遷都北京", year: 1421, hint: "永樂遷都" },
      { id: "d", label: "清軍入關", year: 1644, hint: "明清交替" },
      { id: "e", label: "康熙帝親政前後", year: 1669, hint: "康熙朝開始強盛" },
      { id: "f", label: "鴉片戰爭爆發", year: 1840, hint: "近代開端" },
    ],
  },
  {
    id: "tl5",
    title: "晚清變局",
    grade: "中二／中三",
    pick: 5,
    items: [
      { id: "a", label: "鴉片戰爭", year: 1840, hint: "公元1840年" },
      { id: "b", label: "太平天國起事", year: 1851, hint: "金田起義" },
      { id: "c", label: "洋務運動展開", year: 1861, hint: "自強運動" },
      { id: "d", label: "甲午戰爭", year: 1894, hint: "公元1894年" },
      { id: "e", label: "戊戌維新", year: 1898, hint: "百日維新" },
      { id: "f", label: "八國聯軍侵華", year: 1900, hint: "庚子事變" },
      { id: "g", label: "辛亥革命", year: 1911, hint: "公元1911年" },
    ],
  },
  {
    id: "tl6",
    title: "民國風雲",
    grade: "中三",
    pick: 5,
    items: [
      { id: "a", label: "中華民國成立", year: 1912, hint: "帝制結束" },
      { id: "b", label: "五四運動", year: 1919, hint: "公元1919年" },
      { id: "c", label: "北伐開始", year: 1926, hint: "國民革命軍" },
      { id: "d", label: "九一八事變", year: 1931, hint: "日本侵佔東北" },
      { id: "e", label: "西安事變", year: 1936, hint: "逼蔣抗日" },
      { id: "f", label: "七七事變／全面抗戰", year: 1937, hint: "公元1937年" },
      { id: "g", label: "抗戰勝利", year: 1945, hint: "日本投降" },
    ],
  },
  {
    id: "tl7",
    title: "當代中國",
    grade: "中三",
    pick: 4,
    items: [
      { id: "a", label: "中華人民共和國成立", year: 1949, hint: "公元1949年" },
      { id: "b", label: "改革開放啟動", year: 1978, hint: "十一屆三中全會" },
      { id: "c", label: "香港回歸", year: 1997, hint: "一國兩制" },
      { id: "d", label: "澳門回歸", year: 1999, hint: "世紀末" },
      { id: "e", label: "中國加入世界貿易組織", year: 2001, hint: "WTO" },
    ],
  },
  {
    id: "tl8",
    title: "制度與思想",
    grade: "中一／中二",
    pick: 5,
    items: [
      { id: "a", label: "孔子思想流傳（春秋）", year: -500, hint: "約公元前5世紀" },
      { id: "b", label: "秦始皇行郡縣、書同文", year: -221, hint: "統一後" },
      { id: "c", label: "漢武帝獨尊儒術", year: -134, hint: "董仲舒對策前後" },
      { id: "d", label: "科舉制確立發展（隋唐）", year: 605, hint: "隋煬帝設進士科前後" },
      { id: "e", label: "王安石變法", year: 1069, hint: "北宋" },
      { id: "f", label: "明太祖廢宰相", year: 1380, hint: "洪武年間" },
    ],
  },
  {
    id: "tl9",
    title: "戰爭與條約",
    grade: "中二／中三",
    pick: 5,
    items: [
      { id: "a", label: "鴉片戰爭 →《南京條約》", year: 1842, hint: "戰後簽約" },
      { id: "b", label: "英法聯軍 →《北京條約》", year: 1860, hint: "第二次鴉片戰爭" },
      { id: "c", label: "甲午戰爭 →《馬關條約》", year: 1895, hint: "戰後簽約" },
      { id: "d", label: "八國聯軍 →《辛丑條約》", year: 1901, hint: "庚子之後" },
      { id: "e", label: "抗日戰爭全面爆發", year: 1937, hint: "七七事變" },
      { id: "f", label: "抗日戰爭勝利", year: 1945, hint: "日本投降" },
    ],
  },
  {
    id: "tl10",
    title: "人物生平時序",
    grade: "混合",
    pick: 5,
    items: [
      { id: "a", label: "秦始皇統一中國", year: -221, hint: "嬴政" },
      { id: "b", label: "漢武帝即位", year: -141, hint: "劉徹" },
      { id: "c", label: "唐太宗即位", year: 626, hint: "李世民" },
      { id: "d", label: "宋太祖登基", year: 960, hint: "趙匡胤" },
      { id: "e", label: "明太祖建國", year: 1368, hint: "朱元璋" },
      { id: "f", label: "孫中山就任臨時大總統", year: 1912, hint: "南京" },
    ],
  },
  {
    id: "tl11",
    title: "政策先後：上古至隋唐",
    grade: "中一",
    pick: 5,
    items: [
      { id: "a", label: "西周封建開始", year: -1046, hint: "約公元前11世紀" },
      { id: "b", label: "商鞅變法", year: -356, hint: "戰國秦國" },
      { id: "c", label: "秦始皇行郡縣、書同文", year: -221, hint: "統一後" },
      { id: "d", label: "漢武帝獨尊儒術", year: -134, hint: "董仲舒對策前後" },
      { id: "e", label: "科舉制確立發展（隋唐）", year: 605, hint: "隋煬帝設進士科前後" },
    ],
  },
  {
    id: "tl12",
    title: "政策先後：宋至清",
    grade: "中二",
    pick: 4,
    items: [
      { id: "a", label: "王安石開始變法", year: 1069, hint: "熙寧年間" },
      { id: "b", label: "明太祖廢宰相", year: 1380, hint: "洪武年間" },
      { id: "c", label: "洋務運動展開", year: 1861, hint: "自強運動" },
      { id: "d", label: "戊戌維新", year: 1898, hint: "百日維新" },
    ],
  },
  {
    id: "tl13",
    title: "材料先後：上古至漢",
    grade: "中一",
    pick: 4,
    items: [
      { id: "a", label: "商朝以甲骨占卜", year: -1300, hint: "殷墟時期" },
      { id: "b", label: "孔子講學，言論後來編成《論語》", year: -500, hint: "春秋" },
      { id: "c", label: "秦統一後的詔令", year: -221, hint: "公元前221年後" },
      { id: "d", label: "司馬遷寫《史記》", year: -90, hint: "西漢" },
    ],
  },
  {
    id: "tl14",
    title: "材料先後：宋至清",
    grade: "中二",
    pick: 4,
    items: [
      { id: "a", label: "司馬光修成《資治通鑑》", year: 1084, hint: "北宋" },
      { id: "b", label: "《南京條約》簽訂", year: 1842, hint: "鴉片戰爭後" },
      { id: "c", label: "《馬關條約》簽訂", year: 1895, hint: "甲午戰爭後" },
      { id: "d", label: "《辛丑條約》簽訂", year: 1901, hint: "八國聯軍之後" },
    ],
  },
  {
    id: "tl15",
    title: "跨章先後：上古至唐",
    grade: "中一",
    pick: 5,
    items: [
      { id: "a", label: "西周封建開始", year: -1046, hint: "約公元前11世紀" },
      { id: "b", label: "秦滅六國、行郡縣", year: -221, hint: "公元前221年" },
      { id: "c", label: "張騫首次出使西域", year: -138, hint: "漢武帝時期" },
      { id: "d", label: "科舉制確立發展（隋唐）", year: 605, hint: "隋煬帝設進士科前後" },
      { id: "e", label: "安史之亂爆發", year: 755, hint: "唐玄宗後期" },
    ],
  },
  {
    id: "tl16",
    title: "跨章先後：宋至清",
    grade: "中二",
    pick: 5,
    items: [
      { id: "a", label: "陳橋兵變／北宋建立", year: 960, hint: "公元960年" },
      { id: "b", label: "王安石開始變法", year: 1069, hint: "熙寧年間" },
      { id: "c", label: "明太祖廢宰相", year: 1380, hint: "洪武年間" },
      { id: "d", label: "鄭和首次下西洋", year: 1405, hint: "永樂年間" },
      { id: "e", label: "鴉片戰爭爆發", year: 1840, hint: "近代開端" },
    ],
  },
  {
    id: "tl17",
    title: "跨章先後：清末至抗戰",
    grade: "中三",
    pick: 4,
    items: [
      { id: "a", label: "辛亥革命", year: 1911, hint: "公元1911年" },
      { id: "b", label: "五四運動", year: 1919, hint: "公元1919年" },
      { id: "c", label: "七七事變／全面抗戰", year: 1937, hint: "公元1937年" },
      { id: "d", label: "抗戰勝利", year: 1945, hint: "日本投降" },
    ],
  },
  {
    id: "tl18",
    title: "治策先後：上古至唐",
    grade: "中一",
    pick: 5,
    items: [
      { id: "a", label: "西周封建開始", year: -1046, hint: "約公元前11世紀" },
      { id: "b", label: "商鞅變法", year: -356, hint: "戰國秦國" },
      { id: "c", label: "秦始皇行郡縣", year: -221, hint: "統一後" },
      { id: "d", label: "漢武帝推恩令", year: -127, hint: "削弱王國" },
      { id: "e", label: "科舉制確立發展（隋唐）", year: 605, hint: "隋煬帝設進士科前後" },
    ],
  },
  {
    id: "tl19",
    title: "治策先後：宋至清",
    grade: "中二",
    pick: 4,
    items: [
      { id: "a", label: "陳橋兵變／北宋建立", year: 960, hint: "公元960年" },
      { id: "b", label: "王安石開始變法", year: 1069, hint: "熙寧年間" },
      { id: "c", label: "明太祖廢宰相", year: 1380, hint: "洪武年間" },
      { id: "d", label: "洋務運動展開", year: 1861, hint: "自強運動" },
    ],
  },
  {
    id: "tl20",
    title: "治策先後：晚清至當代",
    grade: "中三",
    pick: 4,
    items: [
      { id: "a", label: "戊戌維新", year: 1898, hint: "百日維新" },
      { id: "b", label: "辛亥革命", year: 1911, hint: "公元1911年" },
      { id: "c", label: "中華人民共和國成立", year: 1949, hint: "公元1949年" },
      { id: "d", label: "改革開放啟動", year: 1978, hint: "十一屆三中全會" },
    ],
  },
];

/** 機緣翻牌：撳兩張有關嘅牌配對。每套題池較大，開局隨機抽若干對 */
export const WORDWALL_ROUNDS = [
  {
    id: "ww1",
    title: "人物與事蹟",
    pick: 4,
    pairs: [
      { a: "張騫", b: "出使西域", note: "漢武帝時鑿空西域。", chapter: "ch1_escape", grade: "中一" },
      { a: "鄭和", b: "下西洋", note: "明成祖時率船隊遠航。", chapter: "ch2_figures", grade: "中一" },
      { a: "秦始皇", b: "書同文", note: "統一文字以便政令。", chapter: "ch1_escape", grade: "中一" },
      { a: "漢武帝", b: "獨尊儒術", note: "儒學成為官方主流。", chapter: "ch1_escape", grade: "中一" },
      { a: "唐太宗", b: "貞觀之治", note: "虛心納諫、任用賢才。", chapter: "ch2_figures", grade: "中一" },
      { a: "武則天", b: "破格用人", note: "發展科舉，不拘門第。", chapter: "ch2_figures", grade: "中一" },
      { a: "宋太祖", b: "杯酒釋兵權", note: "收兵權以防藩鎮。", chapter: "ch4_cause", grade: "中二" },
      { a: "孫中山", b: "三民主義", note: "民族、民權、民生。", chapter: "ch2_figures", grade: "中三" },
    ],
  },
  {
    id: "ww2",
    title: "戰爭與條約",
    pick: 4,
    pairs: [
      { a: "鴉片戰爭", b: "南京條約", note: "割讓香港島、開放口岸。", chapter: "ch3_events", grade: "中二" },
      { a: "英法聯軍", b: "北京條約", note: "第二次鴉片戰爭之後。", chapter: "ch3_events", grade: "中二" },
      { a: "甲午戰爭", b: "馬關條約", note: "割讓台灣等條款。", chapter: "ch3_events", grade: "中二" },
      { a: "八國聯軍", b: "辛丑條約", note: "庚子之後，賠款最重。", chapter: "ch3_events", grade: "中二" },
      { a: "七七事變", b: "全面抗戰", note: "1937 年抗日戰爭全面爆發。", chapter: "ch3_events", grade: "中三" },
      { a: "辛亥革命", b: "清帝退位", note: "1911 年起事，翌年民國成立。", chapter: "ch3_events", grade: "中三" },
    ],
  },
  {
    id: "ww3",
    title: "制度與含義",
    pick: 4,
    pairs: [
      { a: "封建", b: "分封諸侯", note: "西周把土地人民封給貴族。", chapter: "ch1_escape", grade: "中一" },
      { a: "郡縣", b: "中央直轄", note: "秦以後地方由朝廷任官。", chapter: "ch1_escape", grade: "中一" },
      { a: "科舉", b: "考試選官", note: "隋唐以後逐漸成熟。", chapter: "ch1_escape", grade: "中一" },
      { a: "藩鎮", b: "地方節度使", note: "唐後期軍閥坐大。", chapter: "ch3_events", grade: "中一" },
      { a: "三省六部", b: "中央分職", note: "隋唐中央官制。", chapter: "ch1_escape", grade: "中一" },
      { a: "廢丞相", b: "明太祖集權", note: "政務分歸六部，直隸皇帝。", chapter: "ch4_cause", grade: "中二" },
    ],
  },
  {
    id: "ww4",
    title: "治世與皇帝",
    pick: 4,
    pairs: [
      { a: "文景之治", b: "漢文帝／景帝", note: "與民休息，為武帝奠基。" },
      { a: "貞觀之治", b: "唐太宗", note: "貞觀年間政清人和。" },
      { a: "開元之治", b: "唐玄宗前期", note: "盛唐高峰之一。" },
      { a: "康乾盛世", b: "康熙至乾隆", note: "清朝國力較盛之時。" },
      { a: "洪武開國", b: "明太祖", note: "朱元璋建立明朝。" },
      { a: "陳橋兵變", b: "宋太祖", note: "黃袍加身，建立北宋。" },
    ],
  },
  {
    id: "ww5",
    title: "朝代與都城",
    pick: 4,
    pairs: [
      { a: "秦朝", b: "咸陽", note: "秦始皇以關中為根本。" },
      { a: "西漢", b: "長安", note: "漢高祖定都關中。" },
      { a: "東漢", b: "洛陽", note: "光武帝以洛陽為都。" },
      { a: "北宋", b: "開封", note: "東京開封，商業繁盛。" },
      { a: "南宋", b: "臨安", note: "即今日杭州一帶。" },
      { a: "元朝", b: "大都", note: "即後來北京的前身之一。" },
      { a: "明永樂後", b: "北京", note: "成祖遷都，南京仍為陪都。" },
    ],
  },
];

const BAG_FLIP_IDS = ["ww1", "ww2", "ww3"];

/** 行囊一局：人物、戰爭、制度三套現有牌。行過嘅章、本年級先入選。 */
export function bagFlipRound(walkedIds, formYear) {
  const walked = new Set(walkedIds || []);
  const pairs = WORDWALL_ROUNDS.filter((round) => BAG_FLIP_IDS.includes(round.id))
    .flatMap((round) => round.pairs || [])
    .filter((pair) => walked.has(pair.chapter) && isGradeAllowed(pair.grade, formYear));
  return { id: "bag-flip", title: "一局", pick: 4, pairs };
}

function yearToken(formYear) {
  const year = normalizeFormYear(formYear) || "中一";
  if (year === "中四" || year === "中五") return "中三";
  return year;
}

function timelineVisible(set, formYear) {
  if (filterByFormYear([set], formYear).length) return true;
  return String(set.grade || "").includes(yearToken(formYear));
}

/** 長卷指定題套，再按年級留低。標明「中一／中二」的套，中一都見得到。 */
export function timelineSetsByIds(ids, formYear) {
  const source = (ids || []).map((id) => TIMELINE_SETS.find((t) => t.id === id)).filter(Boolean);
  const kept = source.filter((t) => timelineVisible(t, formYear));
  return kept.length ? kept : source.slice(0, 1);
}
