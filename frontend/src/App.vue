<template>
  <router-view />
</template>

<script setup lang="ts"></script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-family);
  color: var(--text-color);
  background-color: var(--surface-ground);
}

#app {
  min-height: 100vh;
}
</style>
