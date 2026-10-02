<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from "vue";
import {
  getCrawls,
  getFareHistory,
  getFares,
  getHealth,
  getSources,
} from "../api/travelApi";
import { AIRPORTS } from "../data/airports";
import type {
  CrawlRun,
  FareHistoryResponse,
  FareObservation,
  FareSource,
  FaresResponse,
} from "../types/fare";

const form = reactive({
  origin: "TPE",
  destination: "",
  departureFrom: "",
  departureTo: "",
  returnDate: "",
  maxPrice: "",
});
const sources = ref<FareSource[]>([]);
const crawls = ref<CrawlRun[]>([]);
const connection = ref("");
const metadataError = ref("");
const checking = ref(false);
const result = ref<FaresResponse | null>(null);
const loading = ref(false);
const error = ref("");
const selected = ref<FareObservation | null>(null);
const history = ref<FareHistoryResponse | null>(null);
const historyLoading = ref(false);
const historyError = ref("");
// 頁面離開時取消全部讀取；搜尋與歷史各自保留控制器，供下一次查詢取代。
const pageController = new AbortController();
let searchController: AbortController | undefined;
let historyController: AbortController | undefined;

const priceFormat = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  currencyDisplay: "code",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
const timeFormat = new Intl.DateTimeFormat("zh-TW", {
  timeZone: "Asia/Taipei",
  dateStyle: "short",
  timeStyle: "short",
  hour12: false,
});

function time(value: string | null): string {
  if (!value || Number.isNaN(Date.parse(value))) return "來源未提供";
  return timeFormat.format(new Date(value));
}

function priceBasis(fare: FareObservation): string {
  const scope = fare.priceScope === "perPerson" ? "單人" : "人數未提供";
  // 必須區分 false（未稅）與 null（未知），不能直接用真假值判斷。
  let tax = "稅費未確認";
  if (fare.taxesIncluded === true) tax = "含稅";
  if (fare.taxesIncluded === false) tax = "未稅";
  return `${scope} · ${tax}`;
}

function cabinLabel(cabin: string): string {
  if (cabin === "ECONOMY") return "經濟艙";
  if (cabin === "UNKNOWN") return "艙等未提供";
  return cabin;
}

function sourceLink(value: string): string | undefined {
  // 網址來自 API，只讓畫面連向 HTTPS，避免把其他協定當成可點擊連結。
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function errorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : "讀取失敗，請稍後重試。";
}

async function checkConnection(): Promise<void> {
  checking.value = true;
  connection.value = "";
  metadataError.value = "";
  sources.value = [];
  crawls.value = [];
  try {
    const [health, nextSources, nextCrawls] = await Promise.all([
      getHealth(pageController.signal),
      getSources(pageController.signal),
      getCrawls(10, pageController.signal),
    ]);
    connection.value = `API 已連線 · ${time(health.utcNow)}（台灣時間）`;
    sources.value = nextSources;
    crawls.value = nextCrawls;
  } catch (cause) {
    if (!pageController.signal.aborted)
      metadataError.value = errorMessage(cause);
  } finally {
    checking.value = false;
  }
}

async function search(): Promise<void> {
  // 新查詢開始時，舊票價與其歷史已不適用；取消舊請求並清空畫面。
  searchController?.abort();
  historyController?.abort();
  const controller = new AbortController();
  searchController = controller;
  selected.value = null;
  history.value = null;
  historyError.value = "";
  historyLoading.value = false;
  result.value = null;
  error.value = "";
  loading.value = true;
  try {
    result.value = await getFares(
      {
        origin: form.origin || undefined,
        destination: form.destination || undefined,
        departureFrom: form.departureFrom || undefined,
        departureTo: form.departureTo || undefined,
        returnDate: form.returnDate || undefined,
        maxPrice: form.maxPrice === "" ? undefined : Number(form.maxPrice),
        limit: 100,
      },
      controller.signal,
    );
  } catch (cause) {
    if (!controller.signal.aborted) error.value = errorMessage(cause);
  } finally {
    // 舊請求的 finally 可能晚到，只讓目前這次查詢結束載入狀態。
    if (searchController === controller) loading.value = false;
  }
}

async function showHistory(fare: FareObservation): Promise<void> {
  historyController?.abort();
  const controller = new AbortController();
  historyController = controller;
  selected.value = fare;
  history.value = null;
  historyError.value = "";
  historyLoading.value = true;
  try {
    history.value = await getFareHistory(fare.offerKey, 50, controller.signal);
  } catch (cause) {
    if (!controller.signal.aborted) historyError.value = errorMessage(cause);
  } finally {
    if (historyController === controller) historyLoading.value = false;
  }
}

onMounted(() => {
  void checkConnection();
  void search();
});
onUnmounted(() => {
  pageController.abort();
  searchController?.abort();
  historyController?.abort();
});
</script>

<template>
  <div class="api-page page-shell">
    <header>
      <RouterLink to="/" class="text-link">← 回到展示首頁</RouterLink>
      <p class="eyebrow">LOCAL DEVELOPMENT</p>
      <h1>官網票價 API 測試</h1>
      <p class="intro">
        此頁讀取本地 C# 後端；首頁仍使用原本的展示資料。測試頁只在 npm run dev
        開放。
      </p>
    </header>

    <section class="panel" aria-labelledby="connection-title">
      <div class="section-heading">
        <h2 id="connection-title">資料連線</h2>
        <button
          type="button"
          class="secondary"
          :disabled="checking"
          @click="checkConnection"
        >
          {{ checking ? "檢查中…" : "重新檢查連線" }}
        </button>
      </div>
      <p v-if="checking" role="status">正在讀取後端狀態…</p>
      <p v-else-if="metadataError" class="error" role="alert">
        {{ metadataError }}
      </p>
      <p v-else class="connected" role="status">{{ connection }}</p>
      <p v-if="metadataError" class="hint">
        請確認後端已啟動，且 .env.local 的 API_PROXY_TARGET 與後端網址一致。
      </p>
      <details v-if="sources.length">
        <summary>資料來源與最近擷取紀錄（{{ sources.length }} 個來源）</summary>
        <ul class="source-list">
          <li v-for="source in sources" :key="source.id">
            <a
              :href="sourceLink(source.url)"
              target="_blank"
              rel="noopener noreferrer"
              >{{ source.name }} ↗</a
            >
            <span
              >{{ source.origin }} →
              {{ source.destination === "JP" ? "日本" : source.destination }} ·
              {{
                source.sourceCacheWindowHours === null
                  ? "來源快取時間未提供"
                  : `來源快取最長 ${source.sourceCacheWindowHours} 小時`
              }}</span
            >
            <span
              >上次成功：{{
                time(source.lastSuccessfulRun?.completedAt ?? null)
              }}</span
            >
          </li>
        </ul>
        <div
          v-if="crawls.length"
          class="table-scroll"
          tabindex="0"
          role="region"
          aria-label="最近擷取紀錄"
        >
          <table>
            <caption>
              最近
              {{
                crawls.length
              }}
              次擷取（台灣時間）
            </caption>
            <thead>
              <tr>
                <th scope="col">來源</th>
                <th scope="col">完成時間</th>
                <th scope="col">結果</th>
                <th scope="col">筆數</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="crawl in crawls" :key="crawl.id">
                <td>{{ crawl.sourceId }}</td>
                <td>{{ time(crawl.completedAt) }}</td>
                <td>{{ crawl.status === "succeeded" ? "成功" : "失敗" }}</td>
                <td>{{ crawl.fareCount }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="hint">尚無擷取紀錄。</p>
      </details>
    </section>

    <section class="panel" aria-labelledby="search-title">
      <h2 id="search-title">查詢參考起價</h2>
      <p class="hint">
        只查詢已儲存的票價，不會觸發爬蟲。日期可留空；未指定去程起日會從台灣今天開始查詢。
      </p>
      <form class="filter-form" @submit.prevent="search">
        <label
          >出發機場<select v-model="form.origin" class="form-control">
            <option value="">全部</option>
            <option
              v-for="airport in AIRPORTS"
              :key="airport.code"
              :value="airport.code"
            >
              {{ airport.city }}（{{ airport.code }}）
            </option>
          </select></label
        >
        <label
          >抵達機場<select v-model="form.destination" class="form-control">
            <option value="">全部</option>
            <option
              v-for="airport in AIRPORTS"
              :key="airport.code"
              :value="airport.code"
            >
              {{ airport.city }}（{{ airport.code }}）
            </option>
          </select></label
        >
        <label
          >最高起價（TWD）<input
            v-model="form.maxPrice"
            class="form-control"
            type="number"
            min="0.01"
            max="10000000"
            step="0.01"
            inputmode="decimal"
            placeholder="不限金額"
        /></label>
        <label
          >去程起日<input
            v-model="form.departureFrom"
            class="form-control"
            type="date"
        /></label>
        <label
          >去程迄日<input
            v-model="form.departureTo"
            class="form-control"
            type="date"
            :min="form.departureFrom || undefined"
        /></label>
        <label
          >回程日期<input
            v-model="form.returnDate"
            class="form-control"
            type="date"
            :min="form.departureFrom || undefined"
        /></label>
        <button type="submit" class="primary" :disabled="loading">
          {{ loading ? "讀取中…" : "查詢 API 票價" }}
        </button>
      </form>
    </section>

    <section
      class="results"
      aria-labelledby="results-title"
      :aria-busy="loading"
    >
      <h2 id="results-title">API 查詢結果</h2>
      <p v-if="loading" role="status">正在讀取票價…</p>
      <p v-else-if="error" class="panel error" role="alert">
        {{ error }} 可重新查詢。
      </p>
      <template v-else-if="result">
        <p class="notice">
          {{ result.notice }} 航班時間與是否直飛亦未確認，實際總價請到官網確認。
        </p>
        <p role="status">
          本次顯示 {{ result.count }} 筆，依起價由低到高排列。<span
            v-if="result.count >= result.limit"
            >已達 {{ result.limit }} 筆上限，請縮小查詢範圍。</span
          >
        </p>
        <p v-if="!result.items.length" class="panel">
          沒有符合條件的票價。可放寬日期或金額，並查看上方目前支援的資料來源。
        </p>
        <article
          v-for="fare in result.items"
          :key="fare.offerKey"
          class="panel fare"
        >
          <div>
            <h3>
              {{ fare.origin }} → {{ fare.destination }}
              <span class="tag">{{
                fare.tripType === "roundTrip" ? "來回" : "單程"
              }}</span>
            </h3>
            <p>
              {{ fare.airlineName }} ·
              {{ cabinLabel(fare.cabin) }}
            </p>
            <p>
              去程 {{ fare.departureDate
              }}<template v-if="fare.returnDate">
                · 回程 {{ fare.returnDate }}</template
              >
            </p>
            <p class="hint">
              官網票價更新：{{ time(fare.sourceObservedAt) }}<br />本地擷取：{{
                time(fare.observedAt)
              }}（台灣時間）
            </p>
            <p v-if="fare.isStale" class="stale">
              {{
                fare.sourceObservedAt === null
                  ? "來源未提供票價更新時間，請到官網確認。"
                  : "資料較舊，請到官網確認。"
              }}
            </p>
          </div>
          <div class="fare-actions">
            <p class="price">
              {{ priceFormat.format(fare.price) }} <small>起</small>
            </p>
            <p class="hint">{{ priceBasis(fare) }}</p>
            <button
              type="button"
              class="secondary"
              :disabled="historyLoading"
              :aria-expanded="selected?.offerKey === fare.offerKey"
              @click="showHistory(fare)"
            >
              價格歷史
            </button>
            <a
              :href="sourceLink(fare.sourceUrl)"
              target="_blank"
              rel="noopener noreferrer"
              class="text-link"
              >到航空公司確認 ↗</a
            >
          </div>
          <section
            v-if="selected?.offerKey === fare.offerKey"
            class="history"
            aria-label="價格歷史"
            :aria-busy="historyLoading"
          >
            <h4>價格歷史（最近 50 筆）</h4>
            <p v-if="historyLoading" role="status">正在讀取價格歷史…</p>
            <p v-else-if="historyError" class="error" role="alert">
              {{ historyError }}
            </p>
            <div
              v-else-if="history?.items.length"
              class="table-scroll"
              tabindex="0"
              role="region"
              aria-label="票價歷史表格"
            >
              <table>
                <caption>
                  同航線、日期及艙等的擷取紀錄；時間以台灣為準。
                </caption>
                <thead>
                  <tr>
                    <th scope="col">本地擷取時間</th>
                    <th scope="col">官網票價更新</th>
                    <th scope="col">參考起價</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in history.items" :key="index">
                    <td>{{ time(item.observedAt) }}</td>
                    <td>{{ time(item.sourceObservedAt) }}</td>
                    <td>
                      {{ priceFormat.format(item.price) }}（{{
                        priceBasis(item)
                      }}）
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-else>尚無歷史紀錄。</p>
          </section>
        </article>
      </template>
    </section>
  </div>
</template>

<style scoped>
.api-page {
  padding-block: 20px 48px;
}
header {
  margin-bottom: 24px;
}
.eyebrow {
  color: var(--teal);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  margin-top: 20px;
}
h1 {
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  margin-block: 8px;
}
h2 {
  font-size: 21px;
}
h3,
h4 {
  margin: 0 0 8px;
}
.intro,
.hint {
  color: var(--ink-soft);
}
.hint {
  font-size: 14px;
  margin-top: 8px;
}
.panel {
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface);
  margin-bottom: 20px;
}
button,
.text-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
}
button {
  padding: 10px 18px;
  border-radius: 6px;
  font-weight: 700;
}
.primary {
  background: var(--coral);
  border: 1px solid var(--coral);
  color: white;
  justify-self: start;
}
.primary:hover {
  background: var(--coral-dark);
}
.secondary {
  color: var(--teal);
  background: white;
  border: 1px solid var(--teal);
}
.secondary:hover {
  background: var(--teal-soft);
}
a,
.connected {
  color: var(--teal);
}
.filter-form {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-top: 20px;
}
label {
  display: grid;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  min-width: 0;
}
.form-control {
  min-width: 0;
}
details {
  margin-top: 16px;
}
summary {
  cursor: pointer;
  min-height: 44px;
  padding-block: 10px;
}
.source-list {
  padding-left: 20px;
}
.source-list li {
  margin-bottom: 16px;
}
.source-list a {
  display: inline-block;
  padding-block: 10px;
}
.source-list span {
  display: block;
  color: var(--ink-soft);
  font-size: 14px;
}
.notice {
  padding: 16px;
  background: var(--teal-soft);
  border-radius: 8px;
}
.results > p {
  margin-block: 16px;
}
.fare {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 20px;
}
.fare p + p {
  margin-top: 6px;
}
.tag {
  display: inline-block;
  font-size: 12px;
  color: var(--teal);
  background: var(--teal-soft);
  padding: 4px 8px;
  border-radius: 4px;
  vertical-align: middle;
}
.fare-actions {
  display: grid;
  justify-items: end;
  align-content: start;
  gap: 8px;
}
.price {
  font-size: 24px;
  font-weight: 800;
}
.price small {
  font-size: 14px;
  font-weight: 400;
}
.stale {
  color: #8a4500;
  font-size: 14px;
}
.error {
  color: var(--danger);
}
.history {
  grid-column: 1 / -1;
  border-top: 1px solid var(--line);
  padding-top: 16px;
  min-width: 0;
}
.table-scroll {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 14px;
}
caption {
  text-align: left;
  color: var(--ink-soft);
  padding-bottom: 8px;
}
th,
td {
  padding: 10px;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
}
@media (max-width: 760px) {
  .panel {
    padding: 18px;
  }
  .filter-form {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .fare {
    grid-template-columns: minmax(0, 1fr);
  }
  .fare-actions {
    justify-items: start;
  }
}
@media (max-width: 420px) {
  .filter-form {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
