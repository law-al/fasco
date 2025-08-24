<template>
  <u-app>
    <nuxt-loading-indicator />
    <nuxt-layout>
      <nuxt-page />
    </nuxt-layout>
  </u-app>
</template>

<script setup>
const isLoading = ref(false);
</script>
