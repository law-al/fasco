<template>
  <UCarousel v-slot="{ item }" fade :items="items" :autoplay="{ delay: 5000 }" class="w-full">
    <div class="w-full h-[450px] flex overflow-hidden relativ">
      <!-- Left side -->
      <div class="flex-1">
        <img :src="item.image" class="w-full h-full object-cover mask" />
      </div>

      <!-- Right side -->
      <div class="flex-1 flex px-20 py-10 bg-white font-primary">
        <div class="">
          <p>{{ item.category }}</p>
          <h2 class="text-4xl font-semibold my-4 text-black">{{ item.title }}</h2>

          <p class="underline uppercase text-xl mb-3 text-black">Description</p>

          <p class="w-[60%] mb-3">
            {{ item.description }}
          </p>

          <div class="flex items-center gap-0.5 mb-5">
            <p>Size:</p>
            <span
              class="p-2 w-[30px] h-[20px] bg-black text-white flex items-center justify-center"
              >{{ item.sizes }}</span
            >
          </div>

          <UButton
            size="xl"
            to="/collections"
            class="!bg-black px-4 cursor-pointer"
            trailing-icon="i-lucide-arrow-right"
            >Buy Now</UButton
          >
        </div>
      </div>
    </div>
  </UCarousel>
</template>

<script setup>
const items = [
  {
    image:
      'https://images.unsplash.com/photo-1544022613-e87ca75a784a?q=80&w=900&auto=format&fit=crop',
    collection: 'Women Collection',
    title: 'Vintage Denim Jacket',
    description:
      'A timeless denim jacket crafted from premium cotton with vintage-inspired details. Perfect for layering and adding a classic touch to any outfit.',
    sizes: 'M',
    price: '$89.99',
    category: 'Outerwear',
  },
  {
    image:
      'https://images.unsplash.com/photo-1551232864-3f0890e580d9?q=80&w=900&auto=format&fit=crop',
    collection: 'Men Collection',
    title: 'Urban Streetwear Hoodie',
    description:
      'Contemporary streetwear hoodie made from soft cotton blend fabric. Features a relaxed fit with modern design elements for everyday comfort.',
    sizes: 'XXL',
    price: '$64.99',
    category: 'Casual Wear',
  },
  {
    image:
      'https://images.unsplash.com/photo-1571513722275-4b9cdb0ea6c2?q=80&w=900&auto=format&fit=crop',
    collection: 'Women Collection',
    title: 'Elegant Evening Dress',
    description:
      'Sophisticated evening dress with flowing silhouette and delicate fabric. Designed for special occasions and formal events with refined elegance.',
    sizes: 'M',
    price: '$149.99',
    category: 'Formal Wear',
  },
  {
    image:
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=900&auto=format&fit=crop',
    collection: 'Men Collection',
    title: 'Classic White Sneakers',
    description:
      'Clean and minimalist white sneakers crafted with premium leather and comfortable cushioning. A versatile addition to any modern wardrobe.',
    sizes: '8',
    price: '$124.99',
    category: 'Footwear',
  },
  {
    image:
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=900&auto=format&fit=crop',
    collection: 'Women Collection',
    title: 'Boho Summer Blouse',
    description:
      'Light and airy bohemian-style blouse featuring intricate patterns and flowing fabric. Perfect for warm weather and casual summer days.',
    sizes: 'L',
    price: '$45.99',
    category: 'Tops',
  },
  {
    image:
      'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?q=80&w=900&auto=format&fit=crop',
    collection: 'Men Collection',
    title: 'Tailored Business Shirt',
    description:
      'Professional business shirt with precise tailoring and premium cotton construction. Essential for the modern professional wardrobe.',
    sizes: 'XL',
    price: '$79.99',
    category: 'Business Wear',
  },
];
</script>

<style scoped>
.mask {
  mask-image: linear-gradient(to left, transparent, #000 60%);
}
</style>
