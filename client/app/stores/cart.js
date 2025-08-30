import { useStorage } from '@vueuse/core';

export const useCartStore = defineStore('carts', () => {
  const cart = ref([]);
  const pending = ref(false);
  const error = ref(null);
  const expiresAt = ref(null);
  const config = useRuntimeConfig();

  let expiryInterval = null;

  onBeforeUnmount(() => {
    if (expiryInterval) {
      clearInterval(expiryInterval);
      expiryInterval = null;
    }
  });

  function intializeCart() {
    if (import.meta.client) {
      console.log('Initializing cart from localStorage');
      const storedCart = localStorage.getItem('cart');
      if (storedCart) {
        const parsedCart = JSON.parse(storedCart);
        console.log('Parsed cart:', parsedCart);
        if (
          parsedCart.expiresAt &&
          parsedCart.expiresAt !== null &&
          new Date(parsedCart.expiresAt) <= new Date()
        ) {
          console.log('Stored cart is expired, clearing cart.');
          clearCart();
          return;
        } else {
          console.log('Loaded cart from localStorage...');
          cart.value = parsedCart;
          expiresAt.value = parsedCart.expiresAt;
          setExpirationCheck(parsedCart.expiresAt);
        }
      }
    }
  }

  function clearCart() {
    cart.value = [];
    localStorage.removeItem('cart');
    expiresAt.value = null;
    if (expiryInterval) {
      clearInterval(expiryInterval);
      expiryInterval = null;
    }
  }

  function setExpirationCheck(expirationTime) {
    if (!expirationTime || expirationTime === null) return;
    // Clear any existing interval
    if (expiryInterval) {
      clearInterval(expiryInterval);
      expiryInterval = null;
    }

    console.log('Setting expiration check for:', expirationTime);

    const expirationDate = new Date(expirationTime);
    const checkInterval = 30000;

    // Check every 30 seconds
    expiryInterval = setInterval(() => {
      if (new Date() >= expirationDate) {
        console.log('Cart expired, clearing cart.');
        clearCart();
      }
    }, checkInterval);
  }

  async function getCart() {
    try {
      pending.value = true;
      error.value = null;

      const response = await $fetch('api/v1/cart/get-cart', {
        method: 'GET',
        credentials: 'include',
        baseURL: config.public.apiBase,
      });
      console.log('Getting cart from server...');
      if (response) {
        console.log('Fetched cart from server:', response);
        cart.value = response.data.cart;
        localStorage.setItem('cart', JSON.stringify(response.data.cart));
        expiresAt.value = response.data.cart.expiresAt || null;
        setExpirationCheck(response.data.cart.expiresAt);
      }
    } catch (err) {
      error.value =
        err?.data?.message ||
        err?.message ||
        'Could not fetch cart, Please try again.';
    } finally {
      pending.value = false;
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

      if (response?.data?.cart) {
        cart.value = response.data.cart;
        localStorage.setItem('cart', JSON.stringify(response.data.cart));
        expiresAt.value = response.data.cart.expiresAt || null;
        setExpirationCheck(response.data.cart.expiresAt);
      }
    } catch (err) {
      console.log('Error adding to cart:', err.data);
      error.value =
        err?.data?.message ||
        err?.message ||
        'Could not add item to cart, Please try again.';
    } finally {
      pending.value = false;
    }
  }

  async function mergeCart() {
    try {
      pending.value = true;
      error.value = null;

      const response = await $fetch('api/v1/cart/merge-cart', {
        method: 'PATCH',
        credentials: 'include',
        baseURL: config.public.apiBase,
      });

      if (response?.data?.cart) {
        cart.value = response.data.cart;
        localStorage.setItem('cart', JSON.stringify(response.data.cart));
        expiresAt.value = response.data.cart.expiresAt || null;
        setExpirationCheck(response.data.cart.expiresAt);
      }
    } catch (apiError) {
      error.value =
        apiError?.data?.message ||
        apiError?.message ||
        'Could not merge cart, Please try again.';
      throw apiError;
    } finally {
      pending.value = false;
    }
  }

  async function deleteCartItem(payload) {
    try {
      error.value = null;

      const response = await $fetch(`api/v1/cart/delete-cart-item/${payload}`, {
        method: 'DELETE',
        baseURL: config.public.apiBase,
        credentials: 'include',
      });

      if (response?.data?.cart) {
        cart.value = response.data.cart;
        localStorage.setItem('cart', JSON.stringify(response.data.cart));
        expiresAt.value = response.data.cart.expiresAt || null;
        setExpirationCheck(response.data.cart.expiresAt);
      }
    } catch (err) {
      error.value =
        err?.data?.message ||
        err?.message ||
        "Can't delete item, Please try again.";
    }
  }

  if (import.meta.client) {
    intializeCart();
  }

  return {
    cart,
    pending,
    error,
    expiresAt,
    addToCart,
    intializeCart,
    getCart,
    mergeCart,
    deleteCartItem,
    clearCart,
  };
});
