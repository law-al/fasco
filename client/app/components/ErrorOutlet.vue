<template>
  <client-only>
    <p
      :class="
        cn(
          'italic text-red-500 text-sm transition-all duration-300 ease-in-out h-[0px]',
          error ? 'visible opacity-100 ' : 'invisible opacity-0 '
        )
      "
    >
      {{ typeof error === 'string' ? error : '' }}
    </p>
  </client-only>
</template>

<script setup>
  defineProps({
    error: [String, Array, Object],
  });
</script>
