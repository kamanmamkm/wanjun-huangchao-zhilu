/**
 * 趣味關卡課程樹：對齊齡記《亮點中國史》單元標題（自擬遊戲，非複製工作紙）
 */
export const CURRICULUM_GRADES = ["中一", "中二", "中三"];

export const CURRICULUM_UNITS = [
  {
    id: "s1u1",
    grade: "中一",
    no: 1,
    era: "史前至夏商周",
    title: "中華民族的起源與早期國家的形成",
    blurb: "華夏起源、夏商周興替、封建與春秋戰國變局。",
    timelineId: "tl_s1u1",
    flipId: "ww_s1u1",
    cuoshi: ["cs11_kongzi_fenshu"],
    dialogues: [],
  },
  {
    id: "s1u2",
    grade: "中一",
    no: 2,
    era: "秦漢",
    title: "統一國家的形成與中外文化交流",
    blurb: "秦的一統與漢的文治武功、通西域。",
    timelineId: "tl_s1u2",
    flipId: "ww_s1u2",
    cuoshi: ["cs2_keju_qin", "cs9_qin_election", "cs4_policy_cost"],
    dialogues: ["d_qin", "d_han"],
  },
  {
    id: "s1u3",
    grade: "中一",
    no: 3,
    era: "三國兩晉南北朝",
    title: "長期的分裂與南北方的發展",
    blurb: "分裂政局、江南開發、孝文帝漢化。",
    timelineId: "tl_s1u3",
    flipId: "ww_s1u3",
    cuoshi: [],
    dialogues: [],
  },
  {
    id: "s1u4",
    grade: "中一",
    no: 4,
    era: "隋唐",
    title: "隋唐的統一、發展與開放的社會",
    blurb: "再造一統、盛世與安史之亂後的變局。",
    timelineId: "tl_s1u4",
    flipId: "ww_s1u4",
    cuoshi: ["cs1_opium_tang", "cs12_sui_canal_day"],
    dialogues: ["d_sui", "d_tang", "d_zetian"],
  },
  {
    id: "s2u1",
    grade: "中二",
    no: 1,
    era: "宋元",
    title: "經濟蓬勃與民族關係發展的時代",
    blurb: "兩宋國策、邊族和戰、元朝統治。",
    timelineId: "tl_s2u1",
    flipId: "ww_s2u1",
    cuoshi: ["cs7_song_changan", "cs5_linked_errors"],
    dialogues: ["d_song"],
  },
  {
    id: "s2u2",
    grade: "中二",
    no: 2,
    era: "明",
    title: "君主集權國家的建立與國勢的張弛",
    blurb: "廢相集權、下西洋、國勢由盛轉衰。",
    timelineId: "tl_s2u2",
    flipId: "ww_s2u2",
    cuoshi: ["cs6_zhenghe_zhangqian"],
    dialogues: ["d_ming"],
  },
  {
    id: "s2u3",
    grade: "中二",
    no: 3,
    era: "清",
    title: "統一多民族國家的發展與外力的衝擊",
    blurb: "康乾至晚清：邊政、鴉片戰爭到維新。",
    timelineId: "tl_s2u3",
    flipId: "ww_s2u3",
    cuoshi: ["cs8_qing_one_cause", "cs10_nanjing_taiwan"],
    dialogues: ["d_kangxi"],
  },
  {
    id: "s3u1",
    grade: "中三",
    no: 1,
    era: "中華民國",
    title: "辛亥革命至國共內戰",
    blurb: "民初政局、國共分合、抗日與內戰。",
    timelineId: "tl_s3u1",
    flipId: "ww_s3u1",
    cuoshi: [],
    dialogues: ["d_sun"],
  },
  {
    id: "s3u2",
    grade: "中三",
    no: 2,
    era: "中華人民共和國",
    title: "建國以來的內政、外交與改革開放",
    blurb: "1978 年前後內政外交，以及改革開放。",
    timelineId: "tl_s3u2",
    flipId: "ww_s3u2",
    cuoshi: ["cs3_two_sources"],
    dialogues: [],
  },
];

export function getUnit(id) {
  return CURRICULUM_UNITS.find((u) => u.id === id) || null;
}

export function unitsOfGrade(grade) {
  return CURRICULUM_UNITS.filter((u) => u.grade === grade);
}

export function unitGameCount(u) {
  let n = 0;
  if (u.timelineId) n += 1;
  if (u.flipId) n += 1;
  if ((u.cuoshi || []).length) n += 1;
  if ((u.dialogues || []).length) n += 1;
  return n;
}

export const UNIT_TIMELINES = [
  {
    id: "tl_s1u1",
    title: "史前至夏商周",
    grade: "中一",
    pick: 4,
    items: [
      { id: "a", label: "華夏族群逐漸形成", year: -2000, hint: "新石器至夏商之際" },
      { id: "b", label: "商朝以甲骨占卜", year: -1300, hint: "殷墟時期" },
      { id: "c", label: "西周封建開始", year: -1046, hint: "約公元前11世紀" },
      { id: "d", label: "春秋時期開始", year: -770, hint: "平王東遷前後" },
      { id: "e", label: "戰國變法圖強", year: -356, hint: "如商鞅變法" },
      { id: "f", label: "百家爭鳴興盛", year: -300, hint: "戰國思想" },
    ],
  },
  {
    id: "tl_s1u2",
    title: "秦漢一統",
    grade: "中一",
    pick: 4,
    items: [
      { id: "a", label: "秦滅六國統一", year: -221, hint: "公元前221年" },
      { id: "b", label: "楚漢相爭結束、西漢建立", year: -202, hint: "漢高祖" },
      { id: "c", label: "張騫首次出使西域", year: -138, hint: "漢武帝時期" },
      { id: "d", label: "漢武帝獨尊儒術", year: -134, hint: "董仲舒對策前後" },
      { id: "e", label: "王莽代漢", year: 9, hint: "新朝" },
      { id: "f", label: "東漢建立", year: 25, hint: "光武帝" },
    ],
  },
  {
    id: "tl_s1u3",
    title: "分裂與南北",
    grade: "中一",
    pick: 4,
    items: [
      { id: "a", label: "赤壁之戰", year: 208, hint: "三國鼎立關鍵" },
      { id: "b", label: "西晉統一三國", year: 280, hint: "公元280年" },
      { id: "c", label: "永嘉之亂後中原動盪", year: 311, hint: "西晉衰亡前後" },
      { id: "d", label: "北魏孝文帝遷都洛陽", year: 494, hint: "漢化改革" },
      { id: "e", label: "江南持續開發", year: 420, hint: "東晉南朝時期" },
    ],
  },
  {
    id: "tl_s1u4",
    title: "隋唐盛世",
    grade: "中一",
    pick: 4,
    items: [
      { id: "a", label: "隋統一南北", year: 589, hint: "公元589年" },
      { id: "b", label: "唐朝建立", year: 618, hint: "公元618年" },
      { id: "c", label: "貞觀之治", year: 627, hint: "唐太宗" },
      { id: "d", label: "武則天稱帝", year: 690, hint: "武周" },
      { id: "e", label: "開元之治", year: 713, hint: "玄宗前期" },
      { id: "f", label: "安史之亂爆發", year: 755, hint: "公元755年" },
    ],
  },
  {
    id: "tl_s2u1",
    title: "宋元",
    grade: "中二",
    pick: 4,
    items: [
      { id: "a", label: "陳橋兵變／北宋建立", year: 960, hint: "公元960年" },
      { id: "b", label: "王安石開始變法", year: 1069, hint: "熙寧年間" },
      { id: "c", label: "靖康之變", year: 1127, hint: "北宋滅亡" },
      { id: "d", label: "蒙古滅金", year: 1234, hint: "金朝滅亡" },
      { id: "e", label: "元朝建立", year: 1271, hint: "忽必烈" },
      { id: "f", label: "崖山海戰／南宋亡", year: 1279, hint: "宋元易代" },
    ],
  },
  {
    id: "tl_s2u2",
    title: "明朝",
    grade: "中二",
    pick: 4,
    items: [
      { id: "a", label: "明朝建立", year: 1368, hint: "明太祖" },
      { id: "b", label: "廢丞相、權歸六部", year: 1380, hint: "洪武年間" },
      { id: "c", label: "鄭和首次下西洋", year: 1405, hint: "永樂年間" },
      { id: "d", label: "明成祖遷都北京", year: 1421, hint: "永樂遷都" },
      { id: "e", label: "晚明政局動盪", year: 1644, hint: "明朝滅亡前後" },
    ],
  },
  {
    id: "tl_s2u3",
    title: "清朝與外力衝擊",
    grade: "中二",
    pick: 4,
    items: [
      { id: "a", label: "清軍入關", year: 1644, hint: "明清交替" },
      { id: "b", label: "康熙朝盛世漸成", year: 1669, hint: "親政前後" },
      { id: "c", label: "鴉片戰爭爆發", year: 1840, hint: "近代開端" },
      { id: "d", label: "甲午戰爭", year: 1894, hint: "公元1894年" },
      { id: "e", label: "戊戌維新", year: 1898, hint: "百日維新" },
      { id: "f", label: "八國聯軍侵華", year: 1900, hint: "庚子事變" },
    ],
  },
  {
    id: "tl_s3u1",
    title: "民國風雲",
    grade: "中三",
    pick: 5,
    items: [
      { id: "a", label: "辛亥革命", year: 1911, hint: "武昌起義" },
      { id: "b", label: "中華民國成立", year: 1912, hint: "帝制結束" },
      { id: "c", label: "北伐開始", year: 1926, hint: "國民革命軍" },
      { id: "d", label: "七七事變／全面抗戰", year: 1937, hint: "公元1937年" },
      { id: "e", label: "抗戰勝利", year: 1945, hint: "日本投降" },
      { id: "f", label: "國共內戰再起", year: 1946, hint: "抗戰結束後" },
    ],
  },
  {
    id: "tl_s3u2",
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
];

export const UNIT_FLIPS = [
  {
    id: "ww_s1u1",
    title: "夏商周配對",
    grade: "中一",
    pick: 4,
    pairs: [
      { a: "封建", b: "分封諸侯", note: "西周把土地人民封給貴族。" },
      { a: "春秋", b: "諸侯爭霸", note: "周室衰微，霸主迭興。" },
      { a: "戰國", b: "變法圖強", note: "各國改革以求富強。" },
      { a: "百家爭鳴", b: "諸子學說", note: "儒墨道法等同時並起。" },
      { a: "孔子", b: "仁與禮", note: "春秋思想家，後來成《論語》。" },
      { a: "商鞅", b: "秦國變法", note: "重耕戰、明賞罰。" },
    ],
  },
  {
    id: "ww_s1u2",
    title: "秦漢配對",
    grade: "中一",
    pick: 4,
    pairs: [
      { a: "秦始皇", b: "書同文", note: "統一文字以便政令。" },
      { a: "郡縣", b: "中央任官", note: "地方長官由朝廷任命。" },
      { a: "漢武帝", b: "獨尊儒術", note: "儒學成為官方主流。" },
      { a: "張騫", b: "出使西域", note: "鑿空西域，絲路漸通。" },
      { a: "文景之治", b: "與民休息", note: "為武帝奠基。" },
      { a: "楚漢相爭", b: "劉邦勝項羽", note: "西漢由此建立。" },
    ],
  },
  {
    id: "ww_s1u3",
    title: "魏晉南北朝配對",
    grade: "中一",
    pick: 4,
    pairs: [
      { a: "赤壁之戰", b: "三國鼎立", note: "曹孫劉勢力分立。" },
      { a: "西晉", b: "短暫統一", note: "滅吳後統一，旋即內亂。" },
      { a: "孝文帝", b: "遷都洛陽", note: "推行漢化改革。" },
      { a: "江南開發", b: "南方經濟發展", note: "衣冠南渡後加速。" },
      { a: "士族", b: "門第政治", note: "高門大族把持仕途。" },
      { a: "北朝騎兵", b: "南方水軍", note: "南北武備各有特色。" },
    ],
  },
  {
    id: "ww_s1u4",
    title: "隋唐配對",
    grade: "中一",
    pick: 4,
    pairs: [
      { a: "隋文帝", b: "開皇之治", note: "統一後整頓制度。" },
      { a: "大運河", b: "溝通南北", note: "便利糧運與交流。" },
      { a: "唐太宗", b: "貞觀之治", note: "納諫任賢。" },
      { a: "武則天", b: "破格用人", note: "發展科舉。" },
      { a: "開元之治", b: "玄宗前期", note: "盛唐高峰之一。" },
      { a: "安史之亂", b: "藩鎮坐大", note: "唐由盛轉衰的關鍵。" },
    ],
  },
  {
    id: "ww_s2u1",
    title: "宋元配對",
    grade: "中二",
    pick: 4,
    pairs: [
      { a: "宋太祖", b: "杯酒釋兵權", note: "收兵權以防藩鎮。" },
      { a: "強榦弱枝", b: "重文輕武", note: "宋初國策，亦種積弱。" },
      { a: "王安石", b: "熙寧變法", note: "理財整軍，引發黨爭。" },
      { a: "靖康之變", b: "北宋滅亡", note: "宋室其後南渡。" },
      { a: "元朝", b: "四等人制", note: "統治政策影響民族關係。" },
      { a: "發明西傳", b: "影響世界文明", note: "如火藥、印刷等外傳。" },
    ],
  },
  {
    id: "ww_s2u2",
    title: "明朝配對",
    grade: "中二",
    pick: 4,
    pairs: [
      { a: "明太祖", b: "廢丞相", note: "六部直隸皇帝。" },
      { a: "鄭和", b: "下西洋", note: "永樂年間遠航。" },
      { a: "明成祖", b: "遷都北京", note: "鞏固北方。" },
      { a: "明長城", b: "鞏固邊防", note: "與國力、邊患相關。" },
      { a: "君主集權", b: "廠衛監察", note: "皇權加強的一面。" },
      { a: "晚明", b: "內憂外患", note: "終至明朝滅亡。" },
    ],
  },
  {
    id: "ww_s2u3",
    title: "清朝與近代衝擊",
    grade: "中二",
    pick: 4,
    pairs: [
      { a: "康熙帝", b: "鞏固一統", note: "邊政與盛世基礎。" },
      { a: "鴉片戰爭", b: "南京條約", note: "割讓香港島、開放口岸。" },
      { a: "甲午戰爭", b: "馬關條約", note: "割讓台灣等條款。" },
      { a: "八國聯軍", b: "辛丑條約", note: "庚子之後，賠款最重。" },
      { a: "洋務運動", b: "中體西用", note: "自強而不改政體根本。" },
      { a: "戊戌維新", b: "百日維新", note: "試圖變法，旋即失敗。" },
    ],
  },
  {
    id: "ww_s3u1",
    title: "民國配對",
    grade: "中三",
    pick: 4,
    pairs: [
      { a: "孫中山", b: "三民主義", note: "民族、民權、民生。" },
      { a: "辛亥革命", b: "推翻帝制", note: "中華民國隨之成立。" },
      { a: "五四運動", b: "1919", note: "外交與新文化的轉折。" },
      { a: "北伐", b: "國民革命軍", note: "試圖統一全國。" },
      { a: "七七事變", b: "全面抗戰", note: "1937 年全面爆發。" },
      { a: "抗戰勝利", b: "1945", note: "日本投降。" },
    ],
  },
  {
    id: "ww_s3u2",
    title: "當代中國配對",
    grade: "中三",
    pick: 4,
    pairs: [
      { a: "1949", b: "中華人民共和國成立", note: "開國大典。" },
      { a: "改革開放", b: "1978", note: "十一屆三中全會前後。" },
      { a: "香港回歸", b: "1997", note: "一國兩制。" },
      { a: "澳門回歸", b: "1999", note: "世紀末。" },
      { a: "加入 WTO", b: "2001", note: "進一步融入全球貿易。" },
    ],
  },
];

export function unitTimeline(unit) {
  if (!unit?.timelineId) return null;
  return UNIT_TIMELINES.find((t) => t.id === unit.timelineId) || null;
}

export function unitFlip(unit) {
  if (!unit?.flipId) return null;
  return UNIT_FLIPS.find((r) => r.id === unit.flipId) || null;
}
