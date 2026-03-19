<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useServicesStore } from '../../stores/services.store'
import { useAppointmentsStore } from '../../stores/appointments.store'
import { useAppointments } from '../../composables/useAppointments'
import { useToast } from '../../composables/useToast'
import ServiceSelector from './ServiceSelector.vue'
import AppButton from '../ui/AppButton.vue'
import AppInput from '../ui/AppInput.vue'

const servicesStore = useServicesStore()
const appointmentsStore = useAppointmentsStore()
const { formatPrice } = useAppointments()
const toast = useToast()

const currentStep = ref(1)
const selectedServiceIds = ref<string[]>([])
const scheduledDate = ref('')
const scheduledTime = ref('')
const notes = ref('')
const loading = ref(false)
const weekWarning = ref('')
const bookingSuccess = ref(false)
const slideDirection = ref<'left' | 'right'>('left')

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00',
]

const activeServices = computed(() => servicesStore.services.filter((s) => s.isActive))

const selectedServices = computed(() =>
  servicesStore.services.filter((s) => selectedServiceIds.value.includes(s.id))
)

const totalPrice = computed(() =>
  selectedServices.value.reduce((sum, s) => sum + Number(s.price), 0)
)

const totalDuration = computed(() =>
  selectedServices.value.reduce((sum, s) => sum + s.durationMinutes, 0)
)

const canGoToStep2 = computed(() => selectedServiceIds.value.length > 0)
const canGoToStep3 = computed(() => scheduledDate.value && scheduledTime.value)

onMounted(async () => {
  if (servicesStore.services.length === 0) {
    await servicesStore.fetchServices()
  }
})

async function goToStep(step: number) {
  if (step > currentStep.value) {
    slideDirection.value = 'left'
  } else {
    slideDirection.value = 'right'
  }

  if (step === 3 && scheduledDate.value) {
    try {
      weekWarning.value = ''
      const result = await appointmentsStore.checkWeek(scheduledDate.value)
      if (result.hasAppointment) {
        weekWarning.value = 'Você já possui um agendamento nesta semana. Você pode continuar, mas fique atento(a) aos horários.'
      }
    } catch {
      // Non-blocking, just skip the check
    }
  }

  currentStep.value = step
}

async function confirmBooking() {
  if (!selectedServiceIds.value.length || !scheduledDate.value || !scheduledTime.value) {
    toast.error('Preencha todos os campos obrigatórios.')
    return
  }

  loading.value = true
  try {
    await appointmentsStore.createAppointment({
      scheduledDate: scheduledDate.value,
      scheduledTime: scheduledTime.value,
      notes: notes.value || undefined,
      serviceIds: selectedServiceIds.value,
    })
    bookingSuccess.value = true
    toast.success('Agendamento realizado com sucesso!')
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    toast.error(error.response?.data?.message || 'Erro ao realizar agendamento.')
  } finally {
    loading.value = false
  }
}

function resetBooking() {
  currentStep.value = 1
  selectedServiceIds.value = []
  scheduledDate.value = ''
  scheduledTime.value = ''
  notes.value = ''
  weekWarning.value = ''
  bookingSuccess.value = false
}

const steps = [
  { number: 1, label: 'Serviços' },
  { number: 2, label: 'Data e Hora' },
  { number: 3, label: 'Confirmação' },
]
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <!-- Success state -->
    <div v-if="bookingSuccess" class="text-center py-12">
      <div
        v-motion
        :initial="{ opacity: 0, scale: 0 }"
        :enter="{ opacity: 1, scale: 1, transition: { duration: 500, type: 'spring', stiffness: 200, damping: 10 } }"
        class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <svg class="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2
        v-motion
        :initial="{ opacity: 0, y: 20 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 400, delay: 300 } }"
        class="text-2xl font-bold text-gray-800 mb-2"
      >
        Agendamento Confirmado!
      </h2>
      <p
        v-motion
        :initial="{ opacity: 0, y: 20 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 400, delay: 400 } }"
        class="text-gray-500 mb-8"
      >
        Seu horário foi reservado com sucesso. Aguarde a confirmação.
      </p>
      <div
        v-motion
        :initial="{ opacity: 0, y: 20 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 400, delay: 500 } }"
        class="flex gap-3 justify-center"
      >
        <AppButton @click="resetBooking">Novo Agendamento</AppButton>
        <AppButton variant="secondary" @click="$router.push('/history')">Ver Histórico</AppButton>
      </div>
    </div>

    <!-- Stepper -->
    <template v-else>
      <!-- Progress -->
      <div class="flex items-center justify-center mb-8">
        <div v-for="(step, idx) in steps" :key="step.number" class="flex items-center">
          <div class="flex flex-col items-center">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-300"
              :class="
                currentStep >= step.number
                  ? 'bg-rose-500 text-white'
                  : 'bg-gray-100 text-gray-400'
              "
            >
              <svg v-if="currentStep > step.number" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span v-else>{{ step.number }}</span>
            </div>
            <span class="text-xs mt-1.5 font-medium" :class="currentStep >= step.number ? 'text-rose-600' : 'text-gray-400'">
              {{ step.label }}
            </span>
          </div>
          <div
            v-if="idx < steps.length - 1"
            class="w-16 sm:w-24 h-0.5 mx-2 mb-5 transition-colors duration-300"
            :class="currentStep > step.number ? 'bg-rose-400' : 'bg-gray-200'"
          />
        </div>
      </div>

      <!-- Step 1: Services -->
      <div v-if="currentStep === 1"
        v-motion
        :initial="{ opacity: 0, x: slideDirection === 'left' ? 50 : -50 }"
        :enter="{ opacity: 1, x: 0, transition: { duration: 300 } }"
      >
        <h2 class="text-xl font-bold text-gray-800 mb-1">Escolha os serviços</h2>
        <p class="text-sm text-gray-500 mb-6">Selecione um ou mais serviços desejados</p>

        <ServiceSelector
          :services="activeServices"
          v-model="selectedServiceIds"
        />

        <div class="flex justify-end mt-6">
          <AppButton :disabled="!canGoToStep2" @click="goToStep(2)">
            Próximo
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </AppButton>
        </div>
      </div>

      <!-- Step 2: Date & Time -->
      <div v-if="currentStep === 2"
        v-motion
        :initial="{ opacity: 0, x: slideDirection === 'left' ? 50 : -50 }"
        :enter="{ opacity: 1, x: 0, transition: { duration: 300 } }"
      >
        <h2 class="text-xl font-bold text-gray-800 mb-1">Escolha a data e horário</h2>
        <p class="text-sm text-gray-500 mb-6">Selecione quando deseja ser atendida</p>

        <div class="space-y-4">
          <AppInput
            v-model="scheduledDate"
            label="Data"
            type="date"
          />

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Horário</label>
            <div class="grid grid-cols-4 sm:grid-cols-6 gap-2">
              <button
                v-for="slot in timeSlots"
                :key="slot"
                type="button"
                class="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                :class="
                  scheduledTime === slot
                    ? 'bg-rose-500 text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                "
                @click="scheduledTime = slot"
              >
                {{ slot }}
              </button>
            </div>
          </div>

          <AppInput
            v-model="notes"
            label="Observações (opcional)"
            placeholder="Alguma preferência?"
          />
        </div>

        <div class="flex justify-between mt-6">
          <AppButton variant="secondary" @click="goToStep(1)">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </AppButton>
          <AppButton :disabled="!canGoToStep3" @click="goToStep(3)">
            Próximo
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </AppButton>
        </div>
      </div>

      <!-- Step 3: Review -->
      <div v-if="currentStep === 3"
        v-motion
        :initial="{ opacity: 0, x: slideDirection === 'left' ? 50 : -50 }"
        :enter="{ opacity: 1, x: 0, transition: { duration: 300 } }"
      >
        <h2 class="text-xl font-bold text-gray-800 mb-1">Confirme seu agendamento</h2>
        <p class="text-sm text-gray-500 mb-6">Revise os detalhes antes de confirmar</p>

        <!-- Week warning -->
        <div v-if="weekWarning" class="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <svg class="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
          </svg>
          <p class="text-sm text-amber-700">{{ weekWarning }}</p>
        </div>

        <div class="bg-gray-50 rounded-2xl p-5 space-y-4">
          <div>
            <h4 class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Serviços</h4>
            <div class="space-y-2">
              <div
                v-for="service in selectedServices"
                :key="service.id"
                class="flex items-center justify-between"
              >
                <div class="flex items-center gap-2">
                  <div class="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span class="text-sm text-gray-700">{{ service.name }}</span>
                  <span class="text-xs text-gray-400">({{ service.durationMinutes }} min)</span>
                </div>
                <span class="text-sm font-medium text-gray-700">{{ formatPrice(service.price) }}</span>
              </div>
            </div>
          </div>

          <div class="border-t border-gray-200 pt-3">
            <h4 class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Data e Hora</h4>
            <p class="text-sm text-gray-700">
              {{ new Date(scheduledDate + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) }}
              às {{ scheduledTime }}
            </p>
          </div>

          <div v-if="notes" class="border-t border-gray-200 pt-3">
            <h4 class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Observações</h4>
            <p class="text-sm text-gray-700">{{ notes }}</p>
          </div>

          <div class="border-t border-gray-200 pt-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">Duração total: {{ totalDuration }} min</span>
              <div class="text-right">
                <p class="text-xs text-gray-400">Total</p>
                <p class="text-xl font-bold text-rose-600">{{ formatPrice(totalPrice) }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-between mt-6">
          <AppButton variant="secondary" @click="goToStep(2)">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </AppButton>
          <AppButton :loading="loading" @click="confirmBooking">
            Confirmar Agendamento
          </AppButton>
        </div>
      </div>
    </template>
  </div>
</template>
