<script setup lang="ts">
import type { Toast } from '../../types'

defineProps<{ toast: Toast }>()

const typeStyles: Record<string, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}

const typeIcons: Record<string, string> = {
  success: 'M5 13l4 4L19 7',
  error: 'M6 18L18 6M6 6l12 12',
  warning: 'M12 9v2m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
}
</script>

<template>
  <div
    v-motion
    :initial="{ opacity: 0, x: 100 }"
    :enter="{ opacity: 1, x: 0, transition: { duration: 300 } }"
    :leave="{ opacity: 0, x: 100, transition: { duration: 200 } }"
    class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg min-w-[300px] max-w-[420px]"
    :class="typeStyles[toast.type]"
  >
    <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="typeIcons[toast.type]" />
    </svg>
    <p class="text-sm font-medium flex-1">{{ toast.message }}</p>
    <slot />
  </div>
</template>
