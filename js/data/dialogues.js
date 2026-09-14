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
    id: "d_han",
    character: "漢武帝",
    era: "漢",
    avatar: "🐴",
    intro: "朕承文景之業，欲振大漢聲威。爾有何策？",
    steps: [
      {
        prompt: "思想學術上，朕應如何定國是？",
        choices: [
          { text: "罷黜百家，獨尊儒術", good: true, reply: "然也。儒術可助教化，然亦令思想漸趨一統。" },
          { text: "繼續只行黃老無為", good: false, reply: "無為可休養，難成朕開邊與集權之志。" },
          { text: "廢除所有學官", good: false, reply: "無學則無士，朝廷何人可用？" },
        ],
      },
      {
        prompt: "匈奴為患，通西域有何用意？",
        choices: [
          { text: "聯絡西域、夾擊匈奴，並開商路", good: true, reply: "善。張騫鑿空，後世絲路由此漸通。" },
          { text: "閉關自守，永不西向", good: false, reply: "如此則坐困關中，邊患難解。" },
          { text: "把都城遷到匈奴王庭即可", good: false, reply: "荒唐。國都豈可輕棄中原？" },
        ],
      },
    ],
  },
  {
    id: "d_sui",
    character: "隋文帝",
    era: "隋",
    avatar: "⚖️",
    intro: "南北久分，朕已再造一統。爾以為當如何長久？",
    steps: [
      {
        prompt: "選官用人，當以何法較穩？",
        choices: [
          { text: "以考試選士，減少只靠門第", good: true, reply: "善。科舉之制由此漸興，可廣納人才。" },
          { text: "只讓高門大族世襲官職", good: false, reply: "門閥過盛，正是前朝之弊。" },
          { text: "不再設官，由朕一人辦百事", good: false, reply: "天下事繁，豈可無人分治？" },
        ],
      },
      {
        prompt: "統一之後，中央官制宜如何？",
        choices: [
          { text: "整頓三省六部，令政令歸於朝廷", good: true, reply: "正是。分職任事，方可通達全國。" },
          { text: "恢復分封列國，各自為政", good: false, reply: "再封則易再亂，非一統之計。" },
          { text: "取消法律，全憑口諭", good: false, reply: "無法則吏民無所依，必亂。" },
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
    id: "d_zetian",
    character: "武則天",
    era: "唐／武周",
    avatar: "🦚",
    intro: "朕以女主臨朝。爾以為當如何用人、如何自處史評？",
    steps: [
      {
        prompt: "如何鞏固統治、選拔人才？",
        choices: [
          { text: "發展科舉、破格用人", good: true, reply: "善。不拘門第，方能得能臣。" },
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
    id: "d_ming",
    character: "明太祖",
    era: "明",
    avatar: "🏯",
    intro: "朕起自布衣，掃除胡元。爾以為如何使皇權永固？",
    steps: [
      {
        prompt: "丞相權重，朕當如何？",
        choices: [
          { text: "廢丞相，政務分歸六部，直隸皇帝", good: true, reply: "正是。權歸朝廷，可防權臣。然皇帝亦更勞瘁。" },
          { text: "把軍政全交丞相便宜行事", good: false, reply: "權臣再起，正是朕所深忌。" },
          { text: "恢復分封列國如周制", good: false, reply: "分封易成藩亂，非久安之策。" },
        ],
      },
      {
        prompt: "選士育人，當以何為重？",
        choices: [
          { text: "以科舉取士，但需防空疏不實", good: true, reply: "然。八股可取士，亦易束縛思路，後世當知其利弊。" },
          { text: "廢科舉，只看家世", good: false, reply: "布衣如朕，豈可再鎖死寒門？" },
          { text: "不再讀書，只練武即可", good: false, reply: "治國需文事，不可偏廢。" },
        ],
      },
    ],
  },
  {
    id: "d_kangxi",
    character: "康熙帝",
    era: "清",
    avatar: "📜",
    intro: "朕在位日久，欲成一統與盛世。爾可直言。",
    steps: [
      {
        prompt: "東南尚有未定，台灣當如何處？",
        choices: [
          { text: "收復台灣，設府縣以統之", good: true, reply: "善。施琅克台後設府，海疆始入版圖治理。" },
          { text: "棄而不問，當化外之地", good: false, reply: "棄之則海盜、外患易生，非長策。" },
          { text: "把京城遷到台灣即可", good: false, reply: "荒唐。根本仍在中原與東北。" },
        ],
      },
      {
        prompt: "滿漢並處，當如何統治？",
        choices: [
          { text: "滿漢大臣並用，亦以文治收攬士人", good: true, reply: "然也。武功之後，仍需制度與人心。" },
          { text: "永遠不用漢人任官", good: false, reply: "如此則難治廣土眾民。" },
          { text: "廢除所有典章，只憑騎射", good: false, reply: "騎射可開國，難以長久治國。" },
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
