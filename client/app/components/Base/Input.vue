<template>
  <input
    :id="id"
    :class="
      cn(
        'bg-white border-b-2 border-gray-400  inline-flex h-[35px] w-[200px] appearance-none items-center justify-center px-[10px] text-sm leading-none outline-none selection:color-white selection:bg-blackA9',
        className
      )
    "
    :type="type"
    :placeholder="placeholder"
  />
</template>

<script setup>
  defineProps({
    className: String,
    type: {
      type: String,
      default: 'text',
    },
    placeholder: String,
    id: String,
  });
</script>

<style lang="scss" scoped></style>
