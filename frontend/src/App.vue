<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth.store'
import AppHeader from './components/layout/AppHeader.vue'
import AppFooter from './components/layout/AppFooter.vue'
import AppSidebar from './components/layout/AppSidebar.vue'
import AppToast from './components/ui/AppToast.vue'

const route = useRoute()
const authStore = useAuthStore()

const isAuthRoute = computed(() => route.path === '/login' || route.path === '/register')
const isAdminRoute = computed(() => route.path.startsWith('/admin'))
const showLayout = computed(() => !isAuthRoute.value && authStore.isAuthenticated)

onMounted(async () => {
  if (authStore.token && !authStore.user) {
    await authStore.fetchMe()
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <AppToast />

    <template v-if="showLayout">
      <AppHeader />

      <!-- Admin layout: sidebar + content side by side -->
      <div v-if="isAdminRoute" class="flex flex-1">
        <AppSidebar />
        <main class="flex-1 p-6 min-w-0">
          <router-view />
        </main>
      </div>

      <!-- Client layout -->
      <template v-else>
        <main class="flex-1">
          <router-view />
        </main>
        <AppFooter />
      </template>
    </template>

    <template v-else>
      <router-view />
    </template>
  </div>
</template>
