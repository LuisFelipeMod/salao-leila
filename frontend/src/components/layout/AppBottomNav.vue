<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-100">
    <div class="flex items-end justify-around px-6 pt-2 pb-3">
      <!-- Início -->
      <router-link
        to="/"
        class="flex flex-col items-center gap-1 transition-colors"
        :class="route.path === '/' ? 'text-rose-600' : 'text-gray-400'"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span class="text-xs font-medium">Início</span>
      </router-link>

      <!-- Agendar (FAB elevado) -->
      <router-link to="/booking" class="flex flex-col items-center gap-1 -mt-5">
        <div
          class="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200 transition-colors"
          :class="route.path === '/booking' ? 'bg-rose-600' : 'bg-rose-500'"
        >
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <span class="text-xs font-medium" :class="route.path === '/booking' ? 'text-rose-600' : 'text-gray-400'">Agendar</span>
      </router-link>

      <!-- Histórico -->
      <router-link
        to="/history"
        class="flex flex-col items-center gap-1 transition-colors"
        :class="route.path.startsWith('/history') || route.path.startsWith('/appointments') ? 'text-rose-600' : 'text-gray-400'"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="text-xs font-medium">Histórico</span>
      </router-link>
    </div>
  </nav>
</template>
