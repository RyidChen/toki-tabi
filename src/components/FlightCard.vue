<script setup lang="ts">
import type { FlightOffer, FlightSegment } from "../types/flight";

defineProps<{
  offer: FlightOffer;
  isCheapest: boolean;
  isFastest: boolean;
}>();

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

function segmentLabel(segment: FlightSegment): string {
  return `${segment.origin} 至 ${segment.destination}`;
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
      <span v-if="isCheapest" class="badge badge--deal">✓ 最便宜</span>
      <span v-if="isFastest" class="badge badge--fast">✓ 最快</span>
    </div>

    <div class="flight-card__journey">
      <div class="time-block">
        <strong>{{ formatTime(offer.outbound.departureAt) }}</strong>
        <span>{{ offer.outbound.origin }}</span>
      </div>
      <div class="route-line">
        <span>{{ formatDuration(offer.outbound.durationMinutes) }}</span>
        <span class="route-line__track" aria-hidden="true"></span>
        <strong>{{ stopLabel(offer.outbound.stops) }}</strong>
      </div>
      <div class="time-block time-block--end">
        <strong>{{ formatTime(offer.outbound.arrivalAt) }}</strong>
        <span>{{ offer.outbound.destination }}</span>
      </div>
    </div>

    <div class="flight-card__meta">
      <span>{{ formatDate(offer.outbound.departureAt) }}</span>
      <span>{{ segmentLabel(offer.outbound) }}</span>
      <span v-if="offer.inbound">含回程</span>
      <span v-else>單程</span>
    </div>

    <div class="flight-card__price">
      <span>每位成人・含稅</span>
      <strong>NT${{ currency.format(offer.priceTwd) }}</strong>
    </div>
  </article>
</template>
