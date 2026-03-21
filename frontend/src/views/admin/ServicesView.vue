<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useServicesStore } from '../../stores/services.store'
import { useAppointments } from '../../composables/useAppointments'
import { useToast } from '../../composables/useToast'
import type { SalonService } from '../../types'
import AppButton from '../../components/ui/AppButton.vue'
import AppInput from '../../components/ui/AppInput.vue'
import AppModal from '../../components/ui/AppModal.vue'
import AppCard from '../../components/ui/AppCard.vue'
import AppSkeleton from '../../components/ui/AppSkeleton.vue'

const servicesStore = useServicesStore()
const { formatPrice } = useAppointments()
const toast = useToast()

const showModal = ref(false)
const editingService = ref<SalonService | null>(null)
const formName = ref('')
const formDescription = ref('')
const formPrice = ref('')
const formDuration = ref('')
const formErrors = ref<Record<string, string>>({})
const saveLoading = ref(false)

function formatCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  const cents = parseInt(digits, 10)
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function parseCurrencyToNumber(value: string): number {
  if (!value) return 0
  return parseFloat(value.replace(/\./g, '').replace(',', '.'))
}

function onPriceInput(val: string) {
  formPrice.value = formatCurrencyInput(val)
}

onMounted(() => {
  servicesStore.fetchServices()
})

function openCreateModal() {
  editingService.value = null
  formName.value = ''
  formDescription.value = ''
  formPrice.value = ''
  formDuration.value = ''
  formErrors.value = {}
  showModal.value = true
}

function openEditModal(service: SalonService) {
  editingService.value = service
  formName.value = service.name
  formDescription.value = service.description
  formPrice.value = Number(service.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  formDuration.value = service.durationMinutes.toString()
  formErrors.value = {}
  showModal.value = true
}

function validate(): boolean {
  formErrors.value = {}
  if (!formName.value.trim()) formErrors.value.name = 'Nome é obrigatório'
  if (!formDescription.value.trim()) formErrors.value.description = 'Descrição é obrigatória'
  if (!formPrice.value || parseCurrencyToNumber(formPrice.value) <= 0) formErrors.value.price = 'Preço deve ser maior que zero'
  if (!formDuration.value || Number(formDuration.value) <= 0) formErrors.value.duration = 'Duração deve ser maior que zero'
  return Object.keys(formErrors.value).length === 0
}

async function handleSave() {
  if (!validate()) return

  saveLoading.value = true
  try {
    const payload = {
      name: formName.value,
      description: formDescription.value,
      price: parseCurrencyToNumber(formPrice.value),
      durationMinutes: Number(formDuration.value),
    }

    if (editingService.value) {
      await servicesStore.updateService(editingService.value.id, payload)
      toast.success('Serviço atualizado!')
    } else {
      await servicesStore.createService(payload)
      toast.success('Serviço criado!')
    }
    showModal.value = false
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    toast.error(error.response?.data?.message || 'Erro ao salvar serviço.')
  } finally {
    saveLoading.value = false
  }
}

async function toggleActive(service: SalonService) {
  try {
    await servicesStore.updateService(service.id, { isActive: !service.isActive })
    toast.success(service.isActive ? 'Serviço desativado.' : 'Serviço ativado.')
  } catch {
    toast.error('Erro ao atualizar status.')
  }
}

async function deleteService(service: SalonService) {
  if (!confirm(`Tem certeza que deseja excluir "${service.name}"?`)) return
  try {
    await servicesStore.deleteService(service.id)
    toast.success('Serviço excluído.')
  } catch {
    toast.error('Erro ao excluir serviço.')
  }
}
</script>

<template>
  <div
    v-motion
    :initial="{ opacity: 0, y: 30 }"
    :enter="{ opacity: 1, y: 0, transition: { duration: 500 } }"
  >
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Serviços</h1>
      <AppButton @click="openCreateModal">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Novo Serviço
      </AppButton>
    </div>

    <AppSkeleton v-if="servicesStore.loading" type="list" :lines="4" />

    <div v-else-if="servicesStore.services.length === 0" class="text-center py-16 bg-white rounded-2xl border border-gray-100">
      <p class="text-gray-400 mb-4">Nenhum serviço cadastrado.</p>
      <AppButton size="sm" @click="openCreateModal">Criar Primeiro Serviço</AppButton>
    </div>

    <div v-else class="grid gap-3">
      <div
        v-for="(service, idx) in servicesStore.services"
        :key="service.id"
        v-motion
        :initial="{ opacity: 0, y: 15 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 300, delay: idx * 60 } }"
      >
        <AppCard>
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="text-sm font-semibold text-gray-800">{{ service.name }}</h3>
                <span
                  class="text-xs px-2 py-0.5 rounded-full"
                  :class="service.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                >
                  {{ service.isActive ? 'Ativo' : 'Inativo' }}
                </span>
              </div>
              <p class="text-xs text-gray-500 mb-2">{{ service.description }}</p>
              <div class="flex items-center gap-4 text-xs text-gray-400">
                <span>{{ service.durationMinutes }} min</span>
                <span class="font-semibold text-rose-600 text-sm">{{ formatPrice(service.price) }}</span>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <button
                @click="openEditModal(service)"
                class="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                @click="toggleActive(service)"
                class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                :class="service.isActive ? 'text-yellow-500' : 'text-green-500'"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path v-if="service.isActive" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button
                @click="deleteService(service)"
                class="p-2 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </AppCard>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <AppModal v-model="showModal" :title="editingService ? 'Editar Serviço' : 'Novo Serviço'">
      <form @submit.prevent="handleSave" class="space-y-4">
        <AppInput
          v-model="formName"
          label="Nome"
          placeholder="Nome do serviço"
          :error="formErrors.name"
        />
        <AppInput
          v-model="formDescription"
          label="Descrição"
          placeholder="Descrição do serviço"
          :error="formErrors.description"
        />
        <AppInput
          :modelValue="formPrice"
          @update:modelValue="onPriceInput"
          label="Preço (R$)"
          placeholder="0,00"
          :error="formErrors.price"
        />
        <AppInput
          v-model="formDuration"
          label="Duração (minutos)"
          type="number"
          placeholder="30"
          :error="formErrors.duration"
        />
        <div class="flex gap-3 pt-2">
          <AppButton type="submit" :loading="saveLoading">
            {{ editingService ? 'Atualizar' : 'Criar' }}
          </AppButton>
          <AppButton variant="secondary" @click="showModal = false">Cancelar</AppButton>
        </div>
      </form>
    </AppModal>
  </div>
</template>
