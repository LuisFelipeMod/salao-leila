<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAppointmentsStore } from '../../stores/appointments.store'
import { useAppointments } from '../../composables/useAppointments'
import { useToast } from '../../composables/useToast'
import { AppointmentStatus, ServiceStatus } from '../../types'
import type { Appointment } from '../../types'
import AppButton from '../../components/ui/AppButton.vue'
import AppInput from '../../components/ui/AppInput.vue'
import AppBadge from '../../components/ui/AppBadge.vue'
import AppModal from '../../components/ui/AppModal.vue'
import AppSkeleton from '../../components/ui/AppSkeleton.vue'

const appointmentsStore = useAppointmentsStore()
const { formatPrice, formatDate, formatTime, getServiceStatusLabel } = useAppointments()
const toast = useToast()

const filterStatus = ref<AppointmentStatus | ''>('')
const filterDate = ref('')
const filterClientName = ref('')
const expandedId = ref<string | null>(null)
const showEditModal = ref(false)
const editingAppointment = ref<Appointment | null>(null)
const editStatus = ref<AppointmentStatus | ''>('')
const editNotes = ref('')

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: AppointmentStatus.PENDING, label: 'Pendente' },
  { value: AppointmentStatus.CONFIRMED, label: 'Confirmado' },
  { value: AppointmentStatus.IN_PROGRESS, label: 'Em Andamento' },
  { value: AppointmentStatus.COMPLETED, label: 'Concluído' },
  { value: AppointmentStatus.CANCELLED, label: 'Cancelado' },
]

const serviceStatusOptions = [
  { value: ServiceStatus.PENDING, label: 'Pendente' },
  { value: ServiceStatus.IN_PROGRESS, label: 'Em Andamento' },
  { value: ServiceStatus.COMPLETED, label: 'Concluído' },
]

onMounted(() => {
  loadAppointments()
})

async function loadAppointments(page = 1) {
  const params: Record<string, unknown> = { page, limit: 15 }
  if (filterStatus.value) params.status = filterStatus.value
  if (filterDate.value) {
    params.startDate = filterDate.value
    params.endDate = filterDate.value
  }
  if (filterClientName.value) params.clientName = filterClientName.value
  await appointmentsStore.fetchAll(params as Parameters<typeof appointmentsStore.fetchAll>[0])
}

function applyFilters() {
  loadAppointments(1)
}

function clearFilters() {
  filterStatus.value = ''
  filterDate.value = ''
  filterClientName.value = ''
  loadAppointments(1)
}

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

async function confirmAppointment(id: string) {
  try {
    await appointmentsStore.confirmAppointment(id)
    toast.success('Agendamento confirmado!')
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    toast.error(error.response?.data?.message || 'Erro ao confirmar.')
  }
}

function openEditModal(apt: Appointment) {
  editingAppointment.value = apt
  editStatus.value = apt.status
  editNotes.value = apt.notes || ''
  showEditModal.value = true
}

async function saveEdit() {
  if (!editingAppointment.value) return
  try {
    const payload: { status?: AppointmentStatus; notes?: string } = {}
    if (editStatus.value && editStatus.value !== editingAppointment.value.status) {
      payload.status = editStatus.value
    }
    if (editNotes.value !== (editingAppointment.value.notes || '')) {
      payload.notes = editNotes.value
    }
    await appointmentsStore.adminUpdate(editingAppointment.value.id, payload)
    showEditModal.value = false
    toast.success('Agendamento atualizado!')
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    toast.error(error.response?.data?.message || 'Erro ao atualizar.')
  }
}

async function updateServiceStatus(appointmentId: string, serviceItemId: string, status: ServiceStatus) {
  try {
    await appointmentsStore.updateServiceStatus(appointmentId, serviceItemId, status)
    toast.success('Status do serviço atualizado!')
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    toast.error(error.response?.data?.message || 'Erro ao atualizar status.')
  }
}

function goToPage(page: number) {
  loadAppointments(page)
}

function statusToVariant(status: string): 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' {
  return status.toLowerCase() as 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
}

// suppress unused
void getServiceStatusLabel
</script>

<template>
  <div
    v-motion
    :initial="{ opacity: 0, y: 30 }"
    :enter="{ opacity: 1, y: 0, transition: { duration: 500 } }"
  >
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Agendamentos</h1>

    <!-- Filters -->
    <div class="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
      <div class="flex flex-col sm:flex-row gap-3 items-end">
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
          <select
            v-model="filterStatus"
            class="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
          >
            <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        <div class="flex-1">
          <AppInput v-model="filterDate" label="Data" type="date" />
        </div>
        <div class="flex-1">
          <AppInput v-model="filterClientName" label="Nome do cliente" placeholder="Buscar por nome" />
        </div>
        <div class="flex gap-2">
          <AppButton size="sm" @click="applyFilters">Filtrar</AppButton>
          <AppButton size="sm" variant="ghost" @click="clearFilters">Limpar</AppButton>
        </div>
      </div>
    </div>

    <AppSkeleton v-if="appointmentsStore.loading" type="list" :lines="5" />

    <div v-else-if="appointmentsStore.appointments.length === 0" class="text-center py-16 bg-white rounded-2xl border border-gray-100">
      <p class="text-gray-400">Nenhum agendamento encontrado.</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="(apt, idx) in appointmentsStore.appointments"
        :key="apt.id"
        v-motion
        :initial="{ opacity: 0, y: 15 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 300, delay: idx * 50 } }"
        class="bg-white rounded-2xl border border-gray-100 overflow-hidden"
      >
        <div class="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors" @click="toggleExpand(apt.id)">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center shrink-0">
              <span class="text-xs font-bold text-rose-600">{{ formatTime(apt.scheduledTime) }}</span>
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-800">{{ apt.user?.name || 'Cliente' }}</p>
              <p class="text-xs text-gray-400">{{ formatDate(apt.scheduledDate) }} &middot; {{ apt.appointmentServices.length }} serviço(s)</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm font-semibold text-gray-700">{{ formatPrice(apt.totalPrice) }}</span>
            <AppBadge :variant="statusToVariant(apt.status)" />
            <svg
              class="w-4 h-4 text-gray-400 transition-transform"
              :class="{ 'rotate-180': expandedId === apt.id }"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <!-- Expanded -->
        <Transition name="expand">
          <div v-if="expandedId === apt.id" class="border-t border-gray-100 p-5 bg-gray-50/30">
            <div class="space-y-3 mb-4">
              <div
                v-for="item in apt.appointmentServices"
                :key="item.id"
                class="flex items-center justify-between bg-white p-3 rounded-xl"
              >
                <div>
                  <p class="text-sm font-medium text-gray-700">{{ item.service.name }}</p>
                  <p class="text-xs text-gray-400">{{ formatPrice(item.price) }} &middot; {{ item.service.durationMinutes }} min</p>
                </div>
                <div class="flex items-center gap-2">
                  <select
                    :value="item.status"
                    @change="updateServiceStatus(apt.id, item.id, ($event.target as HTMLSelectElement).value as ServiceStatus)"
                    class="text-xs px-2 py-1 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-rose-200"
                  >
                    <option v-for="opt in serviceStatusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                  </select>
                </div>
              </div>
            </div>

            <div v-if="apt.notes" class="mb-4 text-sm text-gray-600">
              <span class="font-medium">Obs:</span> {{ apt.notes }}
            </div>

            <div class="flex gap-2">
              <AppButton
                v-if="apt.status === 'PENDING'"
                size="sm"
                @click.stop="confirmAppointment(apt.id)"
              >
                Confirmar
              </AppButton>
              <AppButton size="sm" variant="secondary" @click.stop="openEditModal(apt)">
                Editar
              </AppButton>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Pagination -->
      <div v-if="appointmentsStore.totalPages > 1" class="flex items-center justify-center gap-2 pt-4">
        <AppButton
          size="sm"
          variant="ghost"
          :disabled="appointmentsStore.currentPage <= 1"
          @click="goToPage(appointmentsStore.currentPage - 1)"
        >
          Anterior
        </AppButton>
        <span class="text-sm text-gray-500">
          {{ appointmentsStore.currentPage }} de {{ appointmentsStore.totalPages }}
        </span>
        <AppButton
          size="sm"
          variant="ghost"
          :disabled="appointmentsStore.currentPage >= appointmentsStore.totalPages"
          @click="goToPage(appointmentsStore.currentPage + 1)"
        >
          Próximo
        </AppButton>
      </div>
    </div>

    <!-- Edit Modal -->
    <AppModal v-model="showEditModal" title="Editar Agendamento">
      <div v-if="editingAppointment" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
          <select
            v-model="editStatus"
            class="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
          >
            <option v-for="opt in statusOptions.slice(1)" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        <AppInput v-model="editNotes" label="Observações" placeholder="Observações..." />
        <div class="flex gap-3 pt-2">
          <AppButton @click="saveEdit">Salvar</AppButton>
          <AppButton variant="secondary" @click="showEditModal = false">Cancelar</AppButton>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.expand-enter-to,
.expand-leave-from {
  max-height: 500px;
}
</style>
