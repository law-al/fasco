<template>
  <div class="">
    <u-app>
      <nuxt-layout>
        <nuxt-page />
      </nuxt-layout>
    </u-app>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'default',
});
const cartStore = useCartStore();

onMounted(() => {
  cartStore.intializeCart();
});
</script>
