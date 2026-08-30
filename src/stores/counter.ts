import { defineStore } from "pinia";

export const useCounterStore = defineStore("counter", {
  state: () => ({
    count: 0,
    name: "旅行小幫手",
  }),
  actions: {
    increment() {
      this.count++;
    },
    reset() {
      this.count = 0;
    },
  },
  getters: {
    doubleCount(): number {
      return this.count * 2;
    },
  },
});
