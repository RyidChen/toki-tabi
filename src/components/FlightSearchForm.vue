<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from "vue";
import { JAPAN_AIRPORTS, TAIWAN_AIRPORTS, getAirport } from "../data/airports";
import type { AirportCode, SearchCriteria } from "../types/flight";
import { validateCriteria } from "../utils/flightSearch";

withDefaults(defineProps<{ loading?: boolean }>(), { loading: false });

const emit = defineEmits<{
  submit: [criteria: SearchCriteria];
}>();

function dateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return dateInputValue(date);
}

const today = dateInputValue(new Date());
const form = reactive<SearchCriteria>({
  tripType: "roundTrip",
  origin: "TPE",
  destination: "NRT",
  departureDate: daysFromToday(1),
  returnDate: daysFromToday(8),
  adults: 1,
  directOnly: false,
});
const errors = ref<Record<string, string>>({});

const destinationAirports = computed(() =>
  getAirport(form.origin).country === "TW" ? JAPAN_AIRPORTS : TAIWAN_AIRPORTS,
);

watch(
  () => form.origin,
  () => {
    if (
      !destinationAirports.value.some(
        (airport) => airport.code === form.destination,
      )
    ) {
      form.destination = destinationAirports.value[0].code;
    }
    delete errors.value.destination;
  },
);

watch(
  () => form.tripType,
  (tripType) => {
    if (tripType === "oneWay") {
      form.returnDate = undefined;
      delete errors.value.returnDate;
    }
  },
);

function clearError(field: keyof SearchCriteria): void {
  delete errors.value[field];
}

function swapAirports(): void {
  const previousOrigin = form.origin;
  form.origin = form.destination;
  form.destination = previousOrigin;
}

async function submitForm(): Promise<void> {
  errors.value = validateCriteria(form, today);
  const firstInvalidField = Object.keys(errors.value)[0];

  if (firstInvalidField) {
    await nextTick();
    document
      .querySelector<HTMLElement>(`[name="${firstInvalidField}"]`)
      ?.focus();
    return;
  }

  emit("submit", { ...form });
}

function airportLabel(code: AirportCode): string {
  const airport = getAirport(code);
  return `${airport.city} ${airport.name} (${airport.code})`;
}
</script>

<template>
  <form class="search-card" novalidate @submit.prevent="submitForm">
    <fieldset class="trip-type" aria-label="行程類型">
      <legend class="sr-only">行程類型</legend>
      <label class="radio-pill">
        <input
          v-model="form.tripType"
          type="radio"
          name="tripType"
          value="roundTrip"
        />
        來回
      </label>
      <label class="radio-pill">
        <input
          v-model="form.tripType"
          type="radio"
          name="tripType"
          value="oneWay"
        />
        單程
      </label>
    </fieldset>

    <div class="route-fields">
      <label class="field">
        <span>從哪裡出發？</span>
        <select
          v-model="form.origin"
          name="origin"
          @change="clearError('origin')"
        >
          <optgroup label="台灣">
            <option
              v-for="airport in TAIWAN_AIRPORTS"
              :key="airport.code"
              :value="airport.code"
            >
              {{ airportLabel(airport.code) }}
            </option>
          </optgroup>
          <optgroup label="日本">
            <option
              v-for="airport in JAPAN_AIRPORTS"
              :key="airport.code"
              :value="airport.code"
            >
              {{ airportLabel(airport.code) }}
            </option>
          </optgroup>
        </select>
      </label>

      <button
        class="swap-button"
        type="button"
        data-test="swap-airports"
        aria-label="交換出發地和目的地"
        @click="swapAirports"
      >
        <span aria-hidden="true">⇄</span>
      </button>

      <label class="field">
        <span>想飛去哪裡？</span>
        <select
          v-model="form.destination"
          name="destination"
          :aria-describedby="
            errors.destination ? 'destination-error' : undefined
          "
          @change="clearError('destination')"
        >
          <option
            v-for="airport in destinationAirports"
            :key="airport.code"
            :value="airport.code"
          >
            {{ airportLabel(airport.code) }}
          </option>
        </select>
        <small
          v-if="errors.destination"
          id="destination-error"
          class="field-error"
          role="alert"
        >
          {{ errors.destination }}
        </small>
      </label>
    </div>

    <div class="date-fields">
      <label class="field">
        <span>去程日期</span>
        <input
          v-model="form.departureDate"
          name="departureDate"
          type="date"
          :min="today"
          :aria-describedby="
            errors.departureDate ? 'departureDate-error' : undefined
          "
          @input="clearError('departureDate')"
        />
        <small
          v-if="errors.departureDate"
          id="departureDate-error"
          class="field-error"
          role="alert"
        >
          {{ errors.departureDate }}
        </small>
      </label>

      <label v-if="form.tripType === 'roundTrip'" class="field">
        <span>回程日期</span>
        <input
          v-model="form.returnDate"
          name="returnDate"
          type="date"
          :min="form.departureDate"
          :aria-describedby="errors.returnDate ? 'returnDate-error' : undefined"
          @input="clearError('returnDate')"
        />
        <small
          v-if="errors.returnDate"
          id="returnDate-error"
          class="field-error"
          role="alert"
        >
          {{ errors.returnDate }}
        </small>
      </label>

      <label class="field field--compact">
        <span>成人</span>
        <input
          v-model.number="form.adults"
          name="adults"
          type="number"
          min="1"
          max="9"
          :aria-describedby="errors.adults ? 'adults-error' : undefined"
          @input="clearError('adults')"
        />
        <small
          v-if="errors.adults"
          id="adults-error"
          class="field-error"
          role="alert"
        >
          {{ errors.adults }}
        </small>
      </label>
    </div>

    <div class="search-actions">
      <label class="checkbox-field">
        <input v-model="form.directOnly" name="directOnly" type="checkbox" />
        <span>僅顯示直飛</span>
      </label>
      <button class="search-button" type="submit" :disabled="loading">
        {{ loading ? "搜尋中…" : "搜尋航班" }}
      </button>
    </div>
  </form>
</template>
