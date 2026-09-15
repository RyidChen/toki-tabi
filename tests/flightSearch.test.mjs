import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createServer } from "vite";

// 沿用 Vite 載入 TypeScript，不另外安裝測試框架或轉譯工具。
const server = await createServer({
  configFile: false,
  server: { middlewareMode: true, watch: null },
});
after(() => server.close());

const { validateCriteria, filterOffers, sortOffers } =
  await server.ssrLoadModule("/src/utils/flightSearch.ts");
const { useFlightSearch } =
  await server.ssrLoadModule("/src/composables/useFlightSearch.ts");
const { searchMockFlights } =
  await server.ssrLoadModule("/src/data/mockFlights.ts");

const criteria = {
  tripType: "roundTrip",
  origin: "TPE",
  destination: "NRT",
  departureDate: "2026-10-01",
  returnDate: "2026-10-08",
  adults: 1,
  directOnly: false,
};
const outbound = {
  origin: "TPE",
  destination: "NRT",
  departureAt: "2026-10-01T08:00:00+08:00",
  arrivalAt: "2026-10-01T12:00:00+09:00",
  durationMinutes: 180,
  stops: 0,
};
const offer = {
  id: "test-flight",
  airlineCode: "IT",
  airlineName: "台灣虎航",
  priceTwd: 5280,
  outbound,
  inbound: {
    ...outbound,
    origin: "NRT",
    destination: "TPE",
    departureAt: "2026-10-08T16:00:00+09:00",
    arrivalAt: "2026-10-08T18:00:00+08:00",
  },
};

test("成人數必須是 1 到 9 的整數", () => {
  for (const adults of [0, 10, 1.5, NaN, ""]) {
    assert.ok(validateCriteria({ ...criteria, adults }, "2026-09-14").adults);
  }
  assert.deepEqual(validateCriteria(criteria, "2026-09-14"), {});
});

test("日期必填且必須存在，回程不能早於去程", () => {
  for (const departureDate of ["", "2026-02-30", "not-a-date"]) {
    const errors = validateCriteria({ ...criteria, departureDate }, "2026-01-01");
    assert.ok(errors.departureDate);
  }
  for (const returnDate of [undefined, "2026-09-30", "2026-10-99"]) {
    const errors = validateCriteria({ ...criteria, returnDate }, "2026-09-14");
    assert.ok(errors.returnDate);
  }
  const oneWay = { ...criteria, tripType: "oneWay", returnDate: undefined };
  assert.deepEqual(validateCriteria(oneWay, "2026-09-14"), {});
});

test("預設以本地今天驗證，凌晨不能選昨天", (context) => {
  context.mock.timers.enable({
    apis: ["Date"],
    now: new Date("2026-09-14T01:00:00+08:00"),
  });
  const previousTimezone = process.env.TZ;
  process.env.TZ = "Asia/Taipei";
  try {
    const errors = validateCriteria({ ...criteria, departureDate: "2026-09-13" });
    assert.ok(errors.departureDate);
  } finally {
    if (previousTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = previousTimezone;
  }
});

test("直飛來回行程必須在兩個方向都沒有轉機", () => {
  const returnWithStop = { ...offer, inbound: { ...offer.inbound, stops: 1 } };
  const directOnly = { ...criteria, directOnly: true };
  assert.deepEqual(filterOffers([returnWithStop], directOnly), []);
  assert.deepEqual(filterOffers([offer], directOnly), [offer]);
});

test("篩選排除不同航線，來回必須有回程", () => {
  const oneWay = { ...offer, inbound: undefined };
  assert.deepEqual(filterOffers([oneWay], criteria), []);
  assert.deepEqual(
    filterOffers([oneWay], { ...criteria, tripType: "oneWay" }),
    [oneWay],
  );
  assert.deepEqual(filterOffers([offer], { ...criteria, destination: "KIX" }), []);
});

test("排序不改動原資料，價格、去程時間與起飛時刻各自有效", () => {
  const second = {
    ...offer,
    id: "second",
    priceTwd: 4000,
    outbound: {
      ...outbound,
      durationMinutes: 200,
      departureAt: "2026-10-01T06:00:00+08:00",
    },
  };
  const offers = [offer, second];
  assert.deepEqual(sortOffers(offers, "price"), [second, offer]);
  assert.deepEqual(sortOffers(offers, "duration"), [offer, second]);
  assert.deepEqual(sortOffers(offers, "departure"), [second, offer]);
  assert.deepEqual(offers, [offer, second]);
});

test("模擬搜尋沿用選定日期，台日時差不改變實際飛行時間", async () => {
  const [result] = await searchMockFlights(criteria);
  assert.equal(result.outbound.departureAt, "2026-10-01T06:30:00+08:00");
  assert.equal(result.outbound.arrivalAt, "2026-10-01T10:40:00+09:00");
  assert.equal(result.inbound.departureAt, "2026-10-08T16:00:00+09:00");
  assert.equal(result.inbound.arrivalAt, "2026-10-08T18:20:00+08:00");
  const reverse = await searchMockFlights({
    ...criteria,
    origin: "NRT",
    destination: "TPE",
    tripType: "oneWay",
  });
  assert.equal(reverse[0].outbound.arrivalAt, "2026-10-01T11:55:00+08:00");
  assert.equal(reverse[0].inbound, undefined);
});

test("搜尋失敗會結束載入，下次搜尋能恢復", async (context) => {
  context.mock.method(console, "error", () => {});
  let shouldFail = true;
  const state = useFlightSearch(async () => {
    if (shouldFail) throw new Error("Test search failure");
    return [offer];
  });
  await state.search(criteria);
  assert.equal(state.loading.value, false);
  assert.equal(state.hasSearched.value, true);
  assert.ok(state.error.value);
  assert.deepEqual(state.offers.value, []);
  shouldFail = false;
  await state.search(criteria);
  assert.equal(state.error.value, "");
  assert.equal(state.offers.value[0].id, "test-flight");
});
