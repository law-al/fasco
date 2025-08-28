import { useStorage } from '@vueuse/core';

export const useCartStore = defineStore('carts', () => {
  // integrate AI that can help custoers add products and check for products
  const cart = ref([]);
  const pending = ref(false);
  const error = ref(null);
  const expiresAt = ref(null);
  const config = useRuntimeConfig();

  let expiryInterval = null;

  function intializeCart() {
    if (import.meta.client) {
      console.log('Initializing cart from localStorage');
      // Ensure this runs only on client side
      const storedCart = localStorage.getItem('cart');
      if (storedCart) {
        console.log('Found stored cart:', storedCart);
        const parsedCart = JSON.parse(storedCart);

        if (
          parsedCart.expiresAt &&
          new Date(parsedCart.expiresAt) <= new Date()
          // cart is expired
        ) {
          clearCart(); // a function to clear cart and localStorage
          return;
        } else {
          console.log('Cart is valid, loading cart:', parsedCart);
          // cart is valid
          cart.value = parsedCart;
          expiresAt.value = parsedCart.expiredsAt || null;

          // Set up expiration check
          setExpirationCheck(parsedCart.expiresAt);
        }
      }
    }
  }

  // Function to clear cart and localStorage
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
    if (!expirationTime) return;
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
      console.log('Checking cart expiration at:', new Date());
      console.log(new Date() >= expirationDate);
      if (new Date() >= expirationDate) {
        console.log('Cart expired, clearing cart.');
        clearCart();
      }
    }, checkInterval);
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
        expiresAt.value = response.data.cart.expiredsAt || null;
        setExpirationCheck(response.data.cart.expiresAt);
      }
    } catch (err) {
      error.value = 'Item already exist in cart';
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
        localStorage.setItem('cart', JSON.stringify(response.data.cart));
        cart.value = response.data.cart;
      } else {
        throw new Error('Invalid cart data received');
      }
    } catch (apiError) {
      error.value =
        apiError?.message || 'Could not merge cart, Please try again.';
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

      if (response) {
        localStorage.setItem('cart', JSON.stringify(response.data.cart));
        cart.value = response.data.cart;
      }
    } catch (err) {
      error.value = err?.message || "Can't delete item, Please try again.";
    }
  }

  return {
    cart,
    pending,
    error,
    addToCart,
    intializeCart,
    mergeCart,
    deleteCartItem,
  };
});
