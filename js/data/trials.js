/**
 * 晉升試煉與終章「天下待定」
 * 難度強調「越嚟越識諗」，非越嚟越冷門。
 * 短答以關鍵要點給分：史實準確、證據相關、解釋合理。
 */

export const TRIALS = {
  trial_to_commoner: {
    id: "trial_to_commoner",
    title: "脫籍考核",
    passScore: 60,
    minSource: 0,
    minArgue: 0,
    parts: [
      {
        type: "mc",
        skill: "recall",
        q: "夏商周三代，按傳統說法的先後順序是？",
        options: ["夏→商→周", "商→夏→周", "周→商→夏", "夏→周→商"],
        answer: 0,
        explain: "傳統史序為夏、商、周。",
      },
      {
        type: "mc",
        skill: "recall",
        q: "「科舉」主要用來選拔什麼人？",
        options: ["官員", "商人", "工匠", "僧侶"],
        answer: 0,
        explain: "科舉是選拔官員的考試制度。",
      },
      {
        type: "fill",
        skill: "recall",
        q: "秦始皇統一六國後，推行____文字（書體名，三字）。",
        answers: ["小篆", "篆書"],
        hint: "統一文字",
      },
    ],
  },

  trial_to_student: {
    id: "trial_to_student",
    title: "求學考核",
    passScore: 65,
    minSource: 0,
    minArgue: 0,
    parts: [
      {
        type: "mc",
        skill: "timeline",
        q: "以下哪項發生最早？",
        options: ["鴉片戰爭", "安史之亂", "辛亥革命", "五四運動"],
        answer: 1,
        explain: "安史之亂在唐代，早於近代事件。",
      },
      {
        type: "mc",
        skill: "recall",
        q: "張騫出使西域，主要與哪條通道有關？",
        options: ["絲綢之路", "京杭大運河", "鄭和下西洋航線", "萬里長城"],
        answer: 0,
      },
      {
        type: "mc",
        skill: "cause",
        q: "商鞅變法的主要目的是？",
        options: ["富國強兵", "推廣佛教", "開通海運", "廢除皇帝"],
        answer: 0,
      },
    ],
  },

  trial_to_shi: {
    id: "trial_to_shi",
    title: "入仕預備試",
    passScore: 70,
    minSource: 0,
    minArgue: 0,
    parts: [
      {
        type: "mc",
        skill: "cause",
        q: "漢武帝推行「獨尊儒術」，較直接的影響是？",
        options: ["儒學成為官方意識形態", "立刻廢除所有其他思想", "停止對外戰爭", "取消賦稅"],
        answer: 0,
      },
      {
        type: "mc",
        skill: "timeline",
        q: "隋唐時期開通／擴建大運河，主要方便什麼？",
        options: ["南北物資運輸與聯繫", "對抗匈奴騎兵", "海外殖民", "印刷佛經"],
        answer: 0,
      },
      {
        type: "fill",
        skill: "recall",
        q: "唐太宗年間政治清明，史稱「____之治」。",
        answers: ["貞觀"],
      },
    ],
  },

  trial_to_magistrate: {
    id: "trial_to_magistrate",
    title: "初仕試煉",
    passScore: 72,
    minSource: 40,
    minArgue: 0,
    parts: [
      {
        type: "mc",
        skill: "cause",
        q: "王安石變法引起爭議，主要因為？",
        options: ["新法影響既得利益與執行出問題", "完全沒有任何支持者", "只針對邊疆少數民族", "廢除科舉"],
        answer: 0,
      },
      {
        type: "source",
        skill: "source",
        q: "材料：「治國之道，必先富民。」若用來支持某項惠民政策，這句話屬於？",
        options: ["可用作論據的價值主張／原則", "精確的統計數據", "考古實物證據", "條約原文"],
        answer: 0,
        explain: "這是原則性主張，可作論據，但不是實測數據。",
      },
      {
        type: "mc",
        skill: "timeline",
        q: "明清海禁政策，較符合以下哪項描述？",
        options: ["限制民間海外貿易與往來", "鼓勵全民航海經商", "只開放對美洲貿易", "廢除所有港口"],
        answer: 0,
      },
    ],
  },

  trial_to_prefect: {
    id: "trial_to_prefect",
    title: "主政晉升試煉",
    passScore: 75,
    minSource: 50,
    minArgue: 50,
    parts: [
      {
        type: "mc",
        skill: "recall",
        q: "辛亥革命的重要結果之一是？",
        options: ["推翻帝制，建立共和", "恢復分封制", "統一文字為小篆", "開通絲綢之路"],
        answer: 0,
      },
      {
        type: "source",
        skill: "source",
        q: "材料甲稱「禁煙令使洋商蒙受損失」；材料乙稱「禁煙保護國民健康」。兩則材料差異主要在於？",
        options: ["立場與關注點不同", "完全無關歷史", "都證明禁煙失敗", "都是同一作者"],
        answer: 0,
      },
      {
        type: "compare",
        skill: "cause",
        q: "比較「井田制理想」與「商鞅廢井田、開阡陌」：後者較直接服務什麼目標？",
        options: ["加強國家對土地與人力的控制以富國強兵", "恢復西周禮樂", "推廣佛教寺院經濟", "取消所有賦稅"],
        answer: 0,
      },
      {
        type: "argue",
        skill: "argue",
        q: "有人說「科舉只會造成死記硬背」。請用一句史實＋一句解釋，說明科舉仍可能有其作用。（關鍵詞即可）",
        keywords: ["選拔", "官員", "考試", "才學", "社會流動", "讀書", "公平", "取士"],
        minHits: 2,
        rubric: "史實準確、證據相關、解釋合理",
      },
    ],
  },

  trial_to_minister: {
    id: "trial_to_minister",
    title: "重臣試煉",
    passScore: 78,
    minSource: 55,
    minArgue: 55,
    parts: [
      {
        type: "source",
        skill: "source",
        q: "若只有「某官員自述政績」而無其他旁證，使用時應？",
        options: ["審慎看待，可能有美化成分", "完全採信", "直接丟棄不用", "當成數學證明"],
        answer: 0,
      },
      {
        type: "compare",
        skill: "cause",
        q: "比較「文景之治」與「武帝拓邊」：後者較可能帶來的代價是？",
        options: ["軍費與民力負擔加重", "完全沒有任何影響", "立刻消滅所有文化", "停止農業生產"],
        answer: 0,
      },
      {
        type: "argue",
        skill: "argue",
        q: "面對「要不要加強邊防」，請提出一個你贊成的方向，並用一個史實支持（寫出關鍵詞）。",
        keywords: ["匈奴", "長城", "邊防", "和親", "軍費", "民生", "戰爭", "絲路", "衛青", "霍去病", "代價"],
        minHits: 2,
      },
    ],
  },

  trial_to_lord: {
    id: "trial_to_lord",
    title: "諸侯試煉",
    passScore: 80,
    minSource: 60,
    minArgue: 60,
    parts: [
      {
        type: "mc",
        skill: "timeline",
        q: "把下列事件按時間先後排列的正確做法，關鍵是？",
        options: ["先判斷所屬朝代／時期再排序", "只看事件名稱長短", "按字數多少", "隨機排列"],
        answer: 0,
      },
      {
        type: "source",
        skill: "source",
        q: "「根據材料可推斷……」與「材料明文寫道……」的分別是？",
        options: ["前者是推論，後者是直接證據表述", "完全相同", "前者一定錯", "後者一定是假的"],
        answer: 0,
      },
      {
        type: "argue",
        skill: "argue",
        q: "若要評價一項改革成敗，除了「有沒有推行」外，還應看什麼？（寫關鍵詞）",
        keywords: ["影響", "代價", "民生", "執行", "反對", "效果", "持續", "利益", "後果"],
        minHits: 2,
      },
    ],
  },

  /** 終章：三部分可分段完成 */
  trial_ascension: {
    id: "trial_ascension",
    title: "終章：天下待定",
    isFinale: true,
    passScore: 80,
    minSource: 65,
    minArgue: 65,
    segments: [
      {
        id: "seg_tongshi",
        title: "通史試煉",
        blurb: "跨章節時序、制度與因果。",
        parts: [
          {
            type: "mc",
            skill: "timeline",
            q: "秦統一、漢武帝推恩、隋唐科舉、明清海禁——討論它們時，最穩妥的第一步是？",
            options: ["先放回各自時代背景再比較", "當成同一年發生", "只背年份不管內容", "全部視為近代史"],
            answer: 0,
          },
          {
            type: "compare",
            skill: "cause",
            q: "「推恩令」與「分封制」相比，漢武帝較想達成什麼？",
            options: ["削弱王國勢力、加強中央", "完全恢復周代分封", "取消皇權", "停止農業"],
            answer: 0,
          },
          {
            type: "mc",
            skill: "cause",
            q: "一項制度能延續多年，通常不只因為「想出來很聰明」，還因為？",
            options: ["符合統治需要且可執行", "完全沒有人反對", "從不需要調整", "與民生無關"],
            answer: 0,
          },
        ],
      },
      {
        id: "seg_shiliao",
        title: "史料會審",
        blurb: "比較材料，分辨證據與推論。",
        parts: [
          {
            type: "source",
            skill: "source",
            q: "材料A出自官方史書歌頌某皇帝；材料B出自民間訴苦。研究「民生」時應？",
            options: ["兩則對讀，留意立場與局限", "只信A", "只信B", "兩則都無用"],
            answer: 0,
          },
          {
            type: "source",
            skill: "source",
            q: "「因此可斷定全國人民都支持」——這句話問題在於？",
            options: ["由有限材料過度推論", "用字太短", "沒有引用年份", "不是文言文"],
            answer: 0,
          },
          {
            type: "compare",
            skill: "source",
            q: "比較「考古遺址出土工具」與「後人傳說故事」，何者較適合直接證明生產技術？",
            options: ["考古出土工具", "後人傳說故事", "兩者完全一樣", "都不可以"],
            answer: 0,
          },
        ],
      },
      {
        id: "seg_zhiguo",
        title: "治國策論",
        blurb: "架空情境選方案，解釋利弊，引用史實。無單一神奇正解。",
        parts: [
          {
            type: "policy",
            skill: "argue",
            q: "邊關告急，國庫亦緊。你會優先？",
            options: [
              "加強邊防但控制規模，並安撫民生",
              "立刻傾盡國庫遠征",
              "完全不理邊防",
              "只加稅不管用途",
            ],
            // 多選可接受：0 為較穩妥示範；亦接受有論證嘅其他合理項喺評分以關鍵詞為主
            preferred: 0,
            explain: "需兼顧安全與代價；遠征與放棄皆有風險。",
          },
          {
            type: "argue",
            skill: "argue",
            q: "請用至少兩個關鍵詞，說明你為何重視「代價／民生」或「邊防安全」（可並提）。",
            keywords: ["代價", "民生", "邊防", "軍費", "民力", "安全", "稅", "戰爭", "匈奴", "長城", "和親", "平衡"],
            minHits: 2,
          },
          {
            type: "argue",
            skill: "argue",
            q: "引用一個你學過的史實名稱／人物／制度，支持你的判斷（關鍵詞）。",
            keywords: ["漢武帝", "文景", "長城", "王安石", "科舉", "推恩", "絲路", "鄭和", "鴉片", "海禁", "貞觀", "商鞅"],
            minHits: 1,
          },
        ],
      },
    ],
  },
};

export function getTrial(id) {
  return TRIALS[id] || null;
}
