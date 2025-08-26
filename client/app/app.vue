<template>
  <u-app>
    <nuxt-loading-indicator />
    <nuxt-layout>
      <nuxt-page />
    </nuxt-layout>
  </u-app>
</template>

<script setup>
const cartStore = useCartStore();

onMounted(() => {
  cartStore.intializeCart();
});
</script>
