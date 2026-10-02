import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createServer } from "vite";

const server = await createServer({
  configFile: false,
  server: { middlewareMode: true, watch: null, ws: false },
});
after(() => server.close());
const { getHealth, getSources, getFares, getFareHistory, getCrawls } =
  await server.ssrLoadModule("/src/api/travelApi.ts");

const offerKey = "a".repeat(64);
const fare = {
  sourceId: "starlux-tpe-nrt",
  airlineCode: "JX",
  airlineName: "STARLUX Airlines",
  origin: "TPE",
  destination: "NRT",
  departureDate: "2026-10-01",
  returnDate: "2026-10-08",
  price: 11414,
  currency: "TWD",
  cabin: "ECONOMY",
  sourceUrl: "https://www.starlux-airlines.com/",
  sourceLastSeen: null,
  observedAt: "2026-09-22T09:00:00+00:00",
  offerKey,
  sourceObservedAt: null,
  isStale: true,
  tripType: "roundTrip",
  priceKind: "publishedFromPrice",
  availability: "unverified",
  priceScope: "unknown",
  taxesIncluded: null,
  checkedBaggageKg: null,
  flightNumber: null,
  stops: null,
};
const faresResponse = {
  currency: "TWD",
  priceKind: "publishedFromPrice",
  availability: "unverified",
  notice: "官網公開參考起價，人數、含稅與行李未確認。",
  count: 1,
  limit: 100,
  items: [fare],
};
const json = (value) =>
  new Response(JSON.stringify(value), {
    headers: { "Content-Type": "application/json" },
  });

test("票價保留來源金額與所有未知欄位，不轉換成模擬航班", async (context) => {
  context.mock.method(globalThis, "fetch", async () => json(faresResponse));
  assert.deepEqual(await getFares(), faresResponse);
});

test("虎航每人未稅單程價可查詢及讀取歷史，仍拒絕未知計價類型", async (context) => {
  const tigerFare = {
    ...fare,
    sourceId: "tigerair-tpe-japan",
    airlineCode: "IT",
    airlineName: "Tigerair Taiwan",
    returnDate: null,
    tripType: "oneWay",
    priceScope: "perPerson",
    taxesIncluded: false,
    cabin: "UNKNOWN",
    sourceObservedAt: null,
    sourceLastSeen: "2026-09-22 18:31:49",
  };
  const response = { ...faresResponse, items: [tigerFare] };
  const history = { offerKey, count: 1, items: [tigerFare] };
  const fetchMock = context.mock.method(globalThis, "fetch", async (url) =>
    json(url.includes("/history") ? history : response),
  );
  assert.deepEqual(await getFares(), response);
  assert.deepEqual(await getFareHistory(offerKey), history);
  fetchMock.mock.mockImplementation(async () =>
    json({
      ...response,
      items: [{ ...tigerFare, priceScope: "unexpected" }],
    }),
  );
  await assert.rejects(getFares(), /資料格式/);
});

test("來源允許未知快取時數，保留星宇數字時數並拒絕錯誤型別", async (context) => {
  const source = {
    id: "starlux-tpe-nrt",
    name: "星宇航空 台北－東京",
    origin: "TPE",
    destination: "NRT",
    url: "https://www.starlux-airlines.com/",
    coverage: "Published dated fares",
    priceKind: "publishedFromPrice",
    availability: "unverified",
    sourceCacheWindowHours: 48,
    lastRun: null,
    lastSuccessfulRun: null,
  };
  const sources = [
    source,
    {
      ...source,
      id: "tigerair-tpe-japan",
      name: "台灣虎航 桃園－日本",
      destination: "JP",
      destinationKind: "country",
      url: "https://www.tigerairtw.com/",
      sourceCacheWindowHours: null,
    },
  ];
  const fetchMock = context.mock.method(globalThis, "fetch", async () =>
    json(sources),
  );
  assert.deepEqual(await getSources(), sources);
  for (const invalid of ["48", undefined]) {
    fetchMock.mock.mockImplementation(async () =>
      json([{ ...source, sourceCacheWindowHours: invalid }]),
    );
    await assert.rejects(getSources(), /資料格式/);
  }
});

test("只傳後端支援的篩選，省略空值並安全編碼", async (context) => {
  let requestedUrl;
  context.mock.method(globalThis, "fetch", async (url, options) => {
    requestedUrl = url;
    assert.equal(options.method, "GET");
    assert.equal(options.headers.Accept, "application/json");
    assert.equal(options.headers["X-Admin-Key"], undefined);
    return json(faresResponse);
  });
  await getFares({
    origin: "TPE",
    destination: "NRT&limit=500",
    departureFrom: "2026-10-01",
    departureTo: "2026-10-31",
    returnDate: "",
    maxPrice: 12000,
    limit: 10,
    adults: 2,
  });
  const url = new URL(requestedUrl, "http://localhost");
  assert.equal(url.pathname, "/api/fares");
  assert.deepEqual(Object.fromEntries(url.searchParams), {
    origin: "TPE",
    destination: "NRT&limit=500",
    departureFrom: "2026-10-01",
    departureTo: "2026-10-31",
    maxPrice: "12000",
    limit: "10",
  });
});

test("健康檢查、來源、擷取紀錄與票價歷史使用各自端點", async (context) => {
  const health = { status: "ok", utcNow: fare.observedAt };
  const history = { offerKey, count: 1, items: [fare] };
  const replies = new Map([
    ["/health", health],
    ["/api/sources", []],
    ["/api/crawls?limit=5", []],
    [`/api/fares/${offerKey}/history?limit=20`, history],
  ]);
  context.mock.method(globalThis, "fetch", async (url) => {
    assert.ok(replies.has(url), `Unexpected URL: ${url}`);
    return json(replies.get(url));
  });
  assert.deepEqual(await getHealth(), health);
  assert.deepEqual(await getSources(), []);
  assert.deepEqual(await getCrawls(5), []);
  assert.deepEqual(await getFareHistory(offerKey, 20), history);
});

test("錯誤 HTTP 狀態與斷線會回報錯誤，不補上假票價", async (context) => {
  const fetchMock = context.mock.method(
    globalThis,
    "fetch",
    async () => new Response("<html>server error</html>", { status: 502 }),
  );
  await assert.rejects(getFares(), /HTTP 502/);
  fetchMock.mock.mockImplementation(async () => {
    throw new TypeError("Failed to fetch");
  });
  await assert.rejects(getFares(), /無法連線/);
});

test("錯誤 JSON、非 API 網頁及價格格式錯誤不能當成成功結果", async (context) => {
  const fetchMock = context.mock.method(
    globalThis,
    "fetch",
    async () => new Response("<!doctype html><html>Vite fallback</html>"),
  );
  await assert.rejects(getFares(), /資料格式/);
  fetchMock.mock.mockImplementation(async () =>
    json({ ...faresResponse, items: [{ ...fare, price: "11414" }] }),
  );
  await assert.rejects(getFares(), /資料格式/);
  fetchMock.mock.mockImplementation(async () => json({}));
  await assert.rejects(getFares(), /資料格式/);
});

test("歷史查詢拒絕不合法識別碼與其他票價的回應", async (context) => {
  const fetchMock = context.mock.method(globalThis, "fetch", async () =>
    json({ offerKey: "b".repeat(64), count: 1, items: [fare] }),
  );
  await assert.rejects(getFareHistory("../crawls"), /識別碼/);
  assert.equal(fetchMock.mock.callCount(), 0);
  await assert.rejects(getFareHistory(offerKey), /資料格式/);
});

test("可以中止查詢，保留 AbortError 供畫面忽略已取消請求", async (context) => {
  context.mock.method(
    globalThis,
    "fetch",
    async (_url, { signal }) =>
      new Promise((_resolve, reject) =>
        signal.addEventListener("abort", () => reject(signal.reason), {
          once: true,
        }),
      ),
  );
  const controller = new AbortController();
  const result = getFares({}, controller.signal);
  controller.abort();
  await assert.rejects(result, { name: "AbortError" });
});

test("超過十秒會停止等待，回報可辨識的逾時訊息", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  let requestSignal;
  context.mock.method(globalThis, "fetch", async (_url, { signal }) => {
    requestSignal = signal;
    return new Promise((_resolve, reject) =>
      signal.addEventListener("abort", () => reject(signal.reason), {
        once: true,
      }),
    );
  });
  const result = getFares();
  context.mock.timers.tick(10000);
  await assert.rejects(result, /逾時/);
  assert.equal(requestSignal.aborted, true);
});
