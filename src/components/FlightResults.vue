<script setup lang="ts">
import { computed } from "vue";
import type { FlightOffer, SortOption } from "../types/flight";
import FlightCard from "./FlightCard.vue";
import FlightSort from "./FlightSort.vue";

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

// 這兩個 computed 只在有結果時使用，用來標示最低價與飛行時間最短的航班。
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
    <!-- 狀態依優先順序互斥顯示：載入、錯誤、尚未搜尋、無結果、成功結果。 -->
    <div v-if="loading" class="state-card" role="status">
      <span class="loading-mark" aria-hidden="true"></span>
      <div>
        <h2 id="results-title">搜尋中</h2>
        <p>正在讀取航班資料。</p>
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
        <p>
          目前只提供部分航線的展示資料。試著更換機場，或取消「僅顯示直飛」。
        </p>
      </div>
    </div>

    <template v-else>
      <div class="section-heading">
        <div>
          <h2 id="results-title">{{ offers.length }} 筆航班</h2>
          <p class="results-note">
            時間皆為機場當地時間，價格為每位成人的展示票價。
          </p>
        </div>
        <FlightSort
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

<style scoped>
.results-section {
  padding: 36px 0;
}

.results-note {
  margin-top: 6px;
  color: var(--ink-soft);
  font-size: 13px;
  line-height: 1.7;
}

.results-list {
  display: grid;
  gap: 14px;
}

.state-card {
  display: flex;
  min-height: 140px;
  align-items: center;
  gap: 18px;
  padding: 24px 0;
  border-top: 1px solid var(--line);
}

.state-card h2 {
  margin-bottom: 8px;
  font-size: 18px;
  font-weight: 600;
}

.state-card p {
  color: var(--ink-soft);
  line-height: 1.6;
}

.state-card--initial {
  min-height: 180px;
  justify-content: center;
  padding: 32px;
  border: 1px dashed #bac5c5;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.52);
}

.state-card--initial h2 {
  font-weight: 700;
}

.state-icon,
.loading-mark {
  display: grid;
  width: 48px;
  height: 48px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  background: var(--teal-soft);
  color: var(--teal);
  font-size: 20px;
  font-style: normal;
  font-weight: 900;
}

.loading-mark {
  border: 3px solid var(--teal-soft);
  border-top-color: var(--teal);
  background: transparent;
  animation: spin 850ms linear infinite;
}

.state-card--error .state-icon {
  background: #fee9e7;
  color: var(--danger);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 760px) {
  .results-section {
    padding: 28px 0;
  }

  .state-card {
    min-height: 140px;
    align-items: center;
    flex-direction: column;
    text-align: center;
  }

  .state-card--initial {
    min-height: 220px;
    padding: 24px;
  }
}
</style>
