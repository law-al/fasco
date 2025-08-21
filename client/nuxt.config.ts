// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite';
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  modules: ['@nuxt/image', '@nuxt/ui', '@vueuse/nuxt'],
  colorMode: {
    preference: 'light',
  },
  image: {
    providers: {
      unsplash: {
        name: 'unsplash',
        provider: 'ipx',
        options: {
          baseURL: 'https://images.unsplash.com',
        },
      },
    },
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:5000',
    },
  },
});
