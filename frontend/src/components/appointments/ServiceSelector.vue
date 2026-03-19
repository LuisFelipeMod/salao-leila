<script setup lang="ts">
import { computed } from 'vue'
import type { SalonService } from '../../types'
import { useAppointments } from '../../composables/useAppointments'

interface Props {
  services: SalonService[]
  modelValue: string[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const { formatPrice } = useAppointments()

function toggleService(id: string) {
  const current = [...props.modelValue]
  const idx = current.indexOf(id)
  if (idx === -1) {
    current.push(id)
  } else {
    current.splice(idx, 1)
  }
  emit('update:modelValue', current)
}

function isSelected(id: string) {
  return props.modelValue.includes(id)
}

const totalPrice = computed(() => {
  return props.services
    .filter((s) => props.modelValue.includes(s.id))
    .reduce((sum, s) => sum + Number(s.price), 0)
})

const totalDuration = computed(() => {
  return props.services
    .filter((s) => props.modelValue.includes(s.id))
    .reduce((sum, s) => sum + s.durationMinutes, 0)
})
</script>

<template>
  <div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div
        v-for="(service, index) in services"
        :key="service.id"
        v-motion
        :initial="{ opacity: 0, y: 15 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 300, delay: index * 60 } }"
        class="relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200"
        :class="
          isSelected(service.id)
            ? 'border-rose-400 bg-rose-50 shadow-sm'
            : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
        "
        @click="toggleService(service.id)"
      >
        <div
          v-if="isSelected(service.id)"
          class="absolute top-3 right-3 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center"
        >
          <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h4 class="font-semibold text-gray-800 text-sm mb-1 pr-6">{{ service.name }}</h4>
        <p class="text-xs text-gray-500 mb-2 line-clamp-2">{{ service.description }}</p>
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400">{{ service.durationMinutes }} min</span>
          <span class="text-sm font-bold text-rose-600">{{ formatPrice(service.price) }}</span>
        </div>
      </div>
    </div>

    <div v-if="modelValue.length > 0" class="mt-4 p-3 bg-gray-50 rounded-xl flex items-center justify-between">
      <div class="text-sm text-gray-600">
        <span class="font-medium">{{ modelValue.length }}</span> serviço{{ modelValue.length > 1 ? 's' : '' }}
        &middot;
        <span class="font-medium">{{ totalDuration }} min</span>
      </div>
      <div class="text-sm font-bold text-rose-600">{{ formatPrice(totalPrice) }}</div>
    </div>
  </div>
</template>
