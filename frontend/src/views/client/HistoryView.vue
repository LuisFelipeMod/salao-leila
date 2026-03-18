<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppointmentsStore } from '../../stores/appointments.store'
import AppointmentCard from '../../components/appointments/AppointmentCard.vue'
import AppInput from '../../components/ui/AppInput.vue'
import AppButton from '../../components/ui/AppButton.vue'
import AppSkeleton from '../../components/ui/AppSkeleton.vue'
import type { Appointment } from '../../types'

const router = useRouter()
const appointmentsStore = useAppointmentsStore()

const startDate = ref('')
const endDate = ref('')

onMounted(() => {
  loadAppointments()
})

async function loadAppointments() {
  const params: { startDate?: string; endDate?: string } = {}
  if (startDate.value) params.startDate = startDate.value
  if (endDate.value) params.endDate = endDate.value
  await appointmentsStore.fetchMyAppointments(params)
}

function filterAppointments() {
  loadAppointments()
}

function clearFilters() {
  startDate.value = ''
  endDate.value = ''
  loadAppointments()
}

function goToDetail(appointment: Appointment) {
  router.push(`/appointments/${appointment.id}`)
}
</script>

<template>
  <div
    v-motion
    :initial="{ opacity: 0, y: 30 }"
    :enter="{ opacity: 1, y: 0, transition: { duration: 500 } }"
    class="max-w-4xl mx-auto px-4 py-8"
  >
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Meus Agendamentos</h1>

    <!-- Filters -->
    <div class="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
      <div class="flex flex-col sm:flex-row gap-3 items-end">
        <div class="flex-1">
          <AppInput v-model="startDate" label="Data inicial" type="date" />
        </div>
        <div class="flex-1">
          <AppInput v-model="endDate" label="Data final" type="date" />
        </div>
        <div class="flex gap-2">
          <AppButton size="sm" @click="filterAppointments">Filtrar</AppButton>
          <AppButton size="sm" variant="ghost" @click="clearFilters">Limpar</AppButton>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <AppSkeleton v-if="appointmentsStore.loading" type="list" :lines="4" />

    <!-- Empty -->
    <div v-else-if="appointmentsStore.appointments.length === 0" class="text-center py-16 bg-white rounded-2xl border border-gray-100">
      <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h3 class="text-gray-600 font-semibold mb-1">Nenhum agendamento encontrado</h3>
      <p class="text-gray-400 text-sm mb-4">
        {{ startDate || endDate ? 'Tente alterar os filtros de data.' : 'Você ainda não fez nenhum agendamento.' }}
      </p>
      <AppButton size="sm" @click="router.push('/booking')">Agendar Agora</AppButton>
    </div>

    <!-- List -->
    <div v-else class="grid gap-3">
      <AppointmentCard
        v-for="(apt, idx) in appointmentsStore.appointments"
        :key="apt.id"
        :appointment="apt"
        :index="idx"
        @select="goToDetail"
      />
    </div>
  </div>
</template>
