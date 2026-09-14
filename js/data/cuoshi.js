/**
 * 錯史之戰：Boss 是被改亂的史書（非歷史人物）
 * 玩法：讀殘卷 → 撳出錯句 → 揀修正
 */
export const CUOSHI_BATTLES = [
  {
    id: "cs1_opium_tang",
    title: "錯史之戰Ⅰ：時代錯置",
    blurb: "殘卷把近代戰事寫進盛唐——找出錯句，再改返正確。",
    chapterHint: "ch1_escape",
    difficulty: "入門",
    pageTitle: "開元史話（殘卷）",
    lines: [
      { id: "a", text: "唐玄宗在位年間，國力強盛，後人稱為盛唐。" },
      { id: "b", text: "其時都城在長安，詩賦與禮樂並盛。" },
      { id: "c", text: "其後爆發鴉片戰爭，唐軍不敵，被迫開放口岸。", wrong: true },
      { id: "d", text: "安史之亂起，兩京動搖，盛唐由盛轉衰。" },
    ],
    fix: {
      prompt: "呢句應該點改？",
      options: [
        "鴉片戰爭發生在清朝道光年間，不屬唐代。",
        "改成安史之亂即可，唔使理年份。",
        "改成赤壁之戰，一樣係打仗。",
        "刪去唔寫，歷史就無呢單嘢。",
      ],
      answer: 0,
      repaired: "鴉片戰爭發生在清朝道光年間，與盛唐並非同一時代。",
      skill: "timeline",
      explain: "鴉片戰爭屬近代／清朝，盛唐是唐玄宗時期，兩者相隔約千年。",
    },
  },
  {
    id: "cs2_keju_qin",
    title: "錯史之戰Ⅱ：制度張冠李戴",
    blurb: "殘卷聲稱秦始皇以科舉選官——找出錯配。",
    difficulty: "進階",
    pageTitle: "秦政紀略（殘卷）",
    lines: [
      { id: "a", text: "秦始皇統一六國，自稱皇帝，建立中央集權。" },
      { id: "b", text: "朝廷以文書政令治天下，劃分郡縣。" },
      { id: "c", text: "並推行科舉制度，開科取士，選拔官員。", wrong: true },
      { id: "d", text: "又統一文字與度量衡，以便政令通行。" },
    ],
    fix: {
      prompt: "呢句應該點改？",
      options: [
        "科舉制度主要在隋唐以後發展成熟，秦代並非以此選官。",
        "改成秦以分封制選官即可。",
        "改成秦以佛教考試選官。",
        "改成秦以商稅高低選官。",
      ],
      answer: 0,
      repaired: "選官並非科舉：科舉制度主要在隋唐以後發展成熟。",
      skill: "recall",
      explain: "要把制度放回它出現與成熟的時代，勿把後世名稱套上前朝。",
    },
  },
  {
    id: "cs3_two_sources",
    title: "錯史之戰Ⅲ：推論過度",
    blurb: "一郡官員自誇政績，殘卷卻寫成全國人人擁護——搵出講得太盡嗰句。",
    difficulty: "進階",
    pageTitle: "某郡上計殘頁",
    spotLead: "呢份只係一郡官員自己講嘅政績。搵吓邊句講得太盡。",
    spotHint: "提示：一郡嘅上奏，可不可以講成全國、人人都擁護？",
    lines: [
      { id: "a", text: "郡守上奏：本年勸農有成，境內稱便。" },
      { id: "b", text: "又謂倉廩稍實，盜賊較往年為少。" },
      { id: "c", text: "因此，全中國每一個人都擁護這位郡守，無人例外。", wrong: true },
      { id: "d", text: "此奏僅報本郡本年之事，尚未得朝廷批覆。" },
    ],
    fix: {
      prompt: "呢句應該點改？",
      options: [
        "一郡自述不能推成全國擁護，仍需其他材料對讀。",
        "刪去所有史料，當無呢單事。",
        "改成全國都反對。",
        "用數學證明全民擁護。",
      ],
      answer: 0,
      repaired: "此乃一郡官員自述，是否得民心，仍需民間或其他記載對讀。",
      skill: "source",
      explain: "單一立場、有限材料，不能直接推成「全國、人人如此」。",
    },
  },
  {
    id: "cs4_policy_cost",
    title: "錯史之戰Ⅳ：只講好處",
    blurb: "殘卷只寫拓邊「百利而無一害」——補上代價視角。",
    difficulty: "高階",
    pageTitle: "漢武拓邊贊（殘卷）",
    lines: [
      { id: "a", text: "漢武帝遣將出擊匈奴，開通西域，邊郡漸立。" },
      { id: "b", text: "絲路漸通，史家多記其開拓之功。" },
      { id: "c", text: "此次用兵百利而無一害，民生毫無負擔。", wrong: true },
      { id: "d", text: "其後有輪台之詔，言及連年興兵之困。" },
    ],
    fix: {
      prompt: "呢句應該點改？",
      options: [
        "拓邊有功，亦當並陳軍費、民力等可能代價。",
        "只罵皇帝，功勞全部刪去。",
        "只歌頌勝利，代價唔使寫。",
        "取消邊防討論，當無其事。",
      ],
      answer: 0,
      repaired: "開拓有功，惟軍費與民力負擔亦見於記載，不宜只寫百利而無一害。",
      skill: "argue",
      explain: "評價政策要成就與代價並陳，才較接近史實討論。",
    },
  },
  {
    id: "cs5_linked_errors",
    title: "錯史之戰Ⅴ：連環錯頁",
    blurb: "殘卷把相隔極遠的事件建成直接因果——找出偽因果嗰句。",
    difficulty: "精英",
    pageTitle: "變法長編（殘卷）",
    lines: [
      { id: "a", text: "商鞅變法使秦國富強，為日後統一六國奠基。" },
      { id: "b", text: "變法重耕戰、明賞罰，改變秦國制度。" },
      { id: "c", text: "商鞅變法直接導致辛亥革命，推翻帝制。", wrong: true },
      { id: "d", text: "辛亥革命爆發於清宣統三年，距商鞅已兩千餘年。" },
    ],
    fix: {
      prompt: "呢句應該點改？",
      options: [
        "兩者各有時代意義，不宜建成直接因果。",
        "合併成同一事件即可。",
        "刪去商鞅變法。",
        "刪去辛亥革命。",
      ],
      answer: 0,
      repaired: "商鞅變法與辛亥革命相隔極遠，應分開討論，不宜寫成直接因果。",
      skill: "cause",
      explain: "先確認時代定位，再判斷影響是否真的「直接」。",
    },
  },
];

/** 長卷 Boss 用嘅殘卷（唔出現喺趣味關卡列表） */
export const CHAPTER_BOSS_PAGES = {
  ch2_figures: {
    id: "boss_ch2_kongzi_qin",
    title: "張冠李戴",
    pageTitle: "錯置名人錄（殘卷）",
    lines: [
      { id: "a", text: "孔子生於春秋，講學於魯，弟子記錄其言為《論語》。" },
      { id: "b", text: "秦始皇為戰國末至秦朝君主，統一六國，自稱皇帝。" },
      { id: "c", text: "孔子輔佐秦始皇統一六國，並為秦相。", wrong: true },
      { id: "d", text: "二人所處世紀不同，文獻所見活動範圍亦異。" },
    ],
    fix: {
      prompt: "呢句應該點改？",
      options: [
        "孔子活動於春秋；秦始皇是戰國末至秦朝的君主，並非同一世。",
        "改成孔子發明火藥。",
        "改成秦始皇寫《論語》。",
        "兩人對調職位即可。",
      ],
      answer: 0,
      repaired: "孔子與秦始皇不同世，不可寫成君臣輔佐。",
      skill: "recall",
      explain: "識人先識其時其職，勿把不同時代的人物硬配一堂。",
    },
  },
};

export function getCuoshi(id) {
  return CUOSHI_BATTLES.find((b) => b.id === id) || null;
}

export function wrongLineOf(pack) {
  return (pack?.lines || []).find((ln) => ln.wrong) || null;
}
