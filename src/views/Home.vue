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
      <a class="brand" href="/" aria-label="Toki Tabi 首頁">
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
      </a>
      <span class="demo-label">作品集專案</span>
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
          作品展示資料・非即時票價(目前未串接api)
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
