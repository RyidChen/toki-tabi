import assert from "node:assert/strict";
import { createServer as createHttpServer } from "node:http";
import { test } from "node:test";
import { createServer, loadConfigFromFile } from "vite";

test("直接開啟 API 測試頁保留前端路由，只有 API 與健康檢查轉送後端", async () => {
  const backend = createHttpServer((request, response) => {
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ path: request.url }));
  });
  await new Promise((resolve) => backend.listen(0, "127.0.0.1", resolve));
  let frontend;
  try {
    const { config } = await loadConfigFromFile({
      command: "serve",
      mode: "development",
    });
    const target = `http://127.0.0.1:${backend.address().port}`;
    frontend = await createServer({
      ...config,
      configFile: false,
      server: {
        ...config.server,
        host: "127.0.0.1",
        port: 0,
        ws: false,
        watch: null,
        proxy: Object.fromEntries(
          Object.entries(config.server.proxy).map(([key, options]) => [
            key,
            { ...options, target },
          ]),
        ),
      },
    });
    await frontend.listen();
    const base = `http://127.0.0.1:${frontend.httpServer.address().port}`;
    const page = await fetch(`${base}/api-test`, {
      headers: { Accept: "text/html" },
    });
    assert.equal(page.status, 200);
    assert.match(page.headers.get("content-type"), /text\/html/);
    assert.match(await page.text(), /id="app"/);
    for (const path of ["/api/fares?origin=TPE", "/health"]) {
      const response = await fetch(`${base}${path}`);
      assert.deepEqual(await response.json(), { path });
    }
  } finally {
    await frontend?.close();
    await new Promise((resolve, reject) =>
      backend.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
