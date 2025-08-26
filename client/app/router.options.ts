import type { RouterConfig } from '@nuxt/schema';

export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    console.log('In the router.options.ts file');

    if (to.name === 'collections') {
      console.log(to.name);
      return savedPosition
        ? savedPosition
        : { el: '.collection', top: 0, behavior: 'smooth' };
    }
  },
};
