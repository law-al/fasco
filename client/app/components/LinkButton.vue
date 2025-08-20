<template>
  <nuxt-link
    :to="to"
    :class="
      cn(
        'border border-blue-400 text-gray-600 w-[200px] py-2 cursor-pointer rounded-sm flex items-center justify-center',
        className
      )
    "
  >
    <slot> Click me </slot>
  </nuxt-link>
</template>

<script setup>
  defineProps({
    to: {
      type: String,
      default: '/',
    },
    className: {
      type: String,
      default: '',
    },
  });
</script>
