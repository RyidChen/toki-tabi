<template>
  <main class="app-main">
    <RouterView />
  </main>
</template>

<style scoped>
.app-main {
  min-height: 100svh;
  padding-bottom: calc(40px + env(safe-area-inset-bottom));
}
</style>
