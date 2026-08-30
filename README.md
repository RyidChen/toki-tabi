# Toki Tabi｜台日航班探索

以 Vue 3 與 TypeScript 開發的台日航班搜尋作品。使用者可以選擇台灣或日本作為出發地，依行程日期與條件瀏覽、篩選並排序航班結果。

> 本專案目前使用本地模擬資料，顯示內容與價格皆非即時航班資訊，不提供訂票功能。

## 功能

- 支援台灣 → 日本與日本 → 台灣雙向搜尋
- 一鍵交換出發地與目的地
- 支援單程與來回行程
- 日期、成人乘客數與跨國航線驗證
- 僅顯示直飛航班
- 依價格、飛行時間或出發時間排序
- 標示最便宜與最快航班
- 搜尋中、無結果與錯誤狀態
- 響應式版面與基本無障礙操作

## 技術棧

- Vue 3 Composition API
- TypeScript
- Vite
- Vue Router
- Pinia
- Vant
- CSS

## 本機啟動

需求：Node.js `20.19+` 或 `22.12+`。

```bash
npm install
npm run dev
```

## 專案結構

```text
src/
├─ components/       # 搜尋表單、排序與航班結果元件
├─ composables/      # 航班搜尋狀態與非同步流程
├─ data/             # 機場與模擬航班資料
├─ router/           # Vue Router 設定
├─ stores/           # Pinia stores
├─ types/            # 航班領域型別
├─ utils/            # 搜尋驗證、篩選與排序邏輯
├─ views/            # 頁面元件
├─ App.vue
└─ main.ts
```

## 資料流程

```text
搜尋表單
  → useFlightSearch
  → 本地模擬航班資料
  → 驗證、篩選與排序
  → 航班結果畫面
```

## 專案狀態

目前完成前端搜尋體驗，後端、即時票價與訂票功能尚未實作。
