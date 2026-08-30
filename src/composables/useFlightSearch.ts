import { computed, ref } from "vue";
import type {
  FlightOffer,
  SearchCriteria,
  SearchFlights,
  SortOption,
} from "../types/flight";
import { sortOffers } from "../utils/flightSearch";

export function useFlightSearch(searchFlights: SearchFlights) {
  const offers = ref<FlightOffer[]>([]);
  const loading = ref(false);
  const error = ref("");
  const hasSearched = ref(false);
  const sortOption = ref<SortOption>("price");
  const sortedOffers = computed(() =>
    sortOffers(offers.value, sortOption.value),
  );

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
