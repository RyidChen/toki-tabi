<script setup lang="ts">
import type { SortOption } from "../types/flight";

defineProps<{ modelValue: SortOption }>();

const emit = defineEmits<{
  "update:modelValue": [value: SortOption];
}>();

function updateSort(event: Event): void {
  emit(
    "update:modelValue",
    (event.target as HTMLSelectElement).value as SortOption,
  );
}
</script>

<template>
  <label class="sort-control">
    <span>排序方式</span>
    <select
      class="form-control"
      name="sortOption"
      :value="modelValue"
      @change="updateSort"
    >
      <option value="price">價格最低</option>
      <option value="duration">去程時間最短</option>
      <option value="departure">去程最早出發</option>
    </select>
  </label>
</template>

<style scoped>
.sort-control {
  display: grid;
  grid-template-columns: auto 180px;
  align-items: center;
  gap: 10px;
  color: var(--ink-soft);
  font-size: 13px;
  font-weight: 700;
}

.sort-control select {
  min-height: 44px;
}

@media (max-width: 760px) {
  .sort-control {
    width: 100%;
    grid-template-columns: 72px 1fr;
  }
}
</style>
