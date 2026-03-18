<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppointmentsStore } from '../../stores/appointments.store'
import { useAppointments } from '../../composables/useAppointments'
import { useToast } from '../../composables/useToast'
import { AppointmentStatus } from '../../types'
import AppBadge from '../../components/ui/AppBadge.vue'
import AppButton from '../../components/ui/AppButton.vue'
import AppModal from '../../components/ui/AppModal.vue'
import AppSkeleton from '../../components/ui/AppSkeleton.vue'
import AppointmentForm from '../../components/appointments/AppointmentForm.vue'

const route = useRoute()
const router = useRouter()
const appointmentsStore = useAppointmentsStore()
const { formatPrice, formatDate, formatTime, canEdit, getServiceStatusLabel } = useAppointments()
const toast = useToast()

const showEditModal = ref(false)
const cancelLoading = ref(false)
const editLoading = ref(false)

const appointmentId = route.params.id as string

onMounted(async () => {
  await appointmentsStore.fetchById(appointmentId)
})

const appointment = computed(() => appointmentsStore.currentAppointment)

const isEditable = computed(() => {
  if (!appointment.value) return false
  if (appointment.value.status === AppointmentStatus.CANCELLED ||
      appointment.value.status === AppointmentStatus.COMPLETED) return false
  return canEdit(appointment.value.scheduledDate)
})

const showEditWarning = computed(() => {
  if (!appointment.value) return false
  if (appointment.value.status === AppointmentStatus.CANCELLED ||
      appointment.value.status === AppointmentStatus.COMPLETED) return false
  return !canEdit(appointment.value.scheduledDate)
})

function statusToVariant(status: string): 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' {
  return status.toLowerCase() as 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
}

async function handleCancel() {
  if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return
  cancelLoading.value = true
  try {
    await appointmentsStore.cancelAppointment(appointmentId)
    toast.success('Agendamento cancelado com sucesso.')
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    toast.error(error.response?.data?.message || 'Erro ao cancelar agendamento.')
  } finally {
    cancelLoading.value = false
  }
}

async function handleEdit(data: { scheduledDate: string; scheduledTime: string; notes: string; serviceIds: string[] }) {
  editLoading.value = true
  try {
    await appointmentsStore.updateAppointment(appointmentId, {
      scheduledDate: data.scheduledDate,
      scheduledTime: data.scheduledTime,
      notes: data.notes || undefined,
      serviceIds: data.serviceIds,
    })
    showEditModal.value = false
    toast.success('Agendamento atualizado com sucesso.')
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    toast.error(error.response?.data?.message || 'Erro ao atualizar agendamento.')
  } finally {
    editLoading.value = false
  }
}
</script>

<template>
  <div
    v-motion
    :initial="{ opacity: 0, y: 30 }"
    :enter="{ opacity: 1, y: 0, transition: { duration: 500 } }"
    class="max-w-2xl mx-auto px-4 py-8"
  >
    <button
      @click="router.back()"
      class="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      <span class="text-sm font-medium">Voltar</span>
    </button>

    <AppSkeleton v-if="appointmentsStore.loading" type="card" :lines="5" />

    <template v-else-if="appointment">
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <!-- Header -->
        <div class="p-6 border-b border-gray-50">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h1 class="text-xl font-bold text-gray-800">Detalhes do Agendamento</h1>
              <p class="text-sm text-gray-400 mt-1">Criado em {{ formatDate(appointment.createdAt) }}</p>
            </div>
            <AppBadge :variant="statusToVariant(appointment.status)" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="bg-gray-50 rounded-xl p-3">
              <p class="text-xs text-gray-400 mb-1">Data</p>
              <p class="text-sm font-semibold text-gray-800">{{ formatDate(appointment.scheduledDate) }}</p>
            </div>
            <div class="bg-gray-50 rounded-xl p-3">
              <p class="text-xs text-gray-400 mb-1">Horário</p>
              <p class="text-sm font-semibold text-gray-800">{{ formatTime(appointment.scheduledTime) }}</p>
            </div>
          </div>
        </div>

        <!-- Services -->
        <div class="p-6 border-b border-gray-50">
          <h3 class="text-sm font-semibold text-gray-800 mb-3">Serviços</h3>
          <div class="space-y-3">
            <div
              v-for="item in appointment.appointmentServices"
              :key="item.id"
              class="flex items-center justify-between py-2"
            >
              <div class="flex items-center gap-3">
                <div class="w-2 h-2 rounded-full bg-rose-400" />
                <div>
                  <p class="text-sm font-medium text-gray-700">{{ item.service.name }}</p>
                  <p class="text-xs text-gray-400">{{ item.service.durationMinutes }} min</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <span
                  class="text-xs px-2 py-0.5 rounded-full"
                  :class="{
                    'bg-yellow-100 text-yellow-700': item.status === 'PENDING',
                    'bg-amber-100 text-amber-700': item.status === 'IN_PROGRESS',
                    'bg-green-100 text-green-700': item.status === 'COMPLETED',
                  }"
                >
                  {{ getServiceStatusLabel(item.status) }}
                </span>
                <span class="text-sm font-medium text-gray-700">{{ formatPrice(item.price) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div v-if="appointment.notes" class="p-6 border-b border-gray-50">
          <h3 class="text-sm font-semibold text-gray-800 mb-2">Observações</h3>
          <p class="text-sm text-gray-600">{{ appointment.notes }}</p>
        </div>

        <!-- Total -->
        <div class="p-6 border-b border-gray-50">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-500">Total</span>
            <span class="text-xl font-bold text-rose-600">{{ formatPrice(appointment.totalPrice) }}</span>
          </div>
        </div>

        <!-- Edit warning -->
        <div v-if="showEditWarning" class="p-6 border-b border-gray-50">
          <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <svg class="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
            </svg>
            <p class="text-sm text-amber-700">
              Não é possível editar agendamentos com menos de 2 dias de antecedência. Entre em contato pelo telefone para alterações.
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="p-6 flex gap-3">
          <AppButton
            v-if="isEditable"
            variant="secondary"
            @click="showEditModal = true"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </AppButton>
          <AppButton
            v-if="appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED'"
            variant="danger"
            :loading="cancelLoading"
            @click="handleCancel"
          >
            Cancelar Agendamento
          </AppButton>
        </div>
      </div>
    </template>

    <!-- Edit Modal -->
    <AppModal v-model="showEditModal" title="Editar Agendamento">
      <AppointmentForm
        v-if="appointment"
        :appointment="appointment"
        :loading="editLoading"
        @submit="handleEdit"
        @cancel="showEditModal = false"
      />
    </AppModal>
  </div>
</template>
