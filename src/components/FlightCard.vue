<script setup lang="ts">
import { computed } from "vue";
import type { FlightOffer } from "../types/flight";

const props = defineProps<{
  offer: FlightOffer;
  isCheapest: boolean;
  isFastest: boolean;
}>();

const segments = computed(() =>
  props.offer.inbound
    ? [props.offer.outbound, props.offer.inbound]
    : [props.offer.outbound],
);

const currency = new Intl.NumberFormat("zh-TW", {
  maximumFractionDigits: 0,
});

function formatTime(value: string): string {
  return value.slice(11, 16);
}

function formatDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${year}/${month}/${day}`;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return `${hours} 小時 ${remaining} 分`;
}

function stopLabel(stops: number): string {
  return stops === 0 ? "直飛" : `轉機 ${stops} 次`;
}
</script>

<template>
  <article class="flight-card">
    <div class="flight-card__carrier">
      <span class="carrier-mark" aria-hidden="true">{{
        offer.airlineCode
      }}</span>
      <div>
        <strong>{{ offer.airlineName }}</strong>
        <span>{{ offer.airlineCode }}</span>
      </div>
    </div>

    <div class="flight-card__badges" aria-label="航班特色">
      <span v-if="isCheapest" class="badge badge--deal">最低價</span>
      <span v-if="isFastest" class="badge badge--fast">去程最短</span>
    </div>

    <div class="flight-card__segments">
      <div
        v-for="(segment, index) in segments"
        :key="index"
        class="flight-segment"
      >
        <p class="flight-card__meta">
          {{ index === 0 ? "去程" : "回程" }} ·
          {{ formatDate(segment.departureAt) }}
        </p>
        <div class="flight-card__journey">
          <div class="time-block">
            <strong>{{ formatTime(segment.departureAt) }}</strong>
            <span>{{ segment.origin }}</span>
          </div>
          <div class="route-line">
            <span>{{ formatDuration(segment.durationMinutes) }}</span>
            <span class="route-line__track" aria-hidden="true"></span>
            <strong>{{ stopLabel(segment.stops) }}</strong>
          </div>
          <div class="time-block time-block--end">
            <strong>{{ formatTime(segment.arrivalAt) }}</strong>
            <span>{{ segment.destination }}</span>
            <small
              v-if="
                segment.arrivalAt.slice(0, 10) !==
                segment.departureAt.slice(0, 10)
              "
            >
              {{ formatDate(segment.arrivalAt) }} 抵達
            </small>
          </div>
        </div>
      </div>
    </div>

    <div class="flight-card__price">
      <span>每位成人 · {{ offer.inbound ? "來回" : "單程" }}</span>
      <strong>NT$ {{ currency.format(offer.priceTwd) }}</strong>
    </div>
  </article>
</template>

<style scoped>
.flight-card {
  display: grid;
  grid-template-columns: 160px minmax(280px, 1fr) 180px;
  grid-template-areas:
    "carrier segments price"
    "badges segments price";
  grid-template-rows: auto 1fr;
  align-items: start;
  gap: 14px 28px;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.flight-card__carrier {
  display: flex;
  grid-area: carrier;
  align-items: center;
  gap: 12px;
}

.carrier-mark {
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 6px;
  background: var(--ink);
  color: white;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.06em;
}

.flight-card__carrier div {
  display: grid;
  gap: 3px;
}

.flight-card__carrier strong {
  font-size: 14px;
}

.flight-card__carrier div span {
  color: var(--ink-soft);
  font-size: 12px;
}

.flight-card__badges {
  display: flex;
  grid-area: badges;
  flex-wrap: wrap;
  gap: 6px;
}

.badge {
  display: inline-flex;
  min-height: 26px;
  align-items: center;
  padding: 0 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.badge--deal {
  background: #fff0e9;
  color: #a23c24;
}

.badge--fast {
  background: var(--teal-soft);
  color: #0c5b5f;
}

.flight-card__segments {
  display: grid;
  grid-area: segments;
  gap: 18px;
  min-width: 0;
}

.flight-segment + .flight-segment {
  padding-top: 16px;
  border-top: 1px solid var(--line);
}

.flight-card__journey {
  display: grid;
  grid-template-columns: minmax(66px, 1fr) minmax(100px, 1.4fr) minmax(
      66px,
      1fr
    );
  align-items: center;
  gap: 16px;
}

.time-block {
  display: grid;
  gap: 4px;
}

.time-block strong {
  font-size: 24px;
  font-variant-numeric: tabular-nums;
}

.time-block small,
.time-block span,
.route-line span,
.flight-card__meta {
  color: var(--ink-soft);
  font-size: 12px;
}

.time-block--end {
  text-align: right;
}

.route-line {
  display: grid;
  gap: 5px;
  text-align: center;
}

.route-line__track {
  position: relative;
  height: 1px;
  background: var(--line);
}

.route-line__track::before,
.route-line__track::after {
  position: absolute;
  top: -3px;
  width: 7px;
  height: 7px;
  border: 1px solid var(--teal);
  border-radius: 50%;
  background: white;
  content: "";
}

.route-line__track::before {
  left: 0;
}

.route-line__track::after {
  right: 0;
}

.route-line strong {
  color: var(--teal);
  font-size: 12px;
  font-weight: bolder;
}

.flight-card__meta {
  margin-bottom: 10px;
}

.flight-card__price {
  display: grid;
  grid-area: price;
  align-self: stretch;
  place-content: center end;
  border-left: 1px solid var(--line);
  text-align: right;
}

.flight-card__price span {
  color: var(--ink-soft);
  font-size: 12px;
}

.flight-card__price strong {
  margin-top: 5px;
  color: var(--coral-dark);
  font-size: 23px;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 900px) {
  .flight-card {
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      "carrier badges"
      "segments segments"
      "price price";
  }

  .flight-card__price {
    border-left: 0;
  }
}

@media (max-width: 760px) {
  .flight-card {
    display: flex;
    align-items: stretch;
    flex-direction: column;
    gap: 18px;
    padding: 20px;
  }

  .flight-card__badges {
    justify-content: flex-start;
  }

  .flight-card__journey {
    grid-template-columns: minmax(0, 1fr) minmax(90px, 1.4fr) minmax(0, 1fr);
    gap: 10px;
  }

  .time-block strong {
    font-size: 21px;
  }

  .flight-card__price {
    display: flex;
    align-items: end;
    justify-content: space-between;
    padding-top: 16px;
    border-top: 1px solid var(--line);
    text-align: left;
  }
}
</style>
