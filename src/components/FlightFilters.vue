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
    <select name="sortOption" :value="modelValue" @change="updateSort">
      <option value="price">價格最低</option>
      <option value="duration">飛行時間最短</option>
      <option value="departure">最早出發</option>
    </select>
  </label>
</template>
