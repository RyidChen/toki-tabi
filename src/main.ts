import { createApp } from "vue";
import "./style.css";
import Vant from "vant";
import "vant/lib/index.css";
import router from "./router";
import { createPinia } from "pinia";

import App from "./App.vue";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(Vant);

app.mount("#app");
