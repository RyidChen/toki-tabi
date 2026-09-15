<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from "vue";
import { JAPAN_AIRPORTS, TAIWAN_AIRPORTS, getAirport } from "../data/airports";
import type { Airport, SearchCriteria } from "../types/flight";
import { dateInputValue } from "../utils/date";
import { validateCriteria } from "../utils/flightSearch";

withDefaults(defineProps<{ loading?: boolean }>(), { loading: false });

const emit = defineEmits<{
  submit: [criteria: SearchCriteria];
}>();

function daysFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return dateInputValue(date);
}

const today = ref(dateInputValue(new Date()));
const formElement = ref<HTMLFormElement | null>(null);

// reactive 適合集中管理多個彼此相關的表單欄位。
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

// 出發地決定目的地清單，確保搜尋一定是台灣與日本之間的航線。
const destinationAirports = computed(() =>
  getAirport(form.origin).country === "TW" ? JAPAN_AIRPORTS : TAIWAN_AIRPORTS,
);

// 切換出發國家後，如果原目的地已不合法，就自動選擇另一國的第一個機場。
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

// 單程不需要回程日期，同時清除先前可能留下的錯誤訊息。
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
  today.value = dateInputValue(new Date());
  errors.value = validateCriteria(form, today.value);
  const firstInvalidField = Object.keys(errors.value)[0];

  if (firstInvalidField) {
    // 等待錯誤訊息更新到 DOM 後，再把焦點移到第一個錯誤欄位。
    await nextTick();
    formElement.value
      ?.querySelector<HTMLElement>(`[name="${firstInvalidField}"]`)
      ?.focus();
    return;
  }

  // 傳出普通物件，避免父元件直接取得並修改表單的 reactive Proxy。
  emit("submit", { ...form });
}

function airportLabel(airport: Airport): string {
  return `${airport.city} ${airport.name} (${airport.code})`;
}
</script>

<template>
  <form
    ref="formElement"
    class="search-card"
    novalidate
    @submit.prevent="submitForm"
  >
    <fieldset class="trip-type" aria-label="行程類型">
      <legend class="sr-only">行程類型</legend>
      <label class="trip-option">
        <input
          v-model="form.tripType"
          type="radio"
          name="tripType"
          value="roundTrip"
        />
        來回
      </label>
      <label class="trip-option">
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
        <span>出發地</span>
        <select
          v-model="form.origin"
          class="form-control"
          name="origin"
          @change="clearError('origin')"
        >
          <optgroup label="台灣">
            <option
              v-for="airport in TAIWAN_AIRPORTS"
              :key="airport.code"
              :value="airport.code"
            >
              {{ airportLabel(airport) }}
            </option>
          </optgroup>
          <optgroup label="日本">
            <option
              v-for="airport in JAPAN_AIRPORTS"
              :key="airport.code"
              :value="airport.code"
            >
              {{ airportLabel(airport) }}
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
        <span>目的地</span>
        <select
          v-model="form.destination"
          class="form-control"
          name="destination"
          :aria-invalid="Boolean(errors.destination)"
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
            {{ airportLabel(airport) }}
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

    <div
      class="date-fields"
      :class="{ 'date-fields--one-way': form.tripType === 'oneWay' }"
    >
      <label class="field">
        <span>去程日期</span>
        <input
          v-model="form.departureDate"
          class="form-control"
          name="departureDate"
          type="date"
          :min="today"
          :aria-invalid="Boolean(errors.departureDate)"
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
          class="form-control"
          name="returnDate"
          type="date"
          :min="form.departureDate"
          :aria-invalid="Boolean(errors.returnDate)"
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
          class="form-control"
          name="adults"
          type="number"
          min="1"
          max="9"
          step="1"
          :aria-invalid="Boolean(errors.adults)"
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

<style scoped>
.search-card {
  display: grid;
  gap: 22px;
  padding: 28px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface);
}

.trip-type {
  display: flex;
  width: fit-content;
  gap: 4px;
  margin: 0;
  padding: 4px;
  border: 0;
  border-radius: 999px;
  background: #edf0ef;
}

.trip-option {
  position: relative;
  display: grid;
  min-width: 76px;
  min-height: 44px;
  place-items: center;
  border-radius: 999px;
  color: var(--ink-soft);
  font-size: 14px;
  font-weight: 750;
  cursor: pointer;
  transition:
    background-color 180ms ease,
    color 180ms ease,
    box-shadow 180ms ease;
}

.trip-option:has(input:checked) {
  background: var(--surface);
  color: var(--ink);
  box-shadow: 0 2px 8px rgba(19, 42, 56, 0.1);
}

.trip-option:has(input:focus-visible) {
  outline: 3px solid var(--focus);
  outline-offset: 3px;
}

.trip-option input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
}

.route-fields,
.date-fields {
  display: grid;
  gap: 14px;
}

.route-fields {
  grid-template-columns: minmax(0, 1fr) 52px minmax(0, 1fr);
  align-items: end;
}

.date-fields {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 130px;
}

.date-fields--one-way {
  grid-template-columns: minmax(0, 1fr) 130px;
}

.field {
  display: grid;
  gap: 8px;
  min-width: 0;
  color: var(--ink-soft);
  font-size: 13px;
  font-weight: 700;
}

.field-error {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--danger);
  font-size: 12px;
  font-weight: 600;
}

.field-error::before {
  content: "!";
  font-weight: 900;
}

.swap-button {
  display: grid;
  width: 48px;
  height: 48px;
  margin-bottom: 2px;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface);
  color: var(--teal);
  font-size: 22px;
  transition: background-color 180ms ease;
}

.swap-button:hover {
  background: var(--teal-soft);
}

.search-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding-top: 2px;
}

.checkbox-field {
  display: flex;
  min-height: 44px;
  align-items: center;
  gap: 10px;
  color: var(--ink-soft);
  font-size: 14px;
  font-weight: 700;
}

.checkbox-field input {
  width: 19px;
  height: 19px;
  accent-color: var(--teal);
}

.search-button {
  min-width: 180px;
  min-height: 52px;
  padding: 0 24px;
  border: 0;
  border-radius: 14px;
  background: #eb6545;
  box-shadow: 0 10px 24px rgba(235, 101, 69, 0.24);
  color: white;
  font-weight: 800;
  transition:
    background-color 180ms ease,
    transform 180ms ease,
    box-shadow 180ms ease;
}

.search-button:hover:not(:disabled) {
  background: #c94c30;
  box-shadow: 0 12px 28px rgba(201, 76, 48, 0.3);
  transform: translateY(-2px);
}

.search-button:active:not(:disabled) {
  box-shadow: 0 6px 16px rgba(201, 76, 48, 0.24);
  transform: translateY(0);
}

@media (max-width: 760px) {

  .search-card {
    gap: 20px;
    padding: 20px;
    border-radius: var(--radius-lg);
  }

  .route-fields,
  .date-fields {
    grid-template-columns: minmax(0, 1fr);
  }

  .swap-button {
    justify-self: center;
    margin: -2px 0;
    transform: rotate(90deg);
  }

  .search-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .search-button {
    width: 100%;
  }
}
</style>
