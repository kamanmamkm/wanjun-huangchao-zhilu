/**
 * 錯史之戰：Boss 是被改亂的史書（非歷史人物）
 * 每關：辨錯 → 修正 → 舉證
 */
export const CUOSHI_BATTLES = [
  {
    id: "cs1_opium_tang",
    title: "錯史之戰Ⅰ：時代錯置",
    blurb: "史頁把近代事件寫進唐代——先辨錯，再修正，最後舉證。",
    chapterHint: "ch1_escape",
    difficulty: "入門",
    steps: [
      {
        id: "spot",
        title: "辨錯",
        q: "史頁寫：「鴉片戰爭發生在唐代。」主要錯在哪？",
        options: ["時代錯置：應屬近代／清朝", "人名寫錯", "完全沒錯", "應改成赤壁之戰"],
        answer: 0,
        skill: "timeline",
      },
      {
        id: "fix",
        title: "修正",
        q: "較合理的修正是？",
        options: ["鴉片戰爭發生在清朝道光年間前後", "改成安史之亂即可", "改成牧野之戰", "刪去不寫歷史"],
        answer: 0,
        skill: "recall",
      },
      {
        id: "prove",
        title: "舉證",
        q: "哪項最能支持你的修正？",
        options: ["它與清朝對外關係及近代開端相關", "因為字數比較多", "因為我喜歡清朝", "隨便改都得"],
        answer: 0,
        skill: "source",
      },
    ],
  },
  {
    id: "cs2_keju_qin",
    title: "錯史之戰Ⅱ：制度張冠李戴",
    blurb: "史頁聲稱秦始皇以科舉選官——找出錯配。",
    difficulty: "進階",
    steps: [
      {
        id: "spot",
        title: "辨錯",
        q: "「秦始皇推行科舉制度選拔官員」錯在？",
        options: ["科舉是後代制度，秦代並非以此選官", "秦沒有皇帝", "秦沒有文字", "完全正確"],
        answer: 0,
        skill: "cause",
      },
      {
        id: "fix",
        title: "修正",
        q: "較恰當的改寫是？",
        options: ["科舉制度主要在隋唐以後發展成熟", "改成秦以分封制選官", "改成秦以佛教選官", "改成秦以商稅選官"],
        answer: 0,
        skill: "recall",
      },
      {
        id: "prove",
        title: "舉證",
        q: "支持修正的最佳理由？",
        options: ["要把制度放回出現與成熟的時代", "越古老越好", "皇帝說了算就不用考證", "制度名稱不重要"],
        answer: 0,
        skill: "source",
      },
    ],
  },
  {
    id: "cs3_two_sources",
    title: "錯史之戰Ⅲ：推論過度",
    blurb: "史頁由一句官員自誇，斷定『全民擁護』——拆解證據問題。",
    difficulty: "進階",
    steps: [
      {
        id: "spot",
        title: "辨錯",
        q: "材料只有官員自述政績，史頁卻寫「因此全國人民都支持」。問題是？",
        options: ["由有限材料過度推論", "文言文太難", "沒有年份就不能用", "官員從不說謊所以沒錯"],
        answer: 0,
        skill: "source",
      },
      {
        id: "fix",
        title: "修正",
        q: "較審慎的表述是？",
        options: ["該官員自稱政績獲支持，仍需其他材料驗證", "刪去所有史料", "改成絕對全國反對", "改成數學證明"],
        answer: 0,
        skill: "argue",
      },
      {
        id: "prove",
        title: "舉證",
        q: "下一步最合理的做法？",
        options: ["尋找民間、檔案或其他立場材料對讀", "只信官書", "只信傳說", "不再研究"],
        answer: 0,
        skill: "source",
      },
    ],
  },
  {
    id: "cs4_policy_cost",
    title: "錯史之戰Ⅳ：只講好處",
    blurb: "史頁只寫拓邊『百利而無一害』——補上代價視角。",
    difficulty: "高階",
    steps: [
      {
        id: "spot",
        title: "辨錯",
        q: "評價漢武帝拓邊若只寫『完全沒有代價』，主要問題是？",
        options: ["忽略軍費、民力等可能代價", "因為沒有地圖", "年份背錯", "人名太長"],
        answer: 0,
        skill: "cause",
      },
      {
        id: "fix",
        title: "修正",
        q: "較平衡的寫法應包含？",
        options: ["成就與負擔／代價並陳", "只罵皇帝", "只歌頌勝利", "取消邊防討論"],
        answer: 0,
        skill: "argue",
      },
      {
        id: "prove",
        title: "舉證",
        q: "哪類證據較有助討論『代價』？",
        options: ["賦役、財政或民生相關記載", "只看名勝風景", "只看兵器外形好看", "只看字數"],
        answer: 0,
        skill: "source",
      },
    ],
  },
  {
    id: "cs5_linked_errors",
    title: "錯史之戰Ⅴ：連環錯頁",
    blurb: "同一頁有多處相關錯誤：時序＋因果纏在一起。",
    difficulty: "精英",
    steps: [
      {
        id: "spot",
        title: "辨錯",
        q: "史頁：「商鞅變法導致辛亥革命。」最主要錯在？",
        options: ["把相隔極遠的事件建成直接因果", "商鞅不存在", "辛亥革命沒發生", "完全正確"],
        answer: 0,
        skill: "cause",
      },
      {
        id: "fix",
        title: "修正",
        q: "較合理的處理是？",
        options: ["分開討論各自時代意義，避免偽因果", "合併成同一事件", "刪去變法", "刪去辛亥"],
        answer: 0,
        skill: "timeline",
      },
      {
        id: "prove",
        title: "舉證",
        q: "判斷事件關係時，應先？",
        options: ["確認時代定位，再談影響是否直接", "看標題誰較長", "按喜歡程度", "隨機連結"],
        answer: 0,
        skill: "timeline",
      },
    ],
  },
];

export function getCuoshi(id) {
  return CUOSHI_BATTLES.find((b) => b.id === id) || null;
}
