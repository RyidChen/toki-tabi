// 對應 travel-db 的公開參考票價，與展示用 FlightOffer 分開。
export interface FareObservation {
  sourceId: string;
  airlineCode: string;
  airlineName: string;
  origin: string;
  destination: string;
  departureDate: string;
  /** 單程票價沒有回程日期。 */
  returnDate: string | null;
  price: number;
  currency: "TWD";
  cabin: string;
  sourceUrl: string;
  /** 官網時間原文；可能沒有時區，不能直接當成 UTC 或台灣時間。 */
  sourceLastSeen: string | null;
  /** 本服務擷取資料的時間，與官網更新時間不同。 */
  observedAt: string;
  offerKey: string;
  /** 僅在來源時間含可確認的時區時提供。 */
  sourceObservedAt: string | null;
  /** 超過時效或無法確認來源時間時為 true，不代表已證實售罄。 */
  isStale: boolean;
  tripType: "oneWay" | "roundTrip";
  priceKind: "publishedFromPrice";
  availability: "unverified";
  priceScope: "unknown" | "perPerson";
  /** false 是未稅；null 是未知，兩者不可混用。 */
  taxesIncluded: boolean | null;
  checkedBaggageKg: number | null;
  flightNumber: string | null;
  stops: number | null;
}

export interface FareFilters {
  origin?: string;
  destination?: string;
  departureFrom?: string;
  departureTo?: string;
  returnDate?: string;
  maxPrice?: number;
  limit?: number;
}

export interface FaresResponse {
  currency: "TWD";
  priceKind: "publishedFromPrice";
  availability: "unverified";
  notice: string;
  count: number;
  limit: number;
  items: FareObservation[];
}

export interface FareHistoryResponse {
  offerKey: string;
  count: number;
  items: FareObservation[];
}

export interface CrawlRun {
  id: number;
  sourceId: string;
  status: "succeeded" | "failed";
  startedAt: string;
  completedAt: string;
  fareCount: number;
  error: string | null;
}

export interface FareSource {
  id: string;
  name: string;
  origin: string;
  /** 星宇是機場代碼；虎航來源群組以 JP 表示日本。票價本身仍用機場代碼。 */
  destination: string;
  url: string;
  priceKind: "publishedFromPrice";
  availability: "unverified";
  /** 未知快取時數用 null，不能解讀成即時資料或零小時。 */
  sourceCacheWindowHours: number | null;
  coverage: string;
  lastRun: CrawlRun | null;
  lastSuccessfulRun: CrawlRun | null;
}

export interface HealthResponse {
  status: "ok";
  utcNow: string;
}
