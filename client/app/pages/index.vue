<template>
  <!-- Hero -->
  <section class="w-[1200px] py-10 mx-auto">
    <div class="grid grid-cols-3 grid-rows-[repeat(4,_130px)] gap-3">
      <div class="overflow-hidden rounded-sm row-span-full">
        <NuxtImg
          provider="unsplash"
          src="https://images.unsplash.com/photo-1554412933-514a83d2f3c8?q=80&w=672&auto=format&fit=crop"
          alt="Clothing wallpaper"
          class="object-cover w-full h-full"
        />
      </div>
      <div class="overflow-hidden rounded-sm">
        <NuxtImg
          provider="unsplash"
          src="https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?q=80&w=764&auto=format&fit=crop"
          alt="Clothing wallpaper"
          class="object-cover w-full h-full"
        />
      </div>
      <div class="overflow-hidden rounded-sm row-span-full col-start-3">
        <NuxtImg
          src="https://images.unsplash.com/photo-1596993100471-c3905dafa78e?q=80&w=687&auto=format&fit=crop"
          alt="Clothing wallpaper"
          class="object-cover w-full h-full"
        />
      </div>
      <div
        class="overflow-hidden flex flex-col py-3 px-2 rounded-sm row-span-2 items-center justify-between"
      >
        <h2
          class="font-public text-5xl font-semibold text-gray-800 tracking-wider uppercase"
        >
          Ultimate
        </h2>
        <h1 class="font-monoton text-8xl tracking-widest uppercase">Sale</h1>
        <p class="font-public tracking-widest font-light uppercase">
          New collection
        </p>
        <u-button
          size="xl"
          to="/collections"
          class="font-public uppercase !bg-black"
          >Shop now</u-button
        >
      </div>
      <div class="overflow-hidden rounded-sm">
        <NuxtImg
          provider="unsplash"
          src="https://images.unsplash.com/photo-1538329972958-465d6d2144ed?q=80&w=1170&auto=format&fit=crop"
          alt="Clothing wallpaper"
          class="object-cover w-full h-full"
        />
      </div>
    </div>

    <div class="flex py-8 items-center justify-between">
      <p class="text-5xl font-public text-black uppercase">Channel</p>
      <p class="text-4xl font-primary text-black uppercase">Prada</p>
      <p class="text-5xl font-serif text-black uppercase">Denim</p>
      <p class="text-3xl font-ribeye text-black uppercase">Louis vuitton</p>
    </div>
  </section>

  <!-- Deal of the week -->

  <section class="w-full py-10 font-primary text-gray-800 bg-gray-200">
    <DealOfTheMonth :deals="deals" :pending="pending" :error="error" />
  </section>

  <!-- New Arrival -->
  <section class="w-[1200px] py-20 mx-auto">
    <NewArrivals
      :products="products"
      :pending="newArrivalPending"
      @tab-changed="handleTabChange"
    />
  </section>

  <!-- Featured Products -->
  <section class="py-10 w-full">
    <FeaturedProduct :items="items" />
  </section>

  <section class="w-[1200px] py-10 mx-auto">
    <div class="font-public flex items-center justify-between text-gray-500">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-award" size="35" />
        <div class="flex flex-col">
          <p class="font-semibold text-sm">High Quality</p>
          <span class="text-xs">crafted from top material</span>
        </div>
      </div>
      <!--  -->
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-check-circle" size="35" />
        <div class="flex flex-col">
          <p class="font-semibold text-sm">Warranty Protection</p>
          <span class="text-xs">over 2 years</span>
        </div>
      </div>
      <!--  -->
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-package" size="35" />
        <div class="flex flex-col">
          <p class="font-semibold text-sm">Free Shipping</p>
          <span class="text-xs">order over $150</span>
        </div>
      </div>
      <!--  -->
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-phone" size="35" />
        <div class="flex flex-col">
          <p class="font-semibold text-sm">24 / 7 Support</p>
          <span class="text-xs">dedicated support</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
definePageMeta({
  layout: 'default',
});
const config = useRuntimeConfig();

const currentTab = ref('all');

function handleTabChange(value) {
  currentTab.value = value;
}

const {
  data: deals,
  pending,
  error,
} = await useFetch(`/api/v1/products/deals-of-the-month`, {
  baseURL: config.public.apiBase,
  credentials: 'include',

  transform: response => {
    return response.data.deals[0];
  },
});

const {
  data: products,
  pending: newArrivalPending,
  error: newArrivalError,
} = await useFetch(`/api/v1/products/new-arrivals`, {
  query: { option: computed(() => currentTab.value) },
  baseURL: config.public.apiBase,
  credentials: 'include',

  transform: response => {
    return response.data.products.map(product => {
      const firstImage = product.images?.[0];
      return {
        name: product.name,
        price: product.price,
        image: firstImage?.url || '',
        alt: firstImage?.altText || product.name,
      };
    });
  },
});

const { data: items } = await useFetch('api/v1/products/featured-products', {
  baseURL: config.public.apiBase,
  credentials: 'include',
  transform: response => {
    return response.data.products.map(product => {
      return {
        name: product.name,
        image: product.images[0].url,
        category: product.category[0].name,
        description: product.description,
        sizes: product.sizes,
        price: product.salesPrice || product.price,
      };
    });
  },
});
</script>

<style lang="scss" scoped></style>
