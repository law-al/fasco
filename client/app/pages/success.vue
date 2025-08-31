<template>
  <section>
    <div
      class="container mx-auto *:p-8 flex flex-col items-center justify-center h-[70vh]"
    >
      <h1 class="text-2xl font-bold mb-2">Thank You for Your Order!</h1>
      <p class="text-lg mb-2">Your order has been successfully processed.</p>
      <video autoplay loop muted playsinline width="200" height="200">
        <source src="../assets/icons/payment-success.mp4" type="video/mp4" />
      </video>
    </div>
  </section>
</template>

<script setup>
const router = useRouter();
onMounted(() => {
  const cartStore = useCartStore();
  cartStore.clearCart();

  let redirectTimeout = setTimeout(() => {
    router.push('/');
  }, 3000);

  onBeforeUnmount(() => {
    clearTimeout(redirectTimeout);
  });
});
</script>

<style lang="scss" scoped></style>
