<script setup lang="ts">
import { useUiStore } from '../../stores/ui.store'
import AppToastItem from './AppToastItem.vue'

const uiStore = useUiStore()
</script>

<template>
  <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
    <AppToastItem
      v-for="toast in uiStore.toasts"
      :key="toast.id"
      :toast="toast"
    >
      <button
        @click="uiStore.removeToast(toast.id)"
        class="shrink-0 p-0.5 rounded hover:bg-black/5 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </AppToastItem>
  </div>
</template>
