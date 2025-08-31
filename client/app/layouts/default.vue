<template>
  <div class="relative">
    <header class="font-primary">
      <div class="w-[1200px] h-[100px] mx-auto flex items-center gap-20">
        <div class="text-7xl">
          <nuxt-link href="/" class="block font-secondary text-7xl"
            >Fasco</nuxt-link
          >
        </div>
        <div class="flex items-center justify-between w-full gap-5">
          <div class="w-full flex items-center justify-between">
            <div class="ml-[170px] w-[400px] relative">
              <transition name="fade" mode="out-in">
                <!-- Nav -->
                <ul
                  v-if="!isSearchOpen"
                  class="flex items-center justify-between w-full absolute -top-3"
                >
                  <li v-for="nav in navItems" :key="navItems.name">
                    <u-link
                      as="button"
                      active-class="font-semibold"
                      inactive-class="text-muted"
                      :to="nav.route"
                      class="text-xl text-gray-600 mb-1 border-b border-b-transparent"
                      >{{ nav.name }}</u-link
                    >
                  </li>
                </ul>

                <!-- Search input -->
                <div
                  v-else
                  class="w-full flex items-center border-b-2 border-gray-400 absolute -top-4"
                >
                  <input
                    id="search"
                    :class="
                      cn(
                        'w-full bg-white  flex h-[35px] appearance-none items-center px-[2px] text-sm leading-none outline-none selection:color-white selection:bg-blackA9'
                      )
                    "
                    type="search"
                    placeholder="Search"
                    v-model="search"
                  />

                  <!-- Close search -->
                  <u-icon
                    name="i-material-symbols-light-close"
                    class="size-5 cursor-pointer"
                    @click="toggleSearch('close')"
                  />
                </div>
              </transition>
            </div>

            <!-- Buttons -->
            <div class="flex items-center gap-3">
              <u-icon
                name="i-material-symbols-light-search"
                class="size-7 text-black cursor-pointer"
                @click="toggleSearch"
              />
              <u-icon
                v-if="!!userStore.getUser"
                name="i-circum-user"
                class="size-7 text-black cursor-pointer"
              />
              <u-icon
                v-if="!!userStore.getUser"
                name="i-iconamoon-star-thin"
                class="size-7 text-black cursor-pointer"
              />
              <USlideover
                title="Cart Items"
                description="Manage your cart items"
                v-model="openCart"
                :ui="{
                  overlay: {
                    base: 'bg-black bg-opacity-90',
                  },
                  padding: 'p-2',
                }"
              >
                <div class="relative">
                  <u-icon
                    label="Open"
                    name="i-mdi-light-cart"
                    class="size-7 text-black cursor-pointer"
                  />
                  <p
                    v-if="cartStore.cart"
                    label="Open"
                    class="absolute top-0 -right-1 w-5 h-5 text-sm flex items-center justify-center rounded-full text-white bg-black cursor-pointer"
                  >
                    {{ cartStore.cart?.items?.length || 0 }}
                  </p>
                </div>

                <template #body>
                  <div class="flex flex-col justify-between gap-2 h-full">
                    <div class="h-full flex flex-col gap-1 overflow-y-scroll">
                      <CartItem
                        v-for="cartItem in cartStore.cart.items"
                        :key="cartItem.sku"
                        :cart-item="cartItem"
                        @quantity-change="handleQuantityChange"
                        @delete-item="handleDeleteItem"
                      />
                    </div>
                    <UButton
                      v-if="cartStore.cart && cartStore.cart.items?.length > 0"
                      size="xl"
                      :to="
                        userStore.user
                          ? '/checkout'
                          : '/auth/login?redirect=/checkout'
                      "
                      class="!bg-black text-white justify-center capitalize cursor-pointer text-[16px]"
                      >Proceed to checkout</UButton
                    >
                  </div>
                </template>
              </USlideover>
            </div>
          </div>

          <!-- Login -->
          <u-button
            v-if="!userStore.user"
            to="/auth/login"
            size="xl"
            class="px-6 !bg-black cursor-pointer"
            >Login</u-button
          >
        </div>
      </div>
    </header>
    <main>
      <slot />
    </main>
    <footer
      class="w-full h-[100px] flex flex-col justify-center border-t-2 border-gray-300 font-primary px-8"
    >
      <div class="flex items-center justify-between">
        <div class="">
          <nuxt-link to="/" class="text-3xl font-secondary block"
            >Fasco</nuxt-link
          >
        </div>

        <ul class="flex items-center gap-5">
          <li>
            <nuxt-link to="/" class="text-gray-600">Support centres</nuxt-link>
          </li>
          <li>
            <nuxt-link to="/" class="text-gray-600">Invoicing</nuxt-link>
          </li>
          <li>
            <nuxt-link to="/" class="text-gray-600">Contract</nuxt-link>
          </li>
          <li>
            <nuxt-link to="/" class="text-gray-600">Career</nuxt-link>
          </li>
          <li>
            <nuxt-link to="/" class="text-gray-600">Blogs</nuxt-link>
          </li>
          <li>
            <nuxt-link to="/" class="text-gray-600">FAQs</nuxt-link>
          </li>
        </ul>
      </div>

      <p class="text-center">copyright &copy; 2022, XPro. All Right Reserved</p>
    </footer>

    <ChatBox class="fixed top-[90%] right-0 -translate-x-10" />
  </div>
</template>

<script setup>
/* ------------------------------
   Imports
--------------------------------*/
import { useRouteQuery } from '@vueuse/router';
import { useDebounceFn } from '@vueuse/core';

/* ------------------------------
   Pinia and Composables
--------------------------------*/
const cartStore = useCartStore();
const userStore = useUserStore();
const router = useRouter();

/* ------------------------------
    State
--------------------------------*/
const search = useRouteQuery('search', '');
const isSearchOpen = ref(false);
const openCart = ref(false);

/* ------------------------------
    Derived Data
--------------------------------*/
const navItems = [
  {
    name: 'Home',
    route: '/',
  },
  {
    name: 'Collections',
    route: '/collections',
  },
  {
    name: 'About',
    route: '/about',
  },
  {
    name: 'Contact',
    route: '/contact',
  },
];

/* ------------------------------
    Methods
--------------------------------*/
function toggleSearch(val) {
  if (val === 'close') {
    isSearchOpen.value = false;
    search.value = '';
  } else {
    isSearchOpen.value = true;
  }
}
const debouncedQuantityUpdate = useDebounceFn(value => {
  cartStore.addToCart(value);
}, 1000);

function handleQuantityChange({ productId, sku, quantity }) {
  debouncedQuantityUpdate({ productId, sku, quantity });
}

async function handleDeleteItem(sku) {
  try {
    await cartStore.deleteCartItem(sku);
  } catch (error) {
    console.error('Error deleting cart item:', error);
    // Optionally, show a user-friendly error message here
    toast.add({
      title: 'Error',
      description: 'Failed to delete item from cart. Please try again.',
      type: 'error',
      duration: 5000,
    });
  }
}

router.afterEach(() => {
  openCart.value = false;
});

/* ------------------------------
   Life Cycle Hooks
--------------------------------*/
</script>

<style scoped>
.nav-active {
  border-bottom: 1px solid rgb(41, 41, 41);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.fade-enter-active {
  transition: all 150ms ease-out;
}

.fade-leave-active {
  transition: all 150ms ease-in;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateY(0px);
}
</style>
