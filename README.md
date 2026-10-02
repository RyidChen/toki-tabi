# Toki Tabi｜台日航班探索

以 Vue 3 與 TypeScript 開發的台日航班搜尋作品。使用者可以選擇台灣或日本作為出發地，依行程日期與條件瀏覽、篩選並排序航班結果。

> 首頁預設仍使用本地模擬資料，顯示內容與價格皆非即時航班資訊，不提供訂票功能。本地開發另提供 API 測試頁，讀取 C# 後端儲存的官網參考起價。

## 功能

- 支援台灣 → 日本與日本 → 台灣雙向搜尋
- 一鍵交換出發地與目的地
- 支援單程與來回行程
- 日期、成人乘客數與跨國航線驗證
- 僅顯示直飛航班（來回行程會同時檢查去程與回程）
- 顯示去程與回程時刻，時間以各機場當地時間為準
- 依價格、去程飛行時間或去程出發時間排序
- 標示最低價與去程最短的航班
- 搜尋中、無結果與錯誤狀態
- 響應式版面與基本無障礙操作

## 技術棧

- Vue 3 Composition API
- TypeScript
- Vite
- Vue Router
- CSS

## 本機啟動

需求：Node.js `20.19+` 或 `22.12+`。

```bash
npm install
npm run dev
```

## 本地 API 串接測試

1. 確認 `D:\work project\travel-db` 的後端已啟動，預設為 `http://127.0.0.1:5080`。如果已在執行，不需要重複啟動。
2. 在前端執行 `npm run dev`，開啟終端顯示的網址。
3. 點首頁的「本地 API 測試」，或在該網址後加上 `/api-test`。

測試頁會讀取連線狀態、資料來源、最近擷取紀錄及票價；可篩選機場、日期與最高起價，點「價格歷史」讀取同一行程的擷取紀錄。請求失敗會顯示錯誤，不會混入展示資料。

Vite 開發伺服器將 `/api` 與 `/health` 轉送到本地後端，因此前端即使使用不同連接埠，也不需要修改 CORS。若後端網址不同，複製 `.env.example` 為 `.env.local` 並設定後重新啟動 Vite：

```dotenv
API_PROXY_TARGET=http://127.0.0.1:5080
```

`.env.local` 已忽略，不會進入 Git。瀏覽器僅呼叫以下 GET API，沒有儲存管理金鑰，也不會觸發爬蟲：

| API                             | 用途                              |
| ------------------------------- | --------------------------------- |
| `/health`                       | 後端連線狀態                      |
| `/api/sources`                  | 資料來源與上次成功時間            |
| `/api/fares`                    | 查詢已儲存的票價，最多顯示 100 筆 |
| `/api/fares/{offerKey}/history` | 最近 50 筆價格歷史                |
| `/api/crawls?limit=10`          | 最近擷取紀錄                      |

後端目前提供官網公開起價，可能來自近 48 小時快取，並非即時可售庫存；人數、稅金、行李、航班時間及是否直飛未確認。因此使用獨立的 `FareObservation` 型別呈現，不將缺少的欄位補成首頁的展示航班。查詢無資料代表沒有已儲存的符合紀錄，並不代表航空公司沒有航班。

`/api-test` 路由和首頁測試入口只在開發模式啟用；`npm run build` 的正式版本仍只有原本展示功能，不包含 API 測試頁或 API 呼叫。未來正式接入主頁時需另外處理部署用 API 網址與完整航班契約。

## 專案結構

```text
src/
├─ api/travelApi.ts   # 真實後端的 GET 請求、錯誤處理與回傳檢查
├─ components/       # 搜尋表單、排序與航班結果元件
├─ composables/      # 航班搜尋狀態與非同步流程
├─ data/             # 機場與模擬航班資料
├─ router/           # Vue Router 設定
├─ types/flight.ts   # 原本展示航班的型別
├─ types/fare.ts     # 後端參考起價、歷史、來源與擷取紀錄型別
├─ utils/            # 日期處理、搜尋驗證、篩選與排序
├─ views/Home.vue    # 首頁，固定使用 mockFlights
├─ views/ApiTest.vue # 僅本地開發的真實 API 測試頁
├─ App.vue
└─ main.ts
```

## 資料流程

```text
FlightSearchForm：編輯欄位 → 驗證 → 傳出搜尋條件
  → useFlightSearch：管理載入、成功與失敗狀態
  → searchMockFlights：依日期產生展示航班，再篩選航線與直飛條件
  → useFlightSearch：依排序選項推導結果
  → FlightResults：顯示狀態，交給 FlightCard 呈現航班
```

## 檢查

```bash
npm test
npm run build
```

測試使用 Node.js 內建測試工具，透過現有 Vite 載入 TypeScript，涵蓋原本搜尋邏輯，以及 API 參數、回傳資料、錯誤與取消請求。建置會先做 TypeScript 型別檢查。API 自動測試使用受控回應，實際連線可在 `/api-test` 驗證。

## 專案狀態

目前完成展示搜尋與本地後端串接測試入口；尚未將真實票價取代首頁展示資料，不提供即時可售航班或訂票功能。
