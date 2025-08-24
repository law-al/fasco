<template>
  <div class="px-2 font-primary">
    <div class="flex flex-col mb-6 items-center">
      <h2 class="mb-3s text-center font-semibold text-3xl">New Arrivals</h2>
      <p class="w-[400px] text-center">
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Ea est dolor
        aliquid tempora, hic in! Pariatur voluptas dicta corrupti placeat.
      </p>
    </div>

    <UTabs
      v-model="activeTab"
      color="neutral"
      :content="false"
      :items="items"
      class="mb-4"
      :ui="{
        list: 'justify-center w-[500px] bg-gray-100/40',
        label: '!w-[300px]',
      }"
      @update:model-value="onTabChange"
    />

    <div class="grid grid-cols-3 mb-10 gap-8">
      <!-- Loading skeleton - repeat for each expected item -->
      <UCard
        v-if="pending"
        v-for="n in 6"
        :key="`skeleton-${n}`"
        variant="subtle"
        class="min-h-[250px] bg-white shadow-md !ring-0"
      >
        <div class="h-[220px] mb-5">
          <USkeleton class="w-full h-full rounded" />
        </div>

        <div class="flex flex-col w-full items-start justify-between">
          <USkeleton class="h-4 w-3/4 mb-2" />
          <div class="flex w-full mt-2 items-center justify-between">
            <USkeleton class="h-6 w-20" />
            <USkeleton class="h-4 w-32" />
          </div>
        </div>
      </UCard>

      <UCard
        v-else
        v-for="product in products"
        :key="product.name"
        variant="subtle"
        class="min-h-[250px] bg-white shadow-md !ring-0"
      >
        <div class="h-[220px] mb-5">
          <img
            :src="product.image"
            :alt="product.alt"
            class="object-cover w-full h-full"
          />
        </div>

        <div class="flex flex-col w-full items-start justify-between">
          <p>{{ product.name }}</p>
          <div class="flex w-full mt-2 items-center justify-between">
            <p class="font-public font-semibold text-xl">
              ${{ product.price }}
            </p>
            <p class="text-sm text-red-500">Almost out of stock</p>
          </div>
        </div>
      </UCard>
    </div>

    <div class="flex w-full items-center justify-center">
      <u-button
        to="/"
        size="xl"
        class="px-4 text-center rounded-md shadow-sm cursor-pointer !bg-black"
        label="View more"
      />
    </div>
  </div>
</template>

<script setup>
const items = [
  {
    label: 'All',
  },
  {
    label: "Men's Fashion",
  },
  {
    label: "Women's Fashion",
  },
];

// const products = [
//   {
//     image: {
//       img: 'https://images.unsplash.com/photo-1545291730-faff8ca1d4b0?q=80&w=400&h=400&auto=format&fit=crop',
//       alt: 'Elegant black evening dress',
//     },
//     name: 'Shinny Dress',
//     price: 9.99,
//   },
//   {
//     image: {
//       img: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=400&h=400&auto=format&fit=crop',
//       alt: 'Classic white sneakers',
//     },
//     name: 'Classic White Sneakers',
//     price: 79.99,
//   },
//   {
//     image: {
//       img: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=400&h=400&auto=format&fit=crop',
//       alt: 'Denim jacket with vintage wash',
//     },
//     name: 'Vintage Denim Jacket',
//     price: 89.99,
//   },
//   {
//     image: {
//       img: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=400&h=400&auto=format&fit=crop',
//       alt: 'Floral summer dress',
//     },
//     name: 'Floral Summer Dress',
//     price: 49.99,
//   },
//   {
//     image: {
//       img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=400&h=400&auto=format&fit=crop',
//       alt: 'Leather crossbody handbag',
//     },
//     name: 'Leather Crossbody Bag',
//     price: 129.99,
//   },
//   {
//     image: {
//       img: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=400&h=400&auto=format&fit=crop',
//       alt: 'Cozy knit sweater in beige',
//     },
//     name: 'Cozy Knit Sweater',
//     price: 59.99,
//   },
// ];

const activeTab = ref('0');
let currentTab = ref('all');
const config = useRuntimeConfig();

const {
  data: products,
  pending,
  error,
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

async function onTabChange() {
  switch (activeTab.value) {
    case '0':
      currentTab.value = 'all';
      break;
    case '1':
      currentTab.value = 'men';
      break;
    case '2':
      currentTab.value = 'women';
      break;
    default:
      break;
  }
}
</script>
