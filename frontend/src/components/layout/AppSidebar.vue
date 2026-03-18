<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useUiStore } from '../../stores/ui.store'

const route = useRoute()
const uiStore = useUiStore()

const links = [
  {
    name: 'Dashboard',
    path: '/admin/dashboard',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    name: 'Agendamentos',
    path: '/admin/appointments',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  {
    name: 'Serviços',
    path: '/admin/services',
    icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
  },
]
</script>

<template>
  <!-- Backdrop on mobile -->
  <Transition name="fade">
    <div
      v-if="uiStore.sidebarOpen"
      class="fixed inset-0 bg-black/30 z-40 lg:hidden"
      @click="uiStore.closeSidebar()"
    />
  </Transition>

  <aside
    class="fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-100 z-40 transition-transform duration-300 lg:translate-x-0"
    :class="uiStore.sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <div class="p-4 space-y-1">
      <router-link
        v-for="link in links"
        :key="link.path"
        :to="link.path"
        @click="uiStore.closeSidebar()"
        class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
        :class="
          route.path === link.path
            ? 'bg-rose-50 text-rose-600'
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
        "
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="link.icon" />
        </svg>
        {{ link.name }}
      </router-link>
    </div>
  </aside>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
