<template>
  <button
    :type="type"
    :disabled="loading"
    :class="
      cn(
        'rounded-sm px-4 py-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-80',
        variant === 'main' && 'bg-black border border-current text-white',
        variant === 'flat' && 'text-indigo-900 bg-white border border-current',
        variant === 'success' &&
          'bg-indigo-900 text-white border border-current'
      )
    "
  >
    <slot>Click me</slot>
  </button>
</template>

<script setup>
  import { boolean } from 'zod';

  defineProps({
    variant: { type: String, default: 'primary' },
    type: { type: String, default: 'button' },
    loading: { type: Boolean, default: false },
  });
</script>
