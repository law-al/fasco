export const useUserStore = defineStore('user', () => {
  const user = ref(null);
  const pending = ref(false);
  const error = ref(null);
  const config = useRuntimeConfig();

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
      if (response?.data?.user) user.value = response.data.user;
    } catch (err) {
      error.value = err.data?.message || 'An error occurred during login';
      user.value = null;
      throw err.data?.message || err;
    } finally {
      pending.value = false;
    }
  }

  return { user, pending, error, loginUser };
});
