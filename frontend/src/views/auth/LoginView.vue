<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.store'
import { useToast } from '../../composables/useToast'
import AppInput from '../../components/ui/AppInput.vue'
import AppButton from '../../components/ui/AppButton.vue'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const email = ref('')
const password = ref('')
const errors = ref<{ email?: string; password?: string }>({})

function validate(): boolean {
  errors.value = {}
  if (!email.value) {
    errors.value.email = 'O e-mail é obrigatório'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    errors.value.email = 'E-mail inválido'
  }
  if (!password.value) {
    errors.value.password = 'A senha é obrigatória'
  }
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validate()) return

  try {
    await authStore.login({ email: email.value, password: password.value })
    if (authStore.isAdmin) {
      router.push('/admin/dashboard')
    } else {
      router.push('/')
    }
    toast.success('Bem-vinda de volta!')
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    toast.error(error.response?.data?.message || 'E-mail ou senha incorretos.')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-white flex items-center justify-center p-4">
    <div
      v-motion
      :initial="{ opacity: 0, y: 30 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 500 } }"
      class="w-full max-w-md"
    >
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-gradient-to-br from-rose-400 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-200">
          <span class="text-white font-bold text-2xl">L</span>
        </div>
        <h1 class="text-2xl font-bold text-gray-800">Bem-vinda ao Salão Leila</h1>
        <p class="text-sm text-gray-500 mt-1">Entre com sua conta para continuar</p>
      </div>

      <div class="bg-white rounded-2xl shadow-xl shadow-gray-100/50 p-8 border border-gray-100">
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <AppInput
            v-model="email"
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            :error="errors.email"
          />

          <AppInput
            v-model="password"
            label="Senha"
            type="password"
            placeholder="Sua senha"
            :error="errors.password"
          />

          <AppButton type="submit" :loading="authStore.loading" class="w-full">
            Entrar
          </AppButton>
        </form>

        <p class="text-center text-sm text-gray-500 mt-6">
          Não tem uma conta?
          <router-link to="/register" class="text-rose-500 hover:text-rose-600 font-semibold">
            Cadastre-se
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>
