<script setup lang="ts">
interface Props {
  padding?: boolean
}

withDefaults(defineProps<Props>(), {
  padding: true,
})
</script>

<template>
  <div
    class="bg-white rounded-2xl shadow-sm border border-gray-100"
    :class="{ 'p-6': padding }"
  >
    <slot />
  </div>
</template>
