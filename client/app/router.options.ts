import type { RouterConfig } from '@nuxt/schema';

export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    console.log('In the router.options.ts file');
    // console.log(to, from, savedPosition);
    if (to.name === 'collections') {
      return savedPosition
        ? savedPosition
        : { el: '.collection', top: 30, behavior: 'smooth' };
    }
  },
};
