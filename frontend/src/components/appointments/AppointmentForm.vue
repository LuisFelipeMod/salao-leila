<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Appointment } from '../../types'
import { useServicesStore } from '../../stores/services.store'
import AppInput from '../ui/AppInput.vue'
import AppButton from '../ui/AppButton.vue'
import ServiceSelector from './ServiceSelector.vue'

interface Props {
  appointment?: Appointment
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  submit: [data: { scheduledDate: string; scheduledTime: string; notes: string; serviceIds: string[] }]
  cancel: []
}>()

const servicesStore = useServicesStore()

const selectedServices = ref<string[]>([])
const scheduledDate = ref('')
const scheduledTime = ref('')
const notes = ref('')

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00',
]

onMounted(async () => {
  if (servicesStore.services.length === 0) {
    await servicesStore.fetchServices()
  }

  if (props.appointment) {
    selectedServices.value = props.appointment.appointmentServices.map((s) => s.serviceId)
    scheduledDate.value = props.appointment.scheduledDate
    scheduledTime.value = props.appointment.scheduledTime.slice(0, 5)
    notes.value = props.appointment.notes || ''
  }
})

function handleSubmit() {
  emit('submit', {
    scheduledDate: scheduledDate.value,
    scheduledTime: scheduledTime.value,
    notes: notes.value,
    serviceIds: selectedServices.value,
  })
}

const activeServices = servicesStore.services.filter((s) => s.isActive)
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-5">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Serviços</label>
      <ServiceSelector
        :services="activeServices"
        v-model="selectedServices"
      />
    </div>

    <AppInput
      v-model="scheduledDate"
      label="Data"
      type="date"
    />

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1.5">Horário</label>
      <select
        v-model="scheduledTime"
        class="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-colors"
      >
        <option value="" disabled>Selecione um horário</option>
        <option v-for="slot in timeSlots" :key="slot" :value="slot">{{ slot }}</option>
      </select>
    </div>

    <AppInput
      v-model="notes"
      label="Observações (opcional)"
      placeholder="Alguma preferência ou observação?"
    />

    <div class="flex gap-3 pt-2">
      <AppButton type="submit" :loading="loading" :disabled="!selectedServices.length || !scheduledDate || !scheduledTime">
        Salvar
      </AppButton>
      <AppButton variant="secondary" @click="$emit('cancel')">
        Cancelar
      </AppButton>
    </div>
  </form>
</template>
