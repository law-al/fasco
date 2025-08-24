export const useProductStore = defineStore('products', () => {
  const products = ref([]);
  const deals = ref(null);
  const newArrivals = ref([]);
  const pending = ref(false);
  const error = ref(null);
  const config = useRuntimeConfig();

  async function fetchDealOfTheMonth() {
    try {
      pending.value = true;
      error.value = null;

      const response = await $fetch(`/api/v1/products/deals-of-the-month`, {
        baseURL: config.public.apiBase,
        credentials: 'include',
      });

      if (response?.data?.deals) {
        deals.value = response.data.deals[0];
      } else {
        console.warn('No deals data in response:', response);
      }
    } catch (err) {
      error.value = err;
      console.error('Failed to fetch deals:', err);
    } finally {
      pending.value = false;
    }
  }

  async function fetchNewArrivals(queryOpt) {
    try {
      pending.value = true;
      error.value = null;

      const response = await $fetch(`/api/v1/products/new-arrivals`, {
        query: { option: queryOpt },
        baseURL: config.public.apiBase,
        credentials: 'include',
      });

      if (response?.data?.products) {
        newArrivals.value = response.data.products;
      }
    } catch (err) {
      error.value = err;
      console.error('Failed to fetch deals:', err);
    } finally {
      pending.value = false;
    }
  }

  return {
    products,
    deals,
    newArrivals,
    pending,
    error,
    fetchDealOfTheMonth,
    fetchNewArrivals,
  };
});
