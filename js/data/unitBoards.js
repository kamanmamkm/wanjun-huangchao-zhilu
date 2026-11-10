/**
 * 單元闖關嘅第四、第五種手感。
 * 第四種重用長卷互動板（因果、成效與代價、史料對質、路線、朝議）。
 * 第五種係遺物拼圖：自己揀邊幾塊先嵌合，唔係再搵一句錯字。
 * 題目自擬，對齊單元標題，唔係出版社工作紙。
 */

export const UNIT_BOARDS = [
  {
    id: "ub_s1u1",
    gotoGame: "ledger",
    title: "成效與代價",
    blurb: "封建同變法，都要寫兩邊。",
    rounds: [
      {
        situation: "西周把土地和人民分封給親族同功臣。要你寫一句評語。",
        options: [
          {
            text: "周初可以靠親族屏藩，但諸侯世襲，日後中央會難控制。",
            effect: "建國初期有人幫周王看守地方。",
            cost: "諸侯世代相傳，權力可以坐大。",
            ok: true,
            note: "有屏藩，亦有日後尾大不掉。兩邊都在，可以採納。",
          },
          {
            text: "從此全國改行郡縣，地方官全部由周王隨時撤換。",
            effect: "評語寫成中央直接任免所有地方官。",
            cost: "沒有寫諸侯世襲。",
            ok: false,
            note: "郡縣是秦代以後的做法，不能套在西周封建上面。",
          },
          {
            text: "只對農民有利，完全沒有政治代價。",
            effect: "只寫好處。",
            cost: "寫成毫無代價。",
            ok: false,
            note: "封建是政治安排，不是只有一邊的好處。",
          },
        ],
      },
      {
        situation: "戰國秦國推行商鞅變法。要你寫一句評語。",
        options: [
          {
            text: "耕戰和賞罰令秦國變強，但刑罰嚴苛，百姓負擔不輕。",
            effect: "秦國富強，為後來統一打下基礎。",
            cost: "嚴刑與重農，不是沒有人付出代價。",
            ok: true,
            note: "強國同嚴刑要一齊寫。",
          },
          {
            text: "變法一日之內令全中國統一，沒有任何反對。",
            effect: "寫成立刻統一天下。",
            cost: "寫成無人反對。",
            ok: false,
            note: "商鞅變法先改變秦國，不是一日統一全中國。",
          },
          {
            text: "商鞅變法就是隋唐的科舉。",
            effect: "把選官制度寫成同一件事。",
            cost: "沒有討論秦國的刑罰。",
            ok: false,
            note: "科舉在隋唐以後才發展，不能用來解釋商鞅。",
          },
        ],
      },
    ],
  },
  {
    id: "ub_s1u2",
    gotoGame: "cause",
    title: "因果連結",
    blurb: "政令同儒學，揀講得較穩的原因。",
    rounds: [
      {
        result: "秦的政令可以傳到較遠的地方。",
        prompt: "哪一個原因講得較穩？",
        options: [
          {
            text: "書同文、統一度量，方便朝廷把命令傳開。",
            ok: true,
            note: "統一文字和度量，是為了政令相通。這不是後來的科舉。",
          },
          {
            text: "因為隋唐已經有科舉，所以秦的政令傳得到。",
            ok: false,
            note: "科舉在隋唐以後才發展，不能用來解釋秦。",
          },
          {
            text: "因為辛亥革命推翻帝制，秦才統一文字。",
            ok: false,
            note: "兩件事相隔約兩千年，不能倒因為果。",
          },
        ],
      },
      {
        result: "漢武帝以後，儒學成為官方比較推崇的學說。",
        prompt: "哪一個原因講得較穩？",
        options: [
          {
            text: "獨尊儒術之後，讀儒家經典成為入仕的重要途徑。",
            ok: true,
            note: "把政策和後果放在漢武帝的時代裡。",
          },
          {
            text: "因為秦始皇已經用科舉考試錄取儒生。",
            ok: false,
            note: "秦代不是以科舉選官。",
          },
          {
            text: "因為張騫把儒學從西域帶回來，儒學先在西域產生。",
            ok: false,
            note: "儒學不是張騫從西域傳入的。",
          },
        ],
      },
    ],
  },
  {
    id: "ub_s1u3",
    gotoGame: "route",
    title: "路線抉擇",
    blurb: "漢化同南渡，揀對下一站。",
    rounds: [
      {
        mission: "北魏孝文帝要推行漢化，把政治中心移近中原。",
        from: "平城",
        options: [
          {
            place: "洛陽",
            detail: "遷都中原",
            text: "洛陽，遷都中原",
            ok: true,
            note: "孝文帝遷都洛陽。建康是南朝的都城，不是這次北魏的目的地。",
          },
          {
            place: "建康",
            detail: "去南朝的都城",
            text: "建康，去南朝的都城",
            ok: false,
            note: "建康是南朝所在，不是孝文帝漢化遷都的目的地。",
          },
          {
            place: "長安",
            detail: "回到西漢的都城",
            text: "長安，回到西漢的都城",
            ok: false,
            note: "這次遷都是由平城到洛陽，不是回到西漢的長安。",
          },
        ],
      },
      {
        mission: "永嘉之亂以後，不少士族要找一個可以繼續生活和開發的地區。",
        from: "中原",
        options: [
          {
            place: "江南",
            detail: "東晉南朝持續開發",
            text: "江南，東晉南朝持續開發",
            ok: true,
            note: "衣冠南渡之後，江南的開發加快。這不是張騫的西域，也不是後來的台灣。",
          },
          {
            place: "西域",
            detail: "沿張騫的路西行",
            text: "西域，沿張騫的路西行",
            ok: false,
            note: "通西域是漢代的事，幫不到這次南渡。",
          },
          {
            place: "台灣",
            detail: "渡海去島上",
            text: "台灣，渡海去島上",
            ok: false,
            note: "東晉南朝的南渡是去江南，不是去台灣。",
          },
        ],
      },
    ],
  },
  {
    id: "ub_s1u4",
    gotoGame: "verdict",
    title: "限時朝議",
    blurb: "運河同年號，限時內批一句。",
    seconds: 50,
    rounds: [
      {
        prompt: "有人請你只寫「大運河有百利而無一害」。你怎麼批？",
        options: [
          {
            text: "運河溝通南北，但徵發民力要一併寫上。",
            ok: true,
            note: "有功仍要寫代價。不能批成百利而無一害。",
          },
          {
            text: "照准。運河一日建成，沒有任何代價。",
            ok: false,
            note: "運河不是一日建成，也不能寫成毫無消耗。",
          },
          {
            text: "大運河從未存在，整段刪去。",
            ok: false,
            note: "運河是有的。要批的是功和代價，不是否認它。",
          },
        ],
      },
      {
        prompt: "朝臣說：貞觀之治就是唐玄宗開元年間的事。你怎麼批？",
        options: [
          {
            text: "貞觀是唐太宗，開元是唐玄宗，兩個年號要分開。",
            ok: true,
            note: "盛世可以有多個，年號不能併成同一位皇帝。",
          },
          {
            text: "照准。兩個年號是同一位皇帝。",
            ok: false,
            note: "唐太宗和唐玄宗不是同一人。",
          },
          {
            text: "貞觀在清朝康熙年間，改朝代即可。",
            ok: false,
            note: "貞觀在唐朝，不是清朝。",
          },
        ],
      },
    ],
  },
  {
    id: "ub_s2u1",
    gotoGame: "cause",
    title: "因果連結",
    blurb: "杯酒釋兵權同靖康之變，分開看原因。",
    rounds: [
      {
        result: "宋初以後，武將較難像唐末藩鎮那樣割據。",
        prompt: "哪一個原因講得較穩？",
        options: [
          {
            text: "杯酒釋兵權把主要兵權收回中央，是重要條件；不等於之後戰無不勝。",
            ok: true,
            note: "收兵權可以解釋較少割據。戰績要另外寫。",
          },
          {
            text: "因為宋太祖把都城遷回長安。",
            ok: false,
            note: "北宋定都開封，不是長安。",
          },
          {
            text: "因為鄭和的船隊已經控制海洋。",
            ok: false,
            note: "下西洋是明朝的事，不能解釋宋初。",
          },
        ],
      },
      {
        result: "北宋滅亡，宋室南遷。",
        prompt: "哪一個原因講得較穩？",
        options: [
          {
            text: "靖康之變後宋室南渡。不能說北宋一直以臨安為都。",
            ok: true,
            note: "先有靖康之變，然後才是南宋。都城不能提前搬去臨安。",
          },
          {
            text: "因為杯酒釋兵權直接令金兵攻入開封。",
            ok: false,
            note: "收兵權和靖康之變相隔很遠，不宜寫成直接因果。",
          },
          {
            text: "因為元朝在 960 年已經滅宋。",
            ok: false,
            note: "960 年是北宋建立。元朝滅宋是一百多年之後。",
          },
        ],
      },
    ],
  },
  {
    id: "ub_s2u2",
    gotoGame: "route",
    title: "路線抉擇",
    blurb: "下西洋同遷都，揀對方向。",
    rounds: [
      {
        mission: "明成祖派船隊出海，宣揚國威。",
        from: "南京",
        options: [
          {
            place: "西洋航路",
            detail: "船隊出海南下",
            text: "西洋航路，船隊出海南下",
            ok: true,
            note: "鄭和走海路。河西走廊是張騫的陸路，《南京條約》是清朝的事。",
          },
          {
            place: "河西走廊",
            detail: "沿張騫的路去西域",
            text: "河西走廊，沿張騫的路去西域",
            ok: false,
            note: "通西域是漢代陸路，不是鄭和的船隊。",
          },
          {
            place: "五口",
            detail: "去對《南京條約》的口岸",
            text: "五口，去對《南京條約》",
            ok: false,
            note: "《南京條約》是清朝的事，幫不到明成祖派船。",
          },
        ],
      },
      {
        mission: "明成祖要鞏固北方，把都城移近北邊。",
        from: "南京",
        options: [
          {
            place: "北京",
            detail: "永樂遷都",
            text: "北京，永樂遷都",
            ok: true,
            note: "明成祖由南京遷都北京。臨安是南宋，平城是北魏。",
          },
          {
            place: "臨安",
            detail: "回到南宋的都城",
            text: "臨安，回到南宋的都城",
            ok: false,
            note: "臨安是南宋的都城，不是這次明朝遷都。",
          },
          {
            place: "平城",
            detail: "回到北魏舊都",
            text: "平城，回到北魏舊都",
            ok: false,
            note: "平城是北魏孝文帝遷洛之前的都城，不是明朝的目的地。",
          },
        ],
      },
    ],
  },
  {
    id: "ub_s2u3",
    gotoGame: "confront",
    title: "史料對質",
    blurb: "兩則材料並排，睇下面那句有沒有講得太盡。",
    rounds: [
      {
        left: { tag: "材料甲", text: "《南京條約》訂明割讓香港島，並開放五口通商。" },
        right: { tag: "材料乙", text: "這份條約的條款沒有寫割讓台灣。" },
        claim: "所以《南京條約》把台灣割讓給英國。",
        options: [
          {
            text: "材料只寫到香港島和五口。台灣不在這兩則裡，不能加上去。",
            ok: true,
            note: "台灣是後來《馬關條約》的事。對讀先看材料實際寫了甚麼。",
          },
          {
            text: "五口包括台灣，所以可以寫成割讓台灣。",
            ok: false,
            note: "材料沒有把台灣寫進五口。",
          },
          {
            text: "材料沒寫的，就當成已經割了。",
            ok: false,
            note: "材料沒寫，不是證據。不能把空白填成割讓。",
          },
        ],
      },
      {
        left: { tag: "材料甲", text: "洋務運動提出中體西用，辦了一些新式企業。" },
        right: { tag: "材料乙", text: "同一時期，政體並沒有改成君主立憲。" },
        claim: "因此洋務運動已經完成君主立憲。",
        options: [
          {
            text: "兩則都沒有說政體改成立憲。辦企業不等於改政體。",
            ok: true,
            note: "中體西用不是君主立憲。材料範圍不能推大。",
          },
          {
            text: "辦了企業，就等於政體已經改變。",
            ok: false,
            note: "企業和政體是兩件事。",
          },
          {
            text: "材料對不上，所以寫成全國已經實行民主選舉。",
            ok: false,
            note: "對不上就要分開讀，不是合成一句更大的話。",
          },
        ],
      },
    ],
  },
  {
    id: "ub_s3u1",
    gotoGame: "verdict",
    title: "限時朝議",
    blurb: "年份同三民主義，限時內批準確。",
    seconds: 50,
    rounds: [
      {
        prompt: "有人說全面抗戰由 1911 年辛亥革命開始。你怎麼批？",
        options: [
          {
            text: "辛亥革命在 1911 年；全面抗戰一般由 1937 年七七事變算起。兩件事要分開。",
            ok: true,
            note: "推翻帝制和全面抗戰不是同一場戰爭。",
          },
          {
            text: "照准。兩件事是同一場戰爭。",
            ok: false,
            note: "1911 和 1937 不能併成一件事。",
          },
          {
            text: "刪去年份即可，不必分辨是哪一場。",
            ok: false,
            note: "刪年份不能代替判斷。學生仍然會把兩件事混在一起。",
          },
        ],
      },
      {
        prompt: "朝會要一句介紹三民主義。你批哪一句？",
        options: [
          {
            text: "民族、民權、民生。不是軍政、訓政、憲政。",
            ok: true,
            note: "三民主義的三項是民族、民權、民生。建國程序是另一組概念。",
          },
          {
            text: "民主、民本、民富。",
            ok: false,
            note: "這三個詞不是三民主義。",
          },
          {
            text: "軍政、訓政、憲政就是三民主義的三個內容。",
            ok: false,
            note: "那是建國程序，不是三民主義本身。",
          },
        ],
      },
    ],
  },
  {
    id: "ub_s3u2",
    gotoGame: "confront",
    title: "史料對質",
    blurb: "改革開放同年份，睇有沒有超出材料。",
    rounds: [
      {
        left: { tag: "材料甲", text: "1978 年以後提出對內改革、對外開放。" },
        right: { tag: "材料乙", text: "1949 年是中華人民共和國成立，材料沒有把它寫成改革開放的開始。" },
        claim: "改革開放由 1949 年開始，而且等於閉關鎖國。",
        options: [
          {
            text: "材料把 1949 和 1978 分開。閉關鎖國也不是改革開放。",
            ok: true,
            note: "年份不能對調。開放不是閉關。",
          },
          {
            text: "建國就是改革開放，兩個年份可以互換。",
            ok: false,
            note: "材料沒有把兩年寫成同一件事。",
          },
          {
            text: "對外開放的意思就是恢復閉關。",
            ok: false,
            note: "開放和閉關是相反方向，不能合成一句。",
          },
        ],
      },
      {
        left: { tag: "材料甲", text: "1997 年香港回歸，實行一國兩制。" },
        right: { tag: "材料乙", text: "1999 年澳門回歸。" },
        claim: "因此香港和澳門同一年回歸，制度完全一樣，沒有任何分別。",
        options: [
          {
            text: "兩則年份不同。不能合成同一年、毫無分別。",
            ok: true,
            note: "1997 和 1999 都要留住。對讀不是把兩則壓成一句。",
          },
          {
            text: "材料都寫回歸，所以年份可以合併。",
            ok: false,
            note: "同樣寫回歸，不代表同一年。",
          },
          {
            text: "只留香港那則，把澳門改成 1997 年。",
            ok: false,
            note: "改材料來遷就結論，不是對讀。",
          },
        ],
      },
    ],
  },
  {
    id: "ub_s3u3",
    gotoGame: "cause",
    title: "因果連結",
    blurb: "九一八、西安、七七，分開看。",
    rounds: [
      {
        result: "1937 年後，中日戰爭進入全面抗戰。",
        prompt: "哪一個原因講得較穩？",
        options: [
          {
            text: "七七事變之後，戰爭不再限於東北一地。",
            ok: true,
            note: "全面抗戰的標誌是 1937 年七七，不是把 1931 年提前算進去。",
          },
          {
            text: "因為 1931 年九一八已經把全國都打完了。",
            ok: false,
            note: "九一八是東北淪陷的開端，當時尚未全面抗戰。",
          },
          {
            text: "因為西安事變當日日本已經投降。",
            ok: false,
            note: "西安事變在 1936 年，日本投降在 1945 年。",
          },
        ],
      },
      {
        result: "西安事變之後，停止內戰、合作抗日較有條件。",
        prompt: "哪一個原因講得較穩？",
        options: [
          {
            text: "事變促使國共關係緩和，但戰爭還沒有結束。",
            ok: true,
            note: "合作是條件。勝利和全面抗戰的開始要另外記年份。",
          },
          {
            text: "事變等於抗戰已經勝利。",
            ok: false,
            note: "1936 年不是 1945 年。",
          },
          {
            text: "事變令清朝復辟，所以才要抗日。",
            ok: false,
            note: "清朝在 1912 年已經結束。這不是西安事變的內容。",
          },
        ],
      },
    ],
  },
  {
    id: "ub_s3u4",
    gotoGame: "ledger",
    title: "成效與代價",
    blurb: "開放同回歸，都要寫年份和限度。",
    rounds: [
      {
        situation: "有人請你用一句話講 1978 年後的改革開放。",
        options: [
          {
            text: "對內改革、對外開放，建設加快；轉型裡的物價和就業問題仍要看見。",
            effect: "工作重心轉到經濟建設，對外交流增加。",
            cost: "不是毫無陣痛，也不能寫成閉關。",
            ok: true,
            note: "方向和限度都在，可以採納。",
          },
          {
            text: "核心是閉關鎖國，所以不必寫對外。",
            effect: "寫成不再跟外面來往。",
            cost: "把開放說反了。",
            ok: false,
            note: "開放和閉關是相反方向。",
          },
          {
            text: "由 1949 年開始，而且等於恢復人民公社。",
            effect: "把建國和改革開放併成一件事。",
            cost: "年份和方向都錯。",
            ok: false,
            note: "1949 年是建國。改革開放不是恢復人民公社。",
          },
        ],
      },
      {
        situation: "設立經濟特區之後，要你寫一句評語。",
        options: [
          {
            text: "沿海先作窗口，方便技術和貿易；不是全國同一日都變成一樣。",
            effect: "對外開放有了試點。",
            cost: "地區步伐不同，不是沒有新問題。",
            ok: true,
            note: "有窗口，也有限度。兩邊都寫了。",
          },
          {
            text: "特區就是恢復閉關，不跟外面來往。",
            effect: "寫成拒絕交流。",
            cost: "沒有寫試點的作用。",
            ok: false,
            note: "特區是開放的窗口，不是閉關。",
          },
          {
            text: "1980 年的特區令 1840 年的條約自動作廢。",
            effect: "把兩個時代合成一句。",
            cost: "沒有討論特區本身。",
            ok: false,
            note: "條約和特區不是同一件事，不能這樣對銷。",
          },
        ],
      },
    ],
  },
];

export const UNIT_RELICS = [
  {
    id: "rl_s1u1",
    name: "西周禮器",
    blurb: "揀屬於西周禮器的碎片。",
    lead: "撳選屬於呢件遺物嘅碎片，再嵌合。唔屬呢個年代嘅，留低。",
    relic: "一件西周青銅禮器，銘文同祭祀有關。",
    done: "禮器嵌好。科舉是後來的事，不在這件上面。",
    shards: [
      { id: "a", text: "王把土地和人民分封給諸侯", fit: true },
      { id: "b", text: "銘文記載祭祀", fit: true },
      { id: "c", text: "用於宗廟禮儀", fit: true },
      { id: "d", text: "表面刻着科舉題名錄", fit: false, note: "科舉在隋唐以後才發展，不屬於西周禮器。" },
    ],
  },
  {
    id: "rl_s1u2",
    name: "秦詔版",
    blurb: "揀屬於秦代政令的碎片。",
    lead: "撳選屬於呢件遺物嘅碎片，再嵌合。唔屬呢個年代嘅，留低。",
    relic: "一件秦代詔版，用來頒布統一的政令。",
    done: "詔版嵌好。秦代不是用科舉選郡守。",
    shards: [
      { id: "a", text: "書同文，方便文書通行", fit: true },
      { id: "b", text: "統一度量衡", fit: true },
      { id: "c", text: "郡縣長官由中央任命", fit: true },
      { id: "d", text: "以科舉錄取郡守", fit: false, note: "科舉主要在隋唐以後發展，不能刻在秦代詔版上。" },
    ],
  },
  {
    id: "rl_s1u3",
    name: "遷洛詔令",
    blurb: "揀屬於北魏漢化的碎片。",
    lead: "撳選屬於呢件遺物嘅碎片，再嵌合。唔屬呢個年代嘅，留低。",
    relic: "北魏孝文帝漢化時期的詔令殘片。",
    done: "詔令嵌好。鄭和的航海圖是明朝的東西。",
    shards: [
      { id: "a", text: "由平城遷都洛陽", fit: true },
      { id: "b", text: "改用漢族姓氏、說漢語", fit: true },
      { id: "c", text: "禮制向中原靠近", fit: true },
      { id: "d", text: "附有鄭和船隊的航海圖", fit: false, note: "下西洋是明朝的事，不屬於北魏的詔令。" },
    ],
  },
  {
    id: "rl_s1u4",
    name: "運河石刻",
    blurb: "揀屬於隋唐運河的碎片。",
    lead: "撳選屬於呢件遺物嘅碎片，再嵌合。唔屬呢個年代嘅，留低。",
    relic: "記述大運河的石刻。功用和代價都在上面。",
    done: "石刻嵌好。運河不是王安石在熙寧年間一日鑿成。",
    shards: [
      { id: "a", text: "溝通南北，方便運糧", fit: true },
      { id: "b", text: "工程用了大量民力", fit: true },
      { id: "c", text: "與隋統一南北之後的建設有關", fit: true },
      { id: "d", text: "王安石於熙寧年間一日鑿成", fit: false, note: "大運河不是王安石一日建成，熙寧變法是宋代的事。" },
    ],
  },
  {
    id: "rl_s2u1",
    name: "開封城磚",
    blurb: "揀屬於北宋開封的碎片。",
    lead: "撳選屬於呢件遺物嘅碎片，再嵌合。唔屬呢個年代嘅，留低。",
    relic: "北宋開封城的城磚，連着一段城防紀錄。",
    done: "城磚嵌好。鄭和不由開封出海。",
    shards: [
      { id: "a", text: "北宋的都城在開封，不是長安", fit: true },
      { id: "b", text: "杯酒釋兵權與收回兵權有關", fit: true },
      { id: "c", text: "強幹弱枝要和後來的戰局分開寫", fit: true },
      { id: "d", text: "鄭和由開封揚帆出海", fit: false, note: "下西洋是明朝由海路出發，不是北宋由開封出海。" },
    ],
  },
  {
    id: "rl_s2u2",
    name: "下西洋羅盤",
    blurb: "揀屬於鄭和船隊的碎片。",
    lead: "撳選屬於呢件遺物嘅碎片，再嵌合。唔屬呢個年代嘅，留低。",
    relic: "明朝船隊用過的羅盤殘件。",
    done: "羅盤嵌好。船上不會載着清朝的條約正本。",
    shards: [
      { id: "a", text: "永樂年間的遠航", fit: true },
      { id: "b", text: "沿海路前往西洋", fit: true },
      { id: "c", text: "不是張騫那條西域陸路", fit: true },
      { id: "d", text: "船上載着《南京條約》正本", fit: false, note: "《南京條約》是清朝的條約，不能放在明朝的船上。" },
    ],
  },
  {
    id: "rl_s2u3",
    name: "條約抄件",
    blurb: "揀屬於晚清條約的碎片。",
    lead: "撳選屬於呢件遺物嘅碎片，再嵌合。唔屬呢個年代嘅，留低。",
    relic: "一夾晚清條約抄件。每份條約仍要分開讀。",
    done: "抄件嵌好。《辛丑條約》不是把台灣割讓的那一份。",
    shards: [
      { id: "a", text: "《南京條約》涉及割讓香港島", fit: true },
      { id: "b", text: "《馬關條約》涉及割讓台灣", fit: true },
      { id: "c", text: "兩份條約不是同一場戰爭", fit: true },
      { id: "d", text: "《辛丑條約》把台灣割讓", fit: false, note: "割讓台灣是《馬關條約》。辛丑之後主要是賠款，不是這一條。" },
    ],
  },
  {
    id: "rl_s3u1",
    name: "演講殘頁",
    blurb: "揀屬於民國這段的碎片。",
    lead: "撳選屬於呢件遺物嘅碎片，再嵌合。唔屬呢個年代嘅，留低。",
    relic: "一頁介紹三民主義和民初政局的演講殘頁。",
    done: "殘頁嵌好。軍政、訓政、憲政不是三民主義的三項。",
    shards: [
      { id: "a", text: "三民主義是民族、民權、民生", fit: true },
      { id: "b", text: "辛亥革命推翻帝制", fit: true },
      { id: "c", text: "全面抗戰與 1937 年有關", fit: true },
      { id: "d", text: "三民主義就是軍政、訓政、憲政", fit: false, note: "軍政、訓政、憲政是建國程序，不是三民主義的三項。" },
    ],
  },
  {
    id: "rl_s3u2",
    name: "改革開放紀念章",
    blurb: "揀屬於改革開放的碎片。",
    lead: "撳選屬於呢件遺物嘅碎片，再嵌合。唔屬呢個年代嘅，留低。",
    relic: "一枚紀念改革開放的章。年份和方向都要對。",
    done: "紀念章嵌好。改革開放不是恢復人民公社，也不是 1949 年開始。",
    shards: [
      { id: "a", text: "1978 年前後啟動", fit: true },
      { id: "b", text: "對內改革、對外開放", fit: true },
      { id: "c", text: "不是由 1949 年開始", fit: true },
      { id: "d", text: "核心是恢復人民公社", fit: false, note: "改革開放不是恢復人民公社，也不是閉關。" },
    ],
  },
  {
    id: "rl_s3u3",
    name: "抗戰年表殘頁",
    blurb: "揀屬於抗戰這段的碎片。",
    lead: "撳選屬於呢件遺物嘅碎片，再嵌合。唔屬呢段歷史嘅，留低。",
    relic: "一頁抗戰年表。九一八、西安、七七要分開。",
    done: "年表嵌好。全面抗戰不是由鴉片戰爭或九一八開始。",
    shards: [
      { id: "a", text: "1931 年九一八，東北淪陷的開端", fit: true },
      { id: "b", text: "1937 年七七事變，全面抗戰", fit: true },
      { id: "c", text: "西安事變促成合作，不是戰爭結束", fit: true },
      { id: "d", text: "全面抗戰由 1840 年鴉片戰爭開始", fit: false, note: "鴉片戰爭是清朝的事。全面抗戰一般由 1937 年七七事變算起。" },
    ],
  },
  {
    id: "rl_s3u4",
    name: "回歸年份封",
    blurb: "揀屬於當代這段的碎片。",
    lead: "撳選屬於呢件遺物嘅碎片，再嵌合。唔屬呢段歷史嘅，留低。",
    relic: "一個寫着回歸和開放的封套。年份不能併掉。",
    done: "封套嵌好。香港和澳門不是同一年回歸。",
    shards: [
      { id: "a", text: "1978 年後對內改革、對外開放", fit: true },
      { id: "b", text: "香港 1997 年回歸", fit: true },
      { id: "c", text: "澳門 1999 年回歸，與香港不是同一年", fit: true },
      { id: "d", text: "港澳同一年回歸，改革開放等於閉關", fit: false, note: "1997 和 1999 要分開。開放不是閉關。" },
    ],
  },
];

export function unitBoard(unit) {
  if (!unit?.boardId) return null;
  return UNIT_BOARDS.find((b) => b.id === unit.boardId) || null;
}

export function unitRelic(unit) {
  if (!unit?.relicId) return null;
  return UNIT_RELICS.find((r) => r.id === unit.relicId) || null;
}

const STEP_LABEL = {
  timeline: "時光長河",
  flip: "機緣連線",
  cuoshi: "錯史之戰",
  dialogue: "古人問答",
  relic: "遺物拼圖",
};

export function feelLabel(unit, step) {
  if (step === "board") return unitBoard(unit)?.title || "互動";
  return STEP_LABEL[step] || "闖關";
}

function oneOk(options) {
  return (options || []).filter((opt) => opt && opt.ok === true).length === 1;
}

/** 資料自檢：每個單元都有板同拼圖，而且冇空關。 */
export function auditUnitFeels(units) {
  const errors = [];
  const games = new Set();
  const sequences = new Set();
  for (const unit of units || []) {
    const board = unitBoard(unit);
    const relic = unitRelic(unit);
    if (!board) errors.push(`${unit.id} 沒有互動板`);
    if (!relic) errors.push(`${unit.id} 沒有遺物拼圖`);
    const steps = unit.run || [];
    sequences.add(steps.join(">"));
    if (!steps.includes("board") || !steps.includes("relic")) {
      errors.push(`${unit.id} 的闖關沒有同時包含互動板和遺物拼圖`);
    }
    if (board) {
      games.add(board.gotoGame);
      if (!["cause", "ledger", "confront", "route", "verdict"].includes(board.gotoGame)) {
        errors.push(`${board.id} 的玩法不在長卷互動板裡`);
      }
      if ((board.rounds || []).length < 2) errors.push(`${board.id} 不足兩題`);
      for (const round of board.rounds || []) {
        if (!oneOk(round.options)) errors.push(`${board.id} 有一題不是剛好一個正解`);
        if (board.gotoGame === "ledger") {
          for (const opt of round.options || []) {
            if (!opt.effect || !opt.cost || !opt.text) errors.push(`${board.id} 的賬頁不完整`);
          }
        }
        if (board.gotoGame === "confront" && (!round.left?.text || !round.right?.text || !round.claim)) {
          errors.push(`${board.id} 的材料不完整`);
        }
        if (board.gotoGame === "route" && (!round.mission || !round.from)) {
          errors.push(`${board.id} 的路線不完整`);
        }
        if (board.gotoGame === "cause" && !round.result) errors.push(`${board.id} 缺少結果`);
        if (board.gotoGame === "verdict" && !round.prompt) errors.push(`${board.id} 缺少朝議`);
      }
      if (board.gotoGame === "verdict" && !(Number(board.seconds) >= 15)) {
        errors.push(`${board.id} 沒有時限`);
      }
    }
    if (relic) {
      const shards = relic.shards || [];
      const fit = shards.filter((s) => s.fit).length;
      const stray = shards.filter((s) => !s.fit);
      if (shards.length < 3 || fit < 1 || stray.length < 1) errors.push(`${relic.id} 的碎片不足`);
      if (!relic.lead || !relic.name) errors.push(`${relic.id} 缺少說明`);
      for (const shard of stray) {
        if (!shard.note) errors.push(`${relic.id} 的錯碎片沒有說明`);
      }
    }
  }
  if (sequences.size < (units || []).length) errors.push("有單元的闖關順序完全相同");
  for (const game of ["cause", "ledger", "confront", "route", "verdict"]) {
    if (!games.has(game)) errors.push(`沒有單元用到 ${game}`);
  }
  return errors;
}
