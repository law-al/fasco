<template>
  <section class="w-[1200px] mx-auto py-20 font-primary text-gray-700">
    <Transition name="fade" mode="out-in">
      <div
        v-if="productPending"
        class="flex items-center justify-center h-[70vh]"
      >
        <span class="loader"></span>
      </div>
      <div
        v-else-if="!productPending && product"
        class="grid grid-cols-2 gap-4"
      >
        <div class="">
          <!-- Carousel -->
          <div class="flex-1 flex w-full gap-4">
            <div class="flex gap-1 justify-between pt-1 max-w-xs">
              <div
                v-for="(item, index) in items"
                :key="index"
                class="size-11 opacity-25 hover:opacity-100 transition-opacity w-[60px] h-[60px] flex items-center justify-center"
                :class="{
                  'opacity-100 border-2 border-black': activeIndex === index,
                }"
                @click="select(index)"
              >
                <img :src="item.url" class="w-[55px] h-[55px] rounded-sm" />
              </div>
            </div>

            <UCarousel
              ref="carousel"
              orientation="vertical"
              v-slot="{ item }"
              :items="items"
              class="w-full"
              @select="onSelect"
            >
              <img
                :src="item.url"
                class="rounded-sm w-[500px] h-[500px] object-cover"
              />
            </UCarousel>
          </div>
        </div>
        <div class="p-3">
          <h2 class="mb-0.5 text-black uppercase">Fasco</h2>
          <div class="">
            <div class="flex items-center justify-between mb-0.5">
              <h2 class="text-lg font-semibold capitalize">
                {{ product.name }}
              </h2>
              <u-icon
                name="i-material-symbols-light-star-outline-rounded"
                class="size-10 cursor-pointer"
              />
            </div>

            <div class="mb-3">
              <!-- if sales price -->
              <div v-if="product.salesPrice" class="flex items-center gap-2">
                <p class="text-xl">${{ product.salesPrice }}</p>
                <p class="line-through text-gray-400 text-sm">
                  {{ product.price }}
                </p>
                <p
                  class="bg-red-600 text-white text-sm px-1 py-0.5 rounded-2xl"
                >
                  save
                  {{
                    Math.round(
                      ((product.price - product.salesPrice) / product.price) *
                        100
                    )
                  }}%
                </p>
              </div>

              <!-- if no sales price -->
              <div v-if="!product.salesPrice" class="flex items-center gap-2">
                <p class="text-xl">${{ product.price }}</p>
              </div>
            </div>

            <div class="flex flex-col items-start gap-3 wfull">
              <!-- Size Selection -->
              <div class="flex items-center gap-3">
                <u-button
                  v-for="inventory in product.inventory"
                  :key="inventory._id"
                  variant="outline"
                  class="w-[35px] h-[35px] justify-center ring-0 border !border-black"
                  :class="
                    selectedSize === inventory.size
                      ? '!bg-black text-white'
                      : '!bg-white text-black'
                  "
                  @click="selectSize(inventory.size)"
                >
                  {{ inventory.size }}
                </u-button>
              </div>

              <!-- Color and Quantity Display for Selected Size -->
              <div v-if="selectedSize" class="flex flex-col gap-2">
                <div
                  v-for="inventory in getInventoryForSelectedSize()"
                  :key="inventory._id"
                  class="flex items-center gap-3 p-2 border border-gray-200 rounded-lg"
                >
                  <div class="flex items-center gap-2">
                    <div
                      class="w-4 h-4 rounded-full border border-gray-300"
                      :class="getColorClass(inventory.color)"
                    ></div>
                    <span class="text-sm font-medium capitalize">{{
                      inventory.color
                    }}</span>
                  </div>
                  <span class="text-sm text-gray-600"
                    >{{ inventory.quantity }} available</span
                  >
                </div>
              </div>

              <!-- Quantity -->
              <div
                v-if="selectedSize"
                class="flex items-center gap-0 border border-gray-300 rounded-lg overflow-hidden bg-white mb-10"
              >
                <u-button
                  variant="ghost"
                  class="px-3 py-2 h-10 w-10 hover:bg-gray-100 transition-colors border-0 rounded-none flex items-center justify-center"
                  :disabled="quantity <= 1"
                  @click="decreaseQuantity"
                >
                  -
                </u-button>

                <div
                  v-if="selectedSize"
                  class="px-4 py-2 h-10 flex items-center justify-center min-w-[50px] border-x border-gray-300 bg-gray-50"
                >
                  <p class="text-base font-medium select-none">
                    {{ quantity }}
                  </p>
                </div>

                <u-button
                  variant="ghost"
                  :disabled="quantity >= maxQuantity"
                  class="px-3 py-2 h-10 w-10 hover:bg-gray-100 transition-colors border-0 rounded-none flex items-center justify-center"
                  @click="increaseQuantity"
                >
                  +
                </u-button>
              </div>

              <!-- Add to cart -->
              <div class="w-full">
                <u-button
                  size="xl"
                  color="neutral"
                  class="!bg-black !w-full justify-center cursor-pointer"
                  @click="addToCart"
                  :loading="pending"
                  >Add to cart</u-button
                >
              </div>

              <!-- Alternative: Show all colors with availability indicator -->
              <div v-if="!selectedSize" class="text-sm text-gray-500">
                Select a size to see available colors
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </section>
</template>

<script setup>
/* ------------------------------
   Composables & Store
--------------------------------*/
const route = useRoute();
const config = useRuntimeConfig();
const productStore = useProductStore();
const cartStore = useCartStore();

/* ------------------------------
   Fetch Product
--------------------------------*/
const { data: product, pending: productPending } = useLazyFetch(
  `api/v1/products/get-product/${route.params.slug.toLowerCase()}`,
  {
    baseURL: config.public.apiBase,
    credentials: 'include',
    transform: response => response.data.product,
  }
);

productStore.product = product.value;

/* ------------------------------
   State
--------------------------------*/
const { pending, error } = storeToRefs(cartStore);
const selectedSize = ref('');
const quantity = ref(1);
const activeIndex = ref(0);
const toast = useToast();
const isComponentMounted = ref(true);
// Carousel ref
const carousel = useTemplateRef('carousel');

/* ------------------------------
   Derived Data
--------------------------------*/
const items = computed(() => {
  return product.value?.images?.map(image => image) || [];
});
const colorMap = {
  gray: 'bg-gray-400',
  grey: 'bg-gray-400',
  navy: 'bg-blue-900',
  black: 'bg-black',
  white: 'bg-white',
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  pink: 'bg-pink-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
};

/* ------------------------------
   Computed
--------------------------------*/
const maxQuantity = computed(
  () =>
    product.value.inventory.find(
      inventory => inventory.size === selectedSize.value
    ).quantity
);

/* ------------------------------
   Methods
--------------------------------*/
function getColorClass(color) {
  if (!color) return 'bg-gray-300';
  return colorMap[color.toLowerCase()] || 'bg-gray-300';
}

function selectSize(size) {
  if (!isComponentMounted.value) return;

  quantity.value = 1;
  selectedSize.value = selectedSize.value === size ? '' : size;
}

function getInventoryForSelectedSize() {
  if (!product.value?.inventory) return [];

  return product.value.inventory.filter(
    item => item.size === selectedSize.value
  );
}

function decreaseQuantity() {
  if (!isComponentMounted.value) return;
  if (quantity.value > 1) quantity.value--;
}

function increaseQuantity() {
  if (!isComponentMounted.value) return;
  if (quantity.value < maxQuantity.value) quantity.value++;
}

function select(index) {
  if (!isComponentMounted.value) return;

  activeIndex.value = index;

  nextTick(() => {
    try {
      if (!isComponentMounted.value) return;
      if (!carousel.value?.emblaApi) return;

      const embla = carousel.value.emblaApi;
      if (typeof embla.scrollTo !== 'function') return;

      if (typeof embla.destroyed === 'function' && embla.destroyed()) return;

      const container = embla.containerNode?.();
      if (!container || !container.parentNode) return;

      embla.scrollTo(index);
    } catch (error) {
      console.warn('Carousel navigation error (handled):', error);
    }
  });
}

// Add to cart
async function addToCart() {
  if (!selectedSize.value || !isComponentMounted.value) return;

  const foundProduct = product.value.inventory.find(
    inventory => inventory.size === selectedSize.value
  );

  if (!foundProduct) {
    console.warn('No product found for selected size');
    return;
  }

  const body = {
    productId: product.value._id,
    sku: foundProduct.sku,
    quantity: quantity.value,
  };

  await cartStore.addToCart(body);

  if (isComponentMounted.value && !error.value) {
    toast.add({
      title: 'Item added to cart',
      description: 'Item has been added to cart successfully',
    });
  }

  if (cartStore.error) {
    toast.add({
      title: 'Error adding to cart',
      description: cartStore.error,
    });
  }
}

function onSelect(index) {
  if (!isComponentMounted.value) return;
  activeIndex.value = index;
}

/* ------------------------------
   Lifecycle Hooks
--------------------------------*/
onBeforeUnmount(() => {
  isComponentMounted.value = false;

  // Cleanup carousel safely
  try {
    if (
      carousel.value?.emblaApi &&
      typeof carousel.value.emblaApi.destroy === 'function'
    ) {
      carousel.value.emblaApi.destroy();
    }
  } catch (error) {
    console.warn('Carousel cleanup error:', error);
  }
});

onUnmounted(() => {
  isComponentMounted.value = false;
});

/* ------------------------------
   Error Handling
--------------------------------*/
onErrorCaptured((error, instance, info) => {
  if (error.message.includes('parentNode') || error.message.includes('null')) {
    console.warn('DOM error caught and handled:', {
      error: error.message,
      component: info,
    });
    return false; // Prevent error from bubbling up
  }
});
</script>

<style scoped>
.loader {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: block;
  margin: 15px auto;
  position: relative;
  color: #000;
  box-sizing: border-box;
  animation: animloader 1s linear infinite alternate;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter-active {
  opacity: 1;
  transition: all 150ms ease-out;
}

.fade-leave-active {
  opacity: 0;
  transition: all 150ms ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes animloader {
  0% {
    box-shadow: -38px -6px, -14px 6px, 14px -6px;
  }
  33% {
    box-shadow: -38px 6px, -14px -6px, 14px 6px;
  }
  66% {
    box-shadow: -38px -6px, -14px 6px, 14px -6px;
  }
  100% {
    box-shadow: -38px 6px, -14px -6px, 14px 6px;
  }
}
</style>
