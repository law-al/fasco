export default async function (to, from) {
  console.log('to: ', to);
  console.log('from: ', from);
  if (from.path === '/collections') {
    console.log('path === collection');
    const config = useRuntimeConfig();
    const productStore = useProductStore();
    const { products, product } = storeToRefs(productStore);
    const { slug } = to.params;

    if (slug) {
      console.log('slug:', slug);
      const { data } = await useFetch(`api/v1/products/get-product/${slug}`, {
        baseURL: config.public.apiBase,
        credentials: 'include',

        transform: response => {
          return response.data.product;
        },
      });

      if (data) {
        console.log(data.value);
        product.value = data.value;
      } else {
        product.value = null;

        // you can redirect to a 404 not found
      }
    }
  }
}
