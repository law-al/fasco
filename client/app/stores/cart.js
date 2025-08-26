import { useStorage } from '@vueuse/core';

export const useCartStore = defineStore('carts', () => {
  // integrate AI that can help custoers add products and check for products
  const cart = ref([]);
  const pending = ref(false);
  const error = ref(null);
  const config = useRuntimeConfig();

  function intializeCart() {
    if (import.meta.client) {
      cart.value = JSON.parse(localStorage.getItem('cart')) || null;
    }
  }

  async function addToCart(items) {
    try {
      pending.value = true;
      error.value = null;

      const response = await $fetch('api/v1/cart/add-to-cart', {
        method: 'POST',
        credentials: 'include',
        body: items,
        baseURL: config.public.apiBase,
      });

      if (response) {
        localStorage.setItem('cart', JSON.stringify(response.data.cart));
        cart.value = response.data.cart;
      }
    } catch (err) {
      console.log(err);
      error.value = err?.message || 'Something went wrong';
    } finally {
      pending.value = false;
    }
  }

  return { cart, pending, error, addToCart, intializeCart };
});
