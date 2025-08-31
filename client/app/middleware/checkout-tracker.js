export default defineNuxtRouteMiddleware((to, from) => {
  console.log('to: ', to);
  console.log('from: ', from);
  console.log('from name: ', from.name);

  if (from.path === '/success') {
    return navigateTo('/');
  }

  if (!from.name) {
    console.log('No from route, redirecting to home');
    return navigateTo('/');
  }
});
