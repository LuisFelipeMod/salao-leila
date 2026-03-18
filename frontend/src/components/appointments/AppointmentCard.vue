<script setup lang="ts">
import type { Appointment } from '../../types'
import { useAppointments } from '../../composables/useAppointments'
import AppBadge from '../ui/AppBadge.vue'

interface Props {
  appointment: Appointment
  index?: number
}

const props = withDefaults(defineProps<Props>(), {
  index: 0,
})

defineEmits<{
  select: [appointment: Appointment]
}>()

const { formatPrice, formatDate, formatTime } = useAppointments()

function statusToVariant(status: string): 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' {
  return status.toLowerCase() as 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
}
</script>

<template>
  <div
    v-motion
    :initial="{ opacity: 0, y: 20 }"
    :enter="{ opacity: 1, y: 0, transition: { duration: 400, delay: props.index * 80 } }"
    class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md hover:border-rose-100 transition-all duration-200"
    @click="$emit('select', appointment)"
  >
    <div class="flex items-start justify-between mb-3">
      <div>
        <p class="text-sm font-semibold text-gray-800">
          {{ formatDate(appointment.scheduledDate) }}
        </p>
        <p class="text-xs text-gray-500 mt-0.5">
          {{ formatTime(appointment.scheduledTime) }}
        </p>
      </div>
      <AppBadge :variant="statusToVariant(appointment.status)" />
    </div>

    <div class="space-y-1.5 mb-3">
      <div
        v-for="item in appointment.appointmentServices"
        :key="item.id"
        class="flex items-center gap-2 text-sm text-gray-600"
      >
        <div class="w-1.5 h-1.5 rounded-full bg-rose-300" />
        <span>{{ item.service.name }}</span>
      </div>
    </div>

    <div class="flex items-center justify-between pt-3 border-t border-gray-50">
      <span class="text-xs text-gray-400">
        {{ appointment.appointmentServices.length }} serviço{{ appointment.appointmentServices.length > 1 ? 's' : '' }}
      </span>
      <span class="text-sm font-bold text-rose-600">
        {{ formatPrice(appointment.totalPrice) }}
      </span>
    </div>
  </div>
</template>
