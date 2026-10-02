import type {
  CrawlRun,
  FareFilters,
  FareHistoryResponse,
  FareSource,
  FaresResponse,
  HealthResponse,
} from "../types/fare";

// 相對網址交由 Vite 的本地 proxy 轉發；前端不保存管理金鑰，也不觸發爬蟲。
const formatError = "API 回傳的資料格式不正確，請確認後端網址與版本。";
const offerKeyPattern = /^[a-f0-9]{64}$/;
const requestTimeoutMs = 10_000;

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasStrings(value: Record<string, unknown>, keys: string[]) {
  return keys.every((key) => typeof value[key] === "string");
}

function isNullableString(value: unknown) {
  return value === null || typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

// null 表示來源未提供；undefined（缺少欄位）仍屬於格式錯誤。
function isNullableNumber(value: unknown) {
  return value === null || isNumber(value);
}

function isFare(value: unknown) {
  if (!isObject(value)) return false;

  // 先確認辨識票價所需的欄位，再分別檢查價格語意與可為未知的資訊。
  const hasRequiredFields =
    hasStrings(value, [
      "sourceId",
      "airlineCode",
      "airlineName",
      "origin",
      "destination",
      "departureDate",
      "cabin",
      "sourceUrl",
      "observedAt",
      "offerKey",
    ]) &&
    offerKeyPattern.test(value.offerKey as string);

  const hasSupportedPrice =
    isNumber(value.price) &&
    value.price >= 0 &&
    value.currency === "TWD" &&
    value.priceKind === "publishedFromPrice" &&
    value.availability === "unverified" &&
    (value.priceScope === "unknown" || value.priceScope === "perPerson");

  const hasValidDetails =
    isNullableString(value.returnDate) &&
    isNullableString(value.sourceLastSeen) &&
    isNullableString(value.sourceObservedAt) &&
    isNullableString(value.flightNumber) &&
    typeof value.isStale === "boolean" &&
    (value.tripType === "oneWay" || value.tripType === "roundTrip") &&
    (value.taxesIncluded === null ||
      typeof value.taxesIncluded === "boolean") &&
    isNullableNumber(value.checkedBaggageKg) &&
    isNullableNumber(value.stops);

  return hasRequiredFields && hasSupportedPrice && hasValidDetails;
}

function hasFares(
  value: unknown,
): value is Record<string, unknown> & { items: Record<string, unknown>[] } {
  return (
    isObject(value) &&
    Array.isArray(value.items) &&
    value.items.every(isFare) &&
    value.count === value.items.length
  );
}

function isCrawl(value: unknown) {
  return (
    isObject(value) &&
    isNumber(value.id) &&
    isNumber(value.fareCount) &&
    hasStrings(value, ["sourceId", "startedAt", "completedAt"]) &&
    (value.status === "succeeded" || value.status === "failed") &&
    isNullableString(value.error)
  );
}

function isSource(value: unknown) {
  return (
    isObject(value) &&
    hasStrings(value, [
      "id",
      "name",
      "origin",
      "destination",
      "url",
      "coverage",
    ]) &&
    value.priceKind === "publishedFromPrice" &&
    value.availability === "unverified" &&
    isNullableNumber(value.sourceCacheWindowHours) &&
    (value.lastRun === null || isCrawl(value.lastRun)) &&
    (value.lastSuccessfulRun === null || isCrawl(value.lastSuccessfulRun))
  );
}

function httpErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return "查詢條件不正確，請檢查日期、機場或價格。";
    case 404:
      return "找不到要求的 API 或票價紀錄。";
    default:
      return "API 暫時無法完成查詢，請稍後再試。";
  }
}

// 所有讀取共用：GET → HTTP 檢查 → JSON 解析 → 欄位驗證。
// TypeScript 的型別不會驗證網路回應，通過 valid 才能交給畫面使用。
async function request<T>(
  path: string,
  valid: (value: unknown) => boolean,
  signal?: AbortSignal,
): Promise<T> {
  if (signal?.aborted) throw new DOMException("查詢已取消。", "AbortError");
  // 外部取消與逾時都會中止 fetch，但畫面需要分辨兩者的原因。
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener("abort", cancel, { once: true });
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, requestTimeoutMs);

  try {
    let response: Response;
    try {
      response = await fetch(path, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
    } catch {
      throw new Error("無法連線到 API，請確認本地後端已啟動。");
    }
    if (!response.ok) {
      const hint = httpErrorMessage(response.status);
      throw new Error(`${hint}（HTTP ${response.status}）`);
    }
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new Error(formatError);
    }
    if (!valid(body)) throw new Error(formatError);
    return body as T;
  } catch (error) {
    if (signal?.aborted) throw new DOMException("查詢已取消。", "AbortError");
    if (timedOut) throw new Error("API 查詢逾時，請確認後端狀態後重試。");
    throw error;
  } finally {
    // 無論成功、失敗或取消，都移除計時器與監聽，避免請求結束後仍觸發。
    clearTimeout(timeout);
    signal?.removeEventListener("abort", cancel);
  }
}

export function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return request(
    "/health",
    (value) =>
      isObject(value) &&
      value.status === "ok" &&
      typeof value.utcNow === "string",
    signal,
  );
}

export function getSources(signal?: AbortSignal): Promise<FareSource[]> {
  return request(
    "/api/sources",
    (value) => Array.isArray(value) && value.every(isSource),
    signal,
  );
}

export function getFares(
  filters: FareFilters = {},
  signal?: AbortSignal,
): Promise<FaresResponse> {
  const params = new URLSearchParams();
  // 只送出已支援的條件，避免把表單內的其他欄位或管理資訊送到後端。
  const keys: (keyof FareFilters)[] = [
    "origin",
    "destination",
    "departureFrom",
    "departureTo",
    "returnDate",
    "maxPrice",
    "limit",
  ];
  for (const key of keys) {
    const value = filters[key];
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const query = params.size ? `?${params}` : "";
  return request(
    `/api/fares${query}`,
    (value) =>
      hasFares(value) &&
      value.currency === "TWD" &&
      value.priceKind === "publishedFromPrice" &&
      value.availability === "unverified" &&
      typeof value.notice === "string" &&
      isNumber(value.limit),
    signal,
  );
}

export async function getFareHistory(
  offerKey: string,
  limit = 100,
  signal?: AbortSignal,
): Promise<FareHistoryResponse> {
  if (!offerKeyPattern.test(offerKey)) throw new Error("票價識別碼不正確。");
  return request(
    `/api/fares/${offerKey}/history?limit=${encodeURIComponent(limit)}`,
    (value) =>
      hasFares(value) &&
      value.offerKey === offerKey &&
      value.items.every((item) => item.offerKey === offerKey),
    signal,
  );
}

export function getCrawls(
  limit = 20,
  signal?: AbortSignal,
): Promise<CrawlRun[]> {
  return request(
    `/api/crawls?limit=${encodeURIComponent(limit)}`,
    (value) => Array.isArray(value) && value.every(isCrawl),
    signal,
  );
}
