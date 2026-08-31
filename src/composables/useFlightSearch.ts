import { computed, ref } from "vue";
import type {
  FlightOffer,
  SearchCriteria,
  SearchFlights,
  SortOption,
} from "../types/flight";
import { sortOffers } from "../utils/flightSearch";

// 將資料來源以參數傳入，之後從 mock 改接後端 API 時，畫面端不必跟著修改。
export function useFlightSearch(searchFlights: SearchFlights) {
  const offers = ref<FlightOffer[]>([]);
  const loading = ref(false);
  const error = ref("");
  const hasSearched = ref(false);
  const sortOption = ref<SortOption>("price");

  // 排序結果是由原始航班與排序條件推導而來，因此用 computed 保持自動同步。
  const sortedOffers = computed(() =>
    sortOffers(offers.value, sortOption.value),
  );

  // 集中管理一次搜尋的載入、成功、失敗與完成狀態，避免元件重複處理。
  async function search(criteria: SearchCriteria): Promise<void> {
    loading.value = true;
    error.value = "";

    try {
      offers.value = await searchFlights(criteria);
    } catch (caught) {
      console.error(caught);
      offers.value = [];
      error.value = "目前無法取得航班資料，請稍後再試。";
    } finally {
      // 無論成功或失敗都代表使用者已搜尋過，畫面不應再顯示初始提示。
      hasSearched.value = true;
      loading.value = false;
    }
  }

  return {
    offers,
    sortedOffers,
    loading,
    error,
    hasSearched,
    sortOption,
    search,
  };
}
