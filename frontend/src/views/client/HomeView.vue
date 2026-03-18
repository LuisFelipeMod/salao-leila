<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.store'
import { useAppointmentsStore } from '../../stores/appointments.store'
import { useAppointments } from '../../composables/useAppointments'
import AppointmentCard from '../../components/appointments/AppointmentCard.vue'
import AppButton from '../../components/ui/AppButton.vue'
import AppSkeleton from '../../components/ui/AppSkeleton.vue'
import type { Appointment } from '../../types'

const router = useRouter()
const authStore = useAuthStore()
const appointmentsStore = useAppointmentsStore()
const { formatPrice } = useAppointments()

const recentAppointments = ref<Appointment[]>([])
const loadingAppointments = ref(true)

onMounted(async () => {
  try {
    await appointmentsStore.fetchMyAppointments()
    recentAppointments.value = appointmentsStore.appointments.slice(0, 3)
  } catch {
    // silent
  } finally {
    loadingAppointments.value = false
  }
})

function goToDetail(appointment: Appointment) {
  router.push(`/appointments/${appointment.id}`)
}

// suppress unused variable warning
void formatPrice
</script>

<template>
  <div
    v-motion
    :initial="{ opacity: 0, y: 30 }"
    :enter="{ opacity: 1, y: 0, transition: { duration: 500 } }"
    class="max-w-4xl mx-auto px-4 py-8"
  >
    <!-- Greeting -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">
        Olá, {{ authStore.user?.name.split(' ')[0] }}!
      </h1>
      <p class="text-gray-500">Que bom ter você por aqui. O que deseja fazer hoje?</p>
    </div>

    <!-- Quick actions -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
      <div
        v-motion
        :initial="{ opacity: 0, y: 20 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 400, delay: 100 } }"
        class="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-6 text-white cursor-pointer hover:shadow-lg hover:shadow-rose-200 transition-all duration-300"
        @click="router.push('/booking')"
      >
        <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h3 class="text-lg font-bold mb-1">Agendar Horário</h3>
        <p class="text-rose-100 text-sm">Escolha os serviços e marque seu horário</p>
      </div>

      <div
        v-motion
        :initial="{ opacity: 0, y: 20 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 400, delay: 200 } }"
        class="bg-white rounded-2xl p-6 border border-gray-100 cursor-pointer hover:shadow-lg hover:border-rose-100 transition-all duration-300"
        @click="router.push('/history')"
      >
        <div class="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-lg font-bold text-gray-800 mb-1">Meus Agendamentos</h3>
        <p class="text-gray-500 text-sm">Veja seu histórico de agendamentos</p>
      </div>
    </div>

    <!-- Recent appointments -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold text-gray-800">Agendamentos Recentes</h2>
        <AppButton v-if="recentAppointments.length > 0" variant="ghost" size="sm" @click="router.push('/history')">
          Ver todos
        </AppButton>
      </div>

      <AppSkeleton v-if="loadingAppointments" type="list" :lines="3" />

      <div v-else-if="recentAppointments.length === 0" class="text-center py-12 bg-white rounded-2xl border border-gray-100">
        <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 class="text-gray-600 font-semibold mb-1">Nenhum agendamento ainda</h3>
        <p class="text-gray-400 text-sm mb-4">Que tal agendar seu primeiro horário?</p>
        <AppButton size="sm" @click="router.push('/booking')">Agendar Agora</AppButton>
      </div>

      <div v-else class="grid gap-3">
        <AppointmentCard
          v-for="(apt, idx) in recentAppointments"
          :key="apt.id"
          :appointment="apt"
          :index="idx"
          @select="goToDetail"
        />
      </div>
    </div>
  </div>
</template>
