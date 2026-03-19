<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth.store'
import { useUiStore } from '../../stores/ui.store'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const uiStore = useUiStore()

const isAdminRoute = computed(() => route.path.startsWith('/admin'))

const clientLinks = [
  { name: 'Início', path: '/' },
  { name: 'Agendar', path: '/booking' },
  { name: 'Histórico', path: '/history' },
]

const adminLinks = [
  { name: 'Dashboard', path: '/admin/dashboard' },
  { name: 'Agendamentos', path: '/admin/appointments' },
  { name: 'Serviços', path: '/admin/services' },
]

const navLinks = computed(() => (authStore.isAdmin ? adminLinks : clientLinks))

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <header class="bg-white border-b border-gray-100 sticky top-0 z-40">
    <div :class="isAdminRoute ? 'px-4 sm:px-6' : 'max-w-7xl mx-auto px-4 sm:px-6'">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center gap-4">
          <button
            v-if="isAdminRoute"
            @click="uiStore.toggleSidebar()"
            class="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <router-link to="/" class="flex items-center gap-2">
            <div class="w-8 h-8 bg-gradient-to-br from-rose-400 to-rose-600 rounded-xl flex items-center justify-center">
              <span class="text-white font-bold text-sm">L</span>
            </div>
            <span class="text-xl font-bold bg-gradient-to-r from-rose-500 to-rose-600 bg-clip-text text-transparent">
              Leila
            </span>
          </router-link>
        </div>

        <nav class="hidden md:flex items-center gap-1">
          <router-link
            v-for="link in navLinks"
            :key="link.path"
            :to="link.path"
            class="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            :class="
              route.path === link.path
                ? 'bg-rose-50 text-rose-600'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            "
          >
            {{ link.name }}
          </router-link>
        </nav>

        <div class="flex items-center gap-3">
          <span v-if="authStore.user" class="hidden sm:block text-sm text-gray-600">
            Olá, <span class="font-semibold text-gray-800">{{ authStore.user.name.split(' ')[0] }}</span>
          </span>
          <button
            @click="logout"
            class="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span class="hidden sm:inline">Sair</span>
          </button>
        </div>

        <!-- Mobile nav -->
        <div class="flex md:hidden items-center">
          <button
            v-if="!isAdminRoute"
            @click="uiStore.toggleSidebar()"
            class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile menu -->
    <Transition name="slide-down">
      <div v-if="uiStore.sidebarOpen && !isAdminRoute" class="md:hidden border-t border-gray-100 bg-white">
        <div class="px-4 py-3 space-y-1">
          <router-link
            v-for="link in navLinks"
            :key="link.path"
            :to="link.path"
            @click="uiStore.closeSidebar()"
            class="block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            :class="
              route.path === link.path
                ? 'bg-rose-50 text-rose-600'
                : 'text-gray-600 hover:bg-gray-50'
            "
          >
            {{ link.name }}
          </router-link>
        </div>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
