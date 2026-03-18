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
      <AppSidebar v-if="isAdminRoute" />

      <main
        class="flex-1"
        :class="isAdminRoute ? 'lg:ml-64 p-6' : ''"
      >
        <router-view />
      </main>

      <AppFooter v-if="!isAdminRoute" />
    </template>

    <template v-else>
      <router-view />
    </template>
  </div>
</template>
