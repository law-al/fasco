<template>
  <div
    class="flex w-full h-[140px] p-1 font-primary border-2 rounded-md border-gray-200 items-center gap-2"
  >
    <div class="flex-1 h-full">
      <img
        :src="cartItem.image"
        alt="Alt text"
        class="object-cover h-full w-full"
      />
    </div>
    <div class="flex-3 flex justify-between">
      <div
        class="

        "
      >
        <div class="mb-2">
          <p class="text-black font-semibold text-lg capitalize">
            {{ cartItem.name }}
          </p>
          <p class="text-sm">Color | {{ cartItem.color }}</p>
          <p class="text-sm">Size | {{ cartItem.size }}</p>
          <p class="text-sm">Price | ${{ cartItem.priceAtTimeAdded }}</p>
        </div>

        <div
          class="flex overflow-hidden w-fit bg-gray-400/10 border border-gray-400 rounded-md items-center gap-1.5"
        >
          <u-button
            size="xl"
            variant="outline"
            :disabled="quantity <= 1"
            @click="decreaseQuantity"
            class="w-[25px] h-[25px] cursor-pointer justify-center ring-0"
            >-</u-button
          >

          <p
            class="

            "
          >
            {{ quantity }}
          </p>

          <u-button
            size="xl"
            variant="outline"
            class="w-[25px] h-[25px] cursor-pointer justify-center ring-0"
            :disabled="quantity >= cartItem.maxQuantity"
            @click="increaseQuantity"
            >+</u-button
          >
        </div>
      </div>

      <div class="cursor-pointer" @click="removeItem">
        <UIcon name="i-carbon-close-outline" class="text-red-700 size-5" />
      </div>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['quantity-change', 'delete-item']);
const props = defineProps({
  cartItem: {
    type: Object,
  },
});

/* ------------------------------
   Stores
--------------------------------*/
const cartStore = useCartStore();

const quantity = ref(props.cartItem.quantity);

/* ------------------------------
   Functions
--------------------------------*/
function decreaseQuantity() {
  if (quantity.value > 1) {
    --quantity.value;
    emit('quantity-change', {
      productId: props.cartItem.productId,
      sku: props.cartItem.sku,
      quantity: quantity.value,
    });
  }
}

function increaseQuantity() {
  if (quantity.value < props.cartItem.maxQuantity) {
    ++quantity.value;
    emit('quantity-change', {
      productId: props.cartItem.productId,
      sku: props.cartItem.sku,
      quantity: quantity.value,
    });
  }
}

function removeItem() {
  emit('delete-item', props.cartItem.sku);
}
</script>

<style lang="scss" scoped></style>
