/** 與古人對話：選擇回應，答得貼近史實／價值觀得分 */
export const DIALOGUES = [
  {
    id: "d_qin",
    character: "秦始皇",
    era: "秦",
    avatar: "🏛️",
    intro: "朕一統六國，今欲鞏固統治。爾以為當先施何策？",
    steps: [
      {
        prompt: "面對六國遺民，朕應如何處置文字與制度？",
        choices: [
          { text: "書同文、車同軌、統一度量衡", good: true, reply: "善。統一制度，方可令天下聽令於中央。" },
          { text: "任由各國保留舊制，以免反彈", good: false, reply: "如此則中央難通令於四方，非長久之計。" },
          { text: "只統一貨幣，其餘不管", good: false, reply: "貨幣固然重要，然文字政令不通，仍難治大國。" },
        ],
      },
      {
        prompt: "有人以古非今，批評朕之政策。爾以為？",
        choices: [
          { text: "可焚書坑儒以禁異議", good: true, reply: "史載確有此舉……然後世對此多有爭議，爾需知其代價。" },
          { text: "廣開言路，允許百家爭鳴", good: false, reply: "此非朕之治國之道。然以史觀之，壓抑思想亦種下民怨。" },
          { text: "完全不理朝政", good: false, reply: "荒唐！帝國豈可無人治理？" },
        ],
      },
    ],
  },
  {
    id: "d_tang",
    character: "唐太宗",
    era: "唐",
    avatar: "👑",
    intro: "朕欲創貞觀盛世。爾可直言進諫，勿懼。",
    steps: [
      {
        prompt: "治國最重要的是什麼？",
        choices: [
          { text: "任用賢才、虛心納諫", good: true, reply: "正是。魏徵等直臣，令朕少犯過錯。" },
          { text: "窮兵黷武、四面征伐", good: false, reply: "武功固可揚威，然民生與吏治更是根本。" },
          { text: "獨斷專行、不聽臣言", good: false, reply: "兼聽則明，偏信則暗。此非明君之道。" },
        ],
      },
      {
        prompt: "邊疆民族來朝，朕應如何待之？",
        choices: [
          { text: "華夷一家，恩威並施", good: true, reply: "善。開放包容，正是盛唐氣象。" },
          { text: "一概驅逐，閉關鎖國", good: false, reply: "如此則交流斷絕，有損國力與聲望。" },
          { text: "只重武力征服", good: false, reply: "武力可勝一時，懷柔方能久安。" },
        ],
      },
    ],
  },
  {
    id: "d_song",
    character: "宋太祖",
    era: "宋",
    avatar: "🍶",
    intro: "五代武人專政，朕欲扭轉乾坤。爾有何策？",
    steps: [
      {
        prompt: "如何防止武將擁兵自重？",
        choices: [
          { text: "杯酒釋兵權，強榦弱枝", good: true, reply: "正合朕意。兵權歸中央，方可杜絕篡奪。" },
          { text: "讓藩鎮繼續擴軍", good: false, reply: "此乃五代亂源，豈可重蹈覆轍？" },
          { text: "廢除全部軍隊", good: false, reply: "無兵何以禦敵？邊患怎麼辦？" },
        ],
      },
      {
        prompt: "國策上，文臣與武將應如何平衡？",
        choices: [
          { text: "重文輕武，以文馭武", good: true, reply: "然也。可保政局穩定，但亦需防積弱之弊。" },
          { text: "重武輕文，武將掌政", good: false, reply: "此正是朕欲革除之弊。" },
          { text: "取消科舉", good: false, reply: "科舉選士，正是重文之基，不可廢。" },
        ],
      },
    ],
  },
  {
    id: "d_wu",
    character: "任鳳儀",
    era: "架空",
    avatar: "🦅",
    intro: "吾以女子之身問鼎天下。爾以為女主臨朝有何挑戰？",
    steps: [
      {
        prompt: "如何鞏固統治、選拔人才？",
        choices: [
          { text: "發展科舉、破格用人", good: true, reply: "善。不拘一格降人才，方能得能臣。" },
          { text: "只任用親族，不問才幹", good: false, reply: "裙帶過盛，終將失人心。" },
          { text: "廢除所有官制", good: false, reply: "無制度則天下大亂。" },
        ],
      },
      {
        prompt: "史家對女主褒貶不一，爾如何看？",
        choices: [
          { text: "應就其政績與爭議分開評價", good: true, reply: "史識在於全面。功過並存，方是實錄。" },
          { text: "女子不當皇帝，一律否定", good: false, reply: "以性別否定一切，並非公允史觀。" },
          { text: "只要有權便是對的", good: false, reply: "權力須受制度與民心約束。" },
        ],
      },
    ],
  },
  {
    id: "d_sun",
    character: "孫中山",
    era: "民國",
    avatar: "🌞",
    intro: "革命尚未成功，同志仍須努力。爾知三民主義否？",
    steps: [
      {
        prompt: "三民主義的內容是？",
        choices: [
          { text: "民族、民權、民生", good: true, reply: "正確！此乃革命之綱領。" },
          { text: "民主、科學、自由", good: false, reply: "那是五四口號的一部分，非三民主義本身。" },
          { text: "聯俄、聯共、扶助農工", good: false, reply: "那是晚年三大政策，與三民主義不同。" },
        ],
      },
      {
        prompt: "辛亥革命的最大意義是？",
        choices: [
          { text: "推翻帝制，建立共和", good: true, reply: "正是。中國歷史從此進入新階段。" },
          { text: "立即實現全民富裕", good: false, reply: "民生尚需長期建設，非一蹴而就。" },
          { text: "恢復封建分封", good: false, reply: "革命正是為了結束帝制與舊秩序。" },
        ],
      },
    ],
  },
];
