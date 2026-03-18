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

const name = ref('')
const email = ref('')
const phone = ref('')
const password = ref('')
const errors = ref<{ name?: string; email?: string; phone?: string; password?: string }>({})

function validate(): boolean {
  errors.value = {}
  if (!name.value.trim()) {
    errors.value.name = 'O nome é obrigatório'
  }
  if (!email.value) {
    errors.value.email = 'O e-mail é obrigatório'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    errors.value.email = 'E-mail inválido'
  }
  if (!phone.value.trim()) {
    errors.value.phone = 'O telefone é obrigatório'
  } else if (phone.value.replace(/\D/g, '').length < 10) {
    errors.value.phone = 'Telefone inválido'
  }
  if (!password.value) {
    errors.value.password = 'A senha é obrigatória'
  } else if (password.value.length < 6) {
    errors.value.password = 'A senha deve ter pelo menos 6 caracteres'
  }
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validate()) return

  try {
    await authStore.register({
      name: name.value,
      email: email.value,
      phone: phone.value,
      password: password.value,
    })
    router.push('/')
    toast.success('Conta criada com sucesso!')
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    toast.error(error.response?.data?.message || 'Erro ao criar conta. Tente novamente.')
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
        <h1 class="text-2xl font-bold text-gray-800">Crie sua conta</h1>
        <p class="text-sm text-gray-500 mt-1">Cadastre-se para agendar seus horários</p>
      </div>

      <div class="bg-white rounded-2xl shadow-xl shadow-gray-100/50 p-8 border border-gray-100">
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <AppInput
            v-model="name"
            label="Nome completo"
            placeholder="Seu nome"
            :error="errors.name"
          />

          <AppInput
            v-model="email"
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            :error="errors.email"
          />

          <AppInput
            v-model="phone"
            label="Telefone"
            type="tel"
            placeholder="(11) 99999-9999"
            :error="errors.phone"
          />

          <AppInput
            v-model="password"
            label="Senha"
            type="password"
            placeholder="Mínimo 6 caracteres"
            :error="errors.password"
          />

          <AppButton type="submit" :loading="authStore.loading" class="w-full">
            Cadastrar
          </AppButton>
        </form>

        <p class="text-center text-sm text-gray-500 mt-6">
          Já tem uma conta?
          <router-link to="/login" class="text-rose-500 hover:text-rose-600 font-semibold">
            Entrar
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>
