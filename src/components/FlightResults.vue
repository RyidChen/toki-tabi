<script setup lang="ts">
import { computed } from "vue";
import type { FlightOffer, SortOption } from "../types/flight";
import FlightCard from "./FlightCard.vue";
import FlightFilters from "./FlightFilters.vue";

const props = defineProps<{
  offers: FlightOffer[];
  loading: boolean;
  error: string;
  hasSearched: boolean;
  sortOption: SortOption;
}>();

const emit = defineEmits<{
  "update:sortOption": [value: SortOption];
}>();

const cheapestPrice = computed(() =>
  Math.min(...props.offers.map((offer) => offer.priceTwd)),
);
const fastestDuration = computed(() =>
  Math.min(...props.offers.map((offer) => offer.outbound.durationMinutes)),
);
</script>

<template>
  <section
    class="results-section"
    aria-live="polite"
    aria-labelledby="results-title"
  >
    <div v-if="loading" class="state-card" role="status">
      <span class="loading-mark" aria-hidden="true"></span>
      <div>
        <h2 id="results-title">正在尋找航班</h2>
        <p>整理不同時段和價格，馬上就好。</p>
      </div>
    </div>

    <div v-else-if="error" class="state-card state-card--error" role="alert">
      <span class="state-icon" aria-hidden="true">!</span>
      <div>
        <h2 id="results-title">搜尋暫時中斷</h2>
        <p>{{ error }}</p>
      </div>
    </div>

    <div v-else-if="!hasSearched" class="state-card state-card--initial">
      <span class="state-icon" aria-hidden="true">↗</span>
      <div>
        <h2 id="results-title">從搜尋開始規劃下一趟旅程</h2>
        <p>選擇台灣或日本作為出發地，我們會整理適合的展示航班。</p>
      </div>
    </div>

    <div v-else-if="offers.length === 0" class="state-card">
      <span class="state-icon" aria-hidden="true">—</span>
      <div>
        <h2 id="results-title">找不到符合條件的航班</h2>
        <p>試著更換日期、目的地，或取消「僅顯示直飛」。</p>
      </div>
    </div>

    <template v-else>
      <div class="results-heading">
        <div>
          <p class="eyebrow">SEARCH RESULTS</p>
          <h2 id="results-title">找到 {{ offers.length }} 個航班選擇</h2>
        </div>
        <FlightFilters
          :model-value="sortOption"
          @update:model-value="emit('update:sortOption', $event)"
        />
      </div>

      <div class="results-list">
        <FlightCard
          v-for="offer in offers"
          :key="offer.id"
          :offer="offer"
          :is-cheapest="offer.priceTwd === cheapestPrice"
          :is-fastest="offer.outbound.durationMinutes === fastestDuration"
        />
      </div>
    </template>
  </section>
</template>
