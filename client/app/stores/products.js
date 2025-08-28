export const useProductStore = defineStore('products', () => {
  const products = ref([]);
  const product = ref(null);
  const count = ref(0);
  const pending = ref(false);
  const error = ref(null);

  const config = useRuntimeConfig();

  async function fetchProducts(query = {}) {
    try {
      pending.value = true;
      error.value = null;
      products.value = [];

      const response = await $fetch('api/v1/products/products', {
        baseURL: config.public.apiBase,
        credentials: 'include',
        query,
      });

      if (!response?.data) {
        products.value = [];
        count.value = 0;
        return;
      }

      products.value = response.data.products ?? [];
      count.value = response.count ?? 0;
    } catch (err) {
      error.value = err?.message ?? 'Something went wrong';
      products.value = [];
      count.value = 0;
    } finally {
      pending.value = false;
    }
  }

  return {
    products,
    product,
    count,
    pending,
    error,
    fetchProducts,
  };
});
