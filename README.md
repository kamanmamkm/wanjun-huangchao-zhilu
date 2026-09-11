# 萬鈞伯裘—皇朝之路

初中中國歷史科角色成長網頁遊戲。每個登入帳號是獨立角色（男女路線），答對題目與完成小遊戲可升級，從奴隸／婢女走到皇帝／女皇。

## 功能

- **註冊／登入**：本機 `localStorage` 存帳號進度（適合課堂／家用；不同瀏覽器資料不互通）
- **題目練習**：選擇題、填充題、配對題（中一至中三，中等難度）
- **小遊戲**：Wordwall 風格翻牌／問答、人物時間線、與古人對話
- **影片區**：可嵌入 YouTube 教育影片（於 `js/data/videos.js` 設定）

題目依香港初中中史課程主題**自擬**，對齊齡記／亮點中國史常見單元，並非直接複製出版社課文或工作紙原文。

## 本機預覽

因使用 ES modules，請用本機伺服器開啟（勿直接雙擊 `index.html`）：

```bash
cd "萬鈞伯裘-皇朝之路"
python3 -m http.server 8080
```

瀏覽器打開：http://localhost:8080

## GitHub Pages

1. 將本專案推上 GitHub
2. Repository → Settings → Pages → Source 選 `main` branch、`/ (root)`
3. 稍待後以 `https://<用戶名>.github.io/<repo名>/` 開啟

若 repo 名不是根網域，無需改路徑（本站使用相對路徑）。

## 自訂

| 檔案 | 用途 |
|------|------|
| `js/data/questions.js` | 題庫 |
| `js/data/games.js` | 時間線、Wordwall 關卡 |
| `js/data/dialogues.js` | 與古人對話 |
| `js/data/videos.js` | 影片與外部 Wordwall 連結 |
| `js/data/ranks.js` | 等級經驗門檻 |
| `js/data/characters.js` | 人物原型 |

## 授權說明

遊戲程式碼可自行修改作教學用途。請勿把出版社教材原文整份上載到公開網站。
