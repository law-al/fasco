import type { RouterConfig } from '@nuxt/schema';

export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    console.log('In the router.options.ts file');

    if (savedPosition) {
      return savedPosition;
    }

    if (to.name === 'collections') {
      return { top: 0, behavior: 'smooth' };
    }

    return { left: 0, top: 0 };
  },
};
