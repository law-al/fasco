<template>
  <section class="font-primary text-gray-600 w-[1200px] mx-auto">
    <div class="">
      <div class="mt-3 mb-10 text-center">
        <h2 class="font-semibold text-2xl mb-2">Fashion</h2>
        <p>breadcrumbs</p>
      </div>
      <div class="grid grid-cols-[1fr_3fr] gap-5">
        <div class="">
          <h3 class="text-xl font-semibold">Filters</h3>
          <div class="grid grid-cols-1 gap-3">
            <!-- Size -->
            <div class="">
              <h4 class="mb-3 font-semibold">Size</h4>
              <div class="flex items-center gap-2">
                <UButton
                  v-for="size in sizes"
                  :key="size"
                  variant="outline"
                  @click="
                    selectedValue.size === size
                      ? (selectedValue.size = null)
                      : (selectedValue.size = size)
                  "
                  class="w-[35px] text-black h-[35px] justify-center text-xs"
                  :class="getSizeClass(size)"
                >
                  {{ size }}
                </UButton>
              </div>
            </div>

            <!-- Color -->
            <div class="">
              <h4 class="mb-3 font-semibold">Colors</h4>
              <div class="flex items-center flex-wrap gap-2">
                <UButton
                  v-for="color in colors"
                  :key="color.name"
                  variant="outline"
                  @click="
                    selectedValue.color === color.name
                      ? (selectedValue.color = null)
                      : (selectedValue.color = color.name)
                  "
                  class="w-[25px] h-[25px] rounded-full justify-center cursor-pointer"
                  :class="[color.class, getColorClass(color)]"
                >
                </UButton>
              </div>
            </div>

            <!-- Prices -->
            <div class="">
              <h4 class="mb-3 font-semibold">Prices</h4>
              <div class="flex flex-col gap-3">
                <UButton
                  v-for="price in priceRange"
                  variant="ghost"
                  @click="
                    selectedValue.priceLevel === price.name
                      ? (selectedValue.priceLevel = null)
                      : (selectedValue.priceLevel = price.name)
                  "
                  class="p-0 !bg-white cursor-pointer"
                  :class="getPriceLevelClass(price)"
                >
                  {{ price.value }}
                </UButton>
              </div>
            </div>

            <UAccordion :items="items" :ui="{ label: 'font-semibold' }">
              <template #content="{ item }">
                <!-- Category -->
                <div v-if="item.label === 'Collections'">
                  <div class="flex flex-col gap-3">
                    <UButton
                      v-for="category in categories"
                      variant="ghost"
                      @click="
                        selectedValue.slug === category.name
                          ? (selectedValue.slug = null)
                          : (selectedValue.slug = category.name)
                      "
                      class="p-0 !bg-white cursor-pointer"
                      :class="
                        selectedValue.slug === category.name
                          ? 'text-black font-semibold'
                          : 'text-gray-600 font-light'
                      "
                    >
                      {{ category.value }}
                    </UButton>
                  </div>
                </div>

                <!-- Brands -->
                <div v-if="item.label === 'Brands'">
                  <div class="flex flex-col gap-3">
                    <UButton
                      v-for="brand in brands"
                      variant="ghost"
                      @click="
                        selectedValue.brand === brand
                          ? (selectedValue.brand = null)
                          : (selectedValue.brand = brand)
                      "
                      class="p-0 !bg-white cursor-pointer"
                      :class="
                        selectedValue.brand === brand
                          ? 'text-black font-semibold'
                          : 'text-gray-600 font-light'
                      "
                    >
                      {{ brand }}
                    </UButton>
                  </div>
                </div>

                <!-- Materials Content -->
                <div v-if="item.label === 'Materials'">
                  <div class="flex flex-wrap items-center gap-3">
                    <UButton
                      v-for="material in materials"
                      :key="material"
                      variant="ghost"
                      @click="
                        selectedValue.material === material
                          ? (selectedValue.material = null)
                          : (selectedValue.material = material)
                      "
                      class="p-0 !bg-white cursor-pointer text-left capitalize w-[60px]"
                      :class="
                        selectedValue.material === material
                          ? 'text-black font-semibold'
                          : 'text-gray-600 font-light'
                      "
                    >
                      {{ material }}
                    </UButton>
                  </div>
                </div>
              </template>
            </UAccordion>
          </div>
        </div>
        <div class="">
          <!-- Sort -->
          <div class="mb-10">
            <USelect
              v-model="sortValue"
              value-key="id"
              :items="sortItems"
              class="w-48"
              placeholder="Sort"
              :highlight="false"
              color="neutral"
              v-on:change="handleSortChange"
            />
          </div>

          <div class="w-full min-h-[600px] p-2">
            <!-- if pending -->
            <div
              v-if="pending"
              class="w-full h-[550px] flex items-center justify-center"
            >
              <span class="loader"></span>
            </div>

            <div
              v-else-if="products.length <= 0"
              class="w-full h-[550px] flex flex-col items-center justify-center"
            >
              <p class="text-2xl mb-4">No Product Found</p>
              <UButton
                variant="ghost"
                class="text-orange-400"
                @click="router.back()"
                >Go back</UButton
              >
            </div>

            <!-- Show products -->
            <div
              v-else-if="!pending && products.length > 0"
              class="flex flex-col gap-8"
            >
              <div class="grid grid-cols-4 gap-6">
                <ProductCard
                  v-for="product in products"
                  :key="product._id"
                  :product="product"
                />
              </div>

              <!-- Pagination -->
              <div class="mt-4 w-full flex items-center justify-center">
                <UPagination
                  v-model:page="selectedValue.page"
                  active-color="neutral"
                  :total="+count"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
/* -------------------------------------------------------
 🟢 2. Router + Store
------------------------------------------------------- */
const route = useRoute();
const router = useRouter();
const productStore = useProductStore();
console.log('Product Store:', productStore.$state);
const { products, pending, count, error } = storeToRefs(productStore);

/* -------------------------------------------------------
 🟢 3. State & Data
------------------------------------------------------- */
const selectedValue = ref({
  size: '',
  color: '',
  priceLevel: '',
  brand: '',
  material: '',
  slug: '',
  sort: '',
  page: 1,
});

// Add a flag to prevent circular updates
const isUpdating = ref(false);

const sortItems = ref([
  { label: 'Price Ascending', id: 'priceAsc' },
  { label: 'Price Descending', id: 'priceDesc' },
]);
const sortValue = ref(null);

const items = [
  { label: 'Collections' },
  { label: 'Brands' },
  { label: 'Materials' },
];

const sizes = ref(['XS', 'S', 'M', 'L', 'XL', 'XXL']);
const colors = ref([
  { name: 'black', class: '!bg-black' },
  { name: 'brown', class: '!bg-amber-800' },
  { name: 'navy', class: '!bg-blue-900' },
  { name: 'pink', class: '!bg-pink-500' },
  { name: 'burgundy', class: '!bg-red-900' },
  { name: 'white', class: '!bg-white' },
  { name: 'gray', class: '!bg-gray-500' },
  { name: 'yellow', class: '!bg-yellow-400' },
  { name: 'turquoise', class: '!bg-cyan-400' },
  { name: 'light Blue', class: '!bg-blue-300' },
  { name: 'dark Blue', class: '!bg-blue-800' },
  { name: 'cream', class: '!bg-amber-100' },
  { name: 'khaki', class: '!bg-yellow-600' },
  { name: 'olive', class: '!bg-green-700' },
  { name: 'red', class: '!bg-red-500' },
  { name: 'blue', class: '!bg-blue-500' },
  { name: 'green', class: '!bg-green-500' },
  { name: 'emerald', class: '!bg-emerald-500' },
]);
const priceRange = ref([
  { name: 'budget', value: '$0 - $50' },
  { name: 'value', value: '$50 - $100' },
  { name: 'standard', value: '$100 - $150' },
  { name: 'premium', value: '$150 - $200' },
  { name: 'luxury', value: '$200 - $500' },
  { name: 'ultra', value: '$500 or more' },
]);
const brands = ref(['UrbanClassic', 'FloralChic']);
const materials = ref([
  'cotton',
  'leather',
  'viscose',
  'rayon',
  'polyester',
  'silk',
  'elastane',
  'wool',
  'lace',
  'acrylic',
  'flannel',
  'spandex',
  'chiffon',
]);
const categories = ref([
  { name: 'mens-clothing', value: 'Mens Clothing' },
  { name: 'womens-dresses', value: 'Women Dresses' },
]);

/* -------------------------------------------------------
 🟢 4. Utility Functions
------------------------------------------------------- */
function normalizeQuery(query) {
  const q = { ...query };
  if (q.page) q.page = Number(q.page);
  if (q.limit) q.limit = Number(q.limit);
  return q;
}

function getSizeClass(size) {
  return selectedValue.value.size === size
    ? '!ring-black !ring-1'
    : 'ring-1 ring-gray-400';
}

function getColorClass(color) {
  if (selectedValue.value.color === color.name) {
    return color.name === 'White'
      ? '!ring-gray-800 !ring-1'
      : '!ring-black !ring-1';
  }
  return 'ring-1 ring-gray-300';
}

function getPriceLevelClass(price) {
  return selectedValue.value.priceLevel === price.name
    ? 'text-black font-semibold'
    : 'text-gray-600 font-light';
}

/* -------------------------------------------------------
 🟢 5. Event Handlers
------------------------------------------------------- */
function handleSortChange() {
  if (sortValue.value) {
    selectedValue.value.sort = sortValue.value;
  }
}

function handleAddToCart() {
  console.log('Added to cart');
}

function handleBookmark() {
  console.log('Bookmark');
}

/* -------------------------------------------------------
 🟢 6. Watchers - FIXED
------------------------------------------------------- */
// sync: route.query → selectedValue (only when route changes externally)
watch(
  () => route.query,
  newValue => {
    if (!isUpdating.value) {
      isUpdating.value = true;

      selectedValue.value = {
        ...selectedValue.value,
        ...normalizeQuery(newValue),
      };
      // Fetch products when route changes externally (like browser back/forward)
      productStore.fetchProducts(newValue);
      nextTick(() => {
        isUpdating.value = false;
      });
    }
  }
);

// sync: selectedValue → route.query + fetch products (only when selectedValue changes internally)
watch(
  selectedValue,
  async newValue => {
    if (!isUpdating.value) {
      const queryObj = {};
      Object.keys(newValue).forEach(key => {
        if (newValue[key]) {
          queryObj[key] = newValue[key];
        }
      });

      // Update URL without triggering route watcher
      isUpdating.value = true;
      await router.push({ query: queryObj });

      // Fetch products
      await productStore.fetchProducts(queryObj);

      nextTick(() => {
        isUpdating.value = false;
      });
    }
  },
  { deep: true }
);

/* -------------------------------------------------------
 🟢 7. Lifecycle
------------------------------------------------------- */
onMounted(async () => {
  if (route.query && Object.keys(route.query).length > 0) {
    selectedValue.value = {
      ...selectedValue.value,
      ...normalizeQuery(route.query),
    };
  }
  // Initial fetch
  await productStore.fetchProducts(route.query);
});
</script>

<style scoped>
.loader {
  width: 48px;
  height: 48px;
  border: 2px solid #e2e8f0;
  border-top: 2px solid #1e293b;
  border-radius: 50%;
  animation: fade-spin 1.5s ease-in-out infinite;
}

@keyframes fade-spin {
  0% {
    transform: rotate(0deg);
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
  100% {
    transform: rotate(360deg);
    opacity: 1;
  }
}
</style>
