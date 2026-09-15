<script setup lang="ts">
import FlightResults from "../components/FlightResults.vue";
import FlightSearchForm from "../components/FlightSearchForm.vue";
import { useFlightSearch } from "../composables/useFlightSearch";
import { searchMockFlights } from "../data/mockFlights";

// 首頁只負責組合元件；搜尋狀態與流程交由 composable 統一管理。
const { sortedOffers, loading, error, hasSearched, sortOption, search } =
  useFlightSearch(searchMockFlights);
</script>

<template>
  <div class="home-page">
    <header class="site-header page-shell">
      <RouterLink class="brand" to="/" aria-label="Toki Tabi 首頁">
        <img
          class="brand__mark"
          src="/toki-tabi-icon.svg"
          width="42"
          height="42"
          alt=""
        />
        <span>
          <strong>TOKI TABI</strong>
          <small>台日航班探索</small>
        </span>
      </RouterLink>
      <span class="route-label">台灣 ↔ 日本</span>
    </header>

    <section class="hero-section">
      <div class="page-shell hero-grid">
        <div class="hero-copy">
          <p class="eyebrow">TAIWAN ↔ JAPAN</p>
          <h1>找到下一趟<br />剛剛好的旅程</h1>
          <p class="hero-description">
            從台灣出發，也能從日本回程。比較時段、價格和飛行時間，快速整理適合你的航班選擇。
          </p>
        </div>
        <div class="hero-stamp" aria-hidden="true">
          <span>台</span>
          <i></i>
          <span>日</span>
        </div>
      </div>
    </section>

    <section class="search-section page-shell" aria-labelledby="search-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">PLAN YOUR FLIGHT</p>
          <h2 id="search-title">搜尋台日航班</h2>
        </div>
        <p class="data-notice">
          <span aria-hidden="true">i</span>
          展示資料，非即時票價，不提供訂票。
        </p>
      </div>

      <FlightSearchForm :loading="loading" @submit="search" />
    </section>

    <div class="page-shell">
      <FlightResults
        :offers="sortedOffers"
        :loading="loading"
        :error="error"
        :has-searched="hasSearched"
        :sort-option="sortOption"
        @update:sort-option="sortOption = $event"
      />
    </div>
  </div>
</template>

<style scoped>
.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 86px;
  border-bottom: 1px solid rgba(19, 42, 56, 0.12);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: inherit;
  text-decoration: none;
}

.brand__mark {
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  border-radius: 10px;
  object-fit: cover;
}

.brand > span:last-child {
  display: grid;
  gap: 1px;
}

.brand strong {
  font-size: 14px;
  letter-spacing: 0.13em;
}

.brand small {
  color: var(--ink-soft);
  font-size: 12px;
}

.route-label {
  color: var(--ink-soft);
  font-size: 14px;
  letter-spacing: 0.06em;
  font-weight: 700;
}

.hero-section {
  padding: 56px 0 48px;
  overflow: hidden;
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 240px;
  align-items: center;
  gap: 64px;
}

.eyebrow {
  color: var(--teal);
  /* 固定英文小標的字型，避免系統字型讓相同字重呈現得過細。 */
  font-family: Arial, "Helvetica Neue", sans-serif;
  font-size: 12px;
  font-weight: 800;
  font-synthesis: weight;
  letter-spacing: 0.2em;
}

.hero-copy h1 {
  margin-top: 18px;
  font-size: clamp(2.25rem, 5vw, 4rem);
  font-weight: 760;
  letter-spacing: -0.04em;
  line-height: 1.1;
}

.hero-description {
  max-width: 660px;
  margin-top: 24px;
  color: var(--ink-soft);
  font-size: clamp(1rem, 1.6vw, 1.2rem);
  line-height: 1.7;
}

.hero-stamp {
  position: relative;
  display: grid;
  width: 240px;
  height: 240px;
  grid-template-columns: 1fr 1fr;
  place-items: center;
  justify-self: end;
  border: 1px solid rgba(20, 108, 112, 0.28);
  border-radius: 50%;
  color: var(--teal);
  font-size: 48px;
  font-weight: 800;
  transform: rotate(-6deg);
}

.hero-stamp::before,
.hero-stamp::after {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #eb6545;
  content: "";
}

.hero-stamp::before {
  top: 24px;
}

.hero-stamp::after {
  bottom: 24px;
}

.hero-stamp i {
  position: absolute;
  width: 52px;
  height: 1px;
  background: var(--teal);
}

.hero-stamp i::after {
  position: absolute;
  right: 0;
  width: 8px;
  height: 8px;
  border-top: 1px solid var(--teal);
  border-right: 1px solid var(--teal);
  content: "";
  transform: translateY(-4px) rotate(45deg);
}

.section-heading .eyebrow {
  margin-bottom: 7px;
}

.data-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ink-soft);
  font-size: 13px;
}

.data-notice span {
  display: grid;
  width: 20px;
  height: 20px;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 50%;
  color: var(--teal);
  font-weight: 800;
}

@media (max-width: 900px) {
  .hero-grid {
    grid-template-columns: minmax(0, 1fr) 180px;
    gap: 30px;
  }

  .hero-stamp {
    width: 170px;
    height: 170px;
    font-size: 36px;
  }
}

@media (max-width: 760px) {
  .site-header {
    min-height: 74px;
  }

  .hero-section {
    padding: 32px 0 28px;
  }

  .hero-grid {
    display: block;
  }

  .hero-stamp {
    display: none;
  }

  .hero-copy h1 {
    font-size: clamp(2rem, 7vw, 2.75rem);
  }

  .hero-description {
    margin-top: 14px;
    font-size: 1rem;
  }

  .data-notice {
    align-self: flex-start;
  }
}
</style>
