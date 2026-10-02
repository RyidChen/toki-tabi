import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "Home",
      component: Home,
    },
  ],
});

// 測試頁與 API 程式碼不會打包進正式展示站。
if (import.meta.env.DEV) {
  router.addRoute({
    path: "/api-test",
    name: "ApiTest",
    component: () => import("../views/ApiTest.vue"),
  });
}

export default router;
