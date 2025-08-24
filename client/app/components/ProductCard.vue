<template>
  <div class="flex flex-col p-2 border-2 border-gray-300 rounded-sm">
    <div class="relative w-full h-[200px] mb-3 group">
      <img
        :src="product.images[0].url"
        :alt="product.images[0].altText"
        class="object-cover w-[100%] h-[100%]"
      />

      <!-- Hover Overlay -->
      <div
        class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3"
      >
        <!-- Bookmark Button -->
        <UButton
          @click="handleBookmark"
          class="bg-white hover:bg-gray-100 p-2 rounded-full shadow-lg transition-transform hover:scale-110"
          title="Bookmark"
          icon="i-fluent-star-48-regular"
          variant="ghost"
        />

        <!-- Add to Cart Button -->
        <UButton
          @click="handleAddToCart"
          class="bg-white hover:bg-gray-100 p-2 rounded-full shadow-lg transition-transform hover:scale-110"
          title="Bookmark"
          icon="i-mdi-cart-outline"
          variant="ghost"
        />
      </div>
    </div>

    <p class="font-semibold mb-1 text-sm">{{ product.name }}</p>
    <div class="w-full flex flex-col">
      <div class="flex items-center gap-2">
        <!-- Sale price in green/red -->
        <p
          v-if="product.salesPrice"
          class="font-semibold text-lg text-green-600"
        >
          ${{ product.salesPrice }}
        </p>

        <!-- Original price crossed out -->
        <p v-if="product.salesPrice" class="text-sm text-gray-500 line-through">
          ${{ product.price }}
        </p>

        <!-- Regular price if no sale -->
        <p v-else class="font-semibold text-lg text-gray-800">
          ${{ product.price }}
        </p>
      </div>

      <UButton
        variant="soft"
        class="!bg-black text-white px-3 ml-auto rounded-md cursor-pointer"
        @click="handleAddToCart"
      >
        Add to Cart
      </UButton>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  product: Object,
});

function handleAddToCart() {
  console.log('Add to cart');
}

function handleBookmark() {
  console.log('Add Bookmark');
}
</script>
