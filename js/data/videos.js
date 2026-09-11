/**
 * 影片區：可嵌入公開教育影片（YouTube）
 * 老師可日後在此陣列新增／替換連結
 */
export const VIDEOS = [
  {
    id: "v1",
    title: "中國歷史概覽（教育向）",
    grade: "中一至中三",
    topic: "總覽",
    desc: "快速認識中國歷史分期與重要轉折。",
    youtubeId: "oAtZeLqyQeI",
    note: "若影片無法播放，請檢查網絡或自行替換 youtubeId。",
  },
  {
    id: "v2",
    title: "絲綢之路與中外交流",
    grade: "中一",
    topic: "秦漢／文化交流",
    desc: "了解張騫通西域與絲路意義。",
    youtubeId: "vfe-eNq-Qkg",
  },
  {
    id: "v3",
    title: "長城與邊防",
    grade: "中一／中二",
    topic: "國防",
    desc: "從秦到明，長城如何反映國力與邊患。",
    youtubeId: "7vzqQxW0v0Y",
  },
  {
    id: "v4",
    title: "鴉片戰爭與近代中國",
    grade: "中二",
    topic: "清",
    desc: "認識鴉片戰爭背景、經過與影響。",
    youtubeId: "iXFw3eg8rP0",
  },
  {
    id: "v5",
    title: "辛亥革命簡說",
    grade: "中三",
    topic: "民國",
    desc: "孫中山與辛亥革命的歷史意義。",
    youtubeId: "0hY9bQ0n0ZQ",
  },
];

/** 可嵌入外部 Wordwall 活動（老師自行貼上連結） */
export const EXTERNAL_WORDWALL = [
  {
    title: "（示例）老師可在此加入 Wordwall 連結",
    url: "https://wordwall.net/",
    note: "到 Wordwall 建立活動後，把分享連結加到 js/data/videos.js 的 EXTERNAL_WORDWALL。",
  },
];
