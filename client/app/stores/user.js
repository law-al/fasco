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
  const intializeUser = () => {
    if (import.meta.client) {
      console.log('Initializing user from localStorage..........');
      const userFromStorage = localStorage.getItem('user');
      if (userFromStorage) {
        const parsedUser = JSON.parse(userFromStorage);
        if (parsedUser.expiry && new Date(parsedUser.expiry) < new Date()) {
          localStorage.removeItem('user');
          return;
        } else {
          user.value = parsedUser;
        }
      } else {
        user.value = null;
      }
    }
  };

  async function loginUser(credentials) {
    pending.value = true;
    error.value = null;
    try {
      const response = await $fetch('/api/v1/auth/login', {
        method: 'POST',
        baseURL: config.public.apiBase,
        body: credentials,
        credentials: 'include',
      });
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
