<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import type { WeeklyStats, Appointment } from '../../types'
import { useAppointmentsStore } from '../../stores/appointments.store'
import { useAppointments } from '../../composables/useAppointments'
import { useToast } from '../../composables/useToast'
import AppCard from '../../components/ui/AppCard.vue'
import AppBadge from '../../components/ui/AppBadge.vue'
import AppSkeleton from '../../components/ui/AppSkeleton.vue'
import dayjs from 'dayjs'

type Period = 'weekly' | 'monthly' | 'total'

const appointmentsStore = useAppointmentsStore()
const { formatPrice, formatTime } = useAppointments()
const toast = useToast()

const stats = ref<WeeklyStats | null>(null)
const todayAppointments = ref<Appointment[]>([])
const loading = ref(true)
const period = ref<Period>('weekly')

const periodTabs: { value: Period; label: string }[] = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'total', label: 'Total' },
]

const maxDayCount = computed(() => {
  if (!stats.value) return 1
  return Math.max(...stats.value.appointmentsByDay.map((d) => d.count), 1)
})

async function loadStats() {
  loading.value = true
  try {
    stats.value = await appointmentsStore.fetchDashboardStats(period.value)
  } catch {
    toast.error('Erro ao carregar dados do dashboard.')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    await Promise.all([
      loadStats(),
      appointmentsStore.fetchAll({
        startDate: dayjs().format('YYYY-MM-DD'),
        endDate: dayjs().format('YYYY-MM-DD'),
        limit: 20,
      }),
    ])
    todayAppointments.value = appointmentsStore.appointments
  } catch {
    toast.error('Erro ao carregar dados do dashboard.')
  }
})

watch(period, () => loadStats())

function statusToVariant(status: string): 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' {
  return status.toLowerCase() as 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
}

const statCards = computed(() => {
  if (!stats.value) return []
  return [
    {
      label: 'Agendamentos',
      value: stats.value.totalAppointments.toString(),
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      color: 'bg-rose-50 text-rose-600',
    },
    {
      label: 'Receita',
      value: formatPrice(stats.value.totalRevenue),
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Confirmados',
      value: stats.value.confirmedCount.toString(),
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Pendentes',
      value: stats.value.pendingCount.toString(),
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'bg-yellow-50 text-yellow-600',
    },
  ]
})
</script>

<template>
  <div
    v-motion
    :initial="{ opacity: 0, y: 30 }"
    :enter="{ opacity: 1, y: 0, transition: { duration: 500 } }"
  >
    <!-- Header with period tabs -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Dashboard</h1>

      <div class="flex bg-gray-100 rounded-xl p-1 gap-1 self-start sm:self-auto">
        <button
          v-for="tab in periodTabs"
          :key="tab.value"
          type="button"
          class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
          :class="
            period === tab.value
              ? 'bg-white text-rose-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          "
          @click="period = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <AppSkeleton v-if="loading" type="card" :lines="4" />

    <template v-else>
      <!-- Stats cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div
          v-for="(card, idx) in statCards"
          :key="card.label"
          v-motion
          :initial="{ opacity: 0, y: 20 }"
          :enter="{ opacity: 1, y: 0, transition: { duration: 400, delay: idx * 80 } }"
        >
          <AppCard>
            <div class="flex items-start justify-between">
              <div class="min-w-0">
                <p class="text-xs text-gray-400 font-medium uppercase tracking-wider truncate">{{ card.label }}</p>
                <p class="text-xl sm:text-2xl font-bold text-gray-800 mt-1">{{ card.value }}</p>
              </div>
              <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0" :class="card.color">
                <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="card.icon" />
                </svg>
              </div>
            </div>
          </AppCard>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Chart -->
        <AppCard>
          <h3 class="text-sm font-semibold text-gray-800 mb-4">Agendamentos por Dia da Semana</h3>
          <div v-if="stats" class="space-y-3">
            <div
              v-for="day in stats.appointmentsByDay"
              :key="day.day"
              class="flex items-center gap-3"
            >
              <span class="text-xs text-gray-500 w-10 text-right shrink-0">{{ day.day }}</span>
              <div class="flex-1 h-7 bg-gray-50 rounded-lg overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-lg flex items-center justify-end pr-2 transition-all duration-500"
                  :style="{ width: `${Math.max((day.count / maxDayCount) * 100, 8)}%` }"
                >
                  <span class="text-xs font-bold text-white">{{ day.count }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-if="stats?.mostRequestedService" class="mt-4 pt-4 border-t border-gray-100">
            <p class="text-xs text-gray-400">Serviço mais procurado</p>
            <p class="text-sm font-semibold text-gray-800">
              {{ stats.mostRequestedService.name }}
              <span class="text-gray-400 font-normal">({{ stats.mostRequestedService.count }}x)</span>
            </p>
          </div>
        </AppCard>

        <!-- Today's appointments -->
        <AppCard>
          <h3 class="text-sm font-semibold text-gray-800 mb-4">Agendamentos de Hoje</h3>
          <div v-if="todayAppointments.length === 0" class="text-center py-8">
            <p class="text-sm text-gray-400">Nenhum agendamento para hoje</p>
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="apt in todayAppointments"
              :key="apt.id"
              class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center shrink-0">
                  <span class="text-xs font-bold text-rose-600">{{ formatTime(apt.scheduledTime) }}</span>
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-gray-700 truncate">{{ apt.user?.name || 'Cliente' }}</p>
                  <p class="text-xs text-gray-400 truncate">
                    {{ apt.appointmentServices.map(s => s.service.name).join(', ') }}
                  </p>
                </div>
              </div>
              <div class="shrink-0 ml-2">
                <AppBadge :variant="statusToVariant(apt.status)" />
              </div>
            </div>
          </div>
        </AppCard>
      </div>
    </template>
  </div>
</template>
