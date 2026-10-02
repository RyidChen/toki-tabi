import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.API_PROXY_TARGET || "http://127.0.0.1:5080";

  return {
    plugins: [vue()],
    server: {
      // 僅供本機開發；瀏覽器走同源，不需要更動後端 CORS。
      proxy: {
        "^/api(?:/|$)": { target, changeOrigin: true },
        "/health": { target, changeOrigin: true },
      },
    },
  };
});
