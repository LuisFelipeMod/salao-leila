<script setup lang="ts">
interface Props {
  lines?: number
  type?: 'card' | 'list' | 'text'
}

withDefaults(defineProps<Props>(), {
  lines: 3,
  type: 'text',
})
</script>

<template>
  <div v-if="type === 'card'" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
    <div class="skeleton-pulse bg-gray-200 rounded-lg h-5 w-3/4 mb-4" />
    <div v-for="i in lines" :key="i" class="skeleton-pulse bg-gray-100 rounded h-4 mb-2" :class="i === lines ? 'w-1/2' : 'w-full'" />
  </div>

  <div v-else-if="type === 'list'" class="space-y-3">
    <div
      v-for="i in lines"
      :key="i"
      class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4"
    >
      <div class="skeleton-pulse bg-gray-200 rounded-full h-10 w-10 shrink-0" />
      <div class="flex-1 space-y-2">
        <div class="skeleton-pulse bg-gray-200 rounded h-4 w-2/3" />
        <div class="skeleton-pulse bg-gray-100 rounded h-3 w-1/3" />
      </div>
    </div>
  </div>

  <div v-else class="space-y-2">
    <div
      v-for="i in lines"
      :key="i"
      class="skeleton-pulse bg-gray-200 rounded h-4"
      :class="i === lines ? 'w-2/3' : 'w-full'"
    />
  </div>
</template>
