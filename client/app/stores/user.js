import { useStorage } from '@vueuse/core';

export const useUserStore = defineStore('user', () => {
  /* ------------------------------
     User State
  --------------------------------*/
  const user = ref(null);
  const pending = ref(false);
  const error = ref(null);
  const timeStamp = ref(null);

  const config = useRuntimeConfig();

  /* ------------------------------
     User Getters
  --------------------------------*/
  const getUser = computed(() => user.value);

  /* ------------------------------
     User Actions
  --------------------------------*/
  const intializeUser = async () => {
    if (import.meta.client) {
      console.log('Initializing user from server..........');
      try {
        const response = await $fetch('/api/v1/auth/check-status', {
          method: 'GET',
          baseURL: config.public.apiBase,
          credentials: 'include',
        });
        if (response && response.status === 'success') {
          user.value = response.data.user;
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        user.value = null;
      }
    }
  };

  async function loginUser(credentials) {
    pending.value = true;
    error.value = null;
    try {
      console.log('Logging iatn user with credentials:', credentials);
      const response = await $fetch('/api/v1/auth/login', {
        method: 'POST',
        baseURL: config.public.apiBase,
        body: credentials,
        credentials: 'include',
      });
      console.log('Login response:', response);
      if (response) {
        user.value = response.data.user;
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    } catch (err) {
      error.value = err.data?.message || 'An error occurred during login';
      user.value = null;
      throw err.data?.message || err;
    } finally {
      pending.value = false;
    }
  }

  return { user, pending, error, intializeUser, getUser, loginUser };
});
