<script setup lang="ts">
import BookingStepper from '../../components/appointments/BookingStepper.vue'
</script>

<template>
  <div
    v-motion
    :initial="{ opacity: 0, y: 30 }"
    :enter="{ opacity: 1, y: 0, transition: { duration: 500 } }"
    class="max-w-4xl mx-auto px-4 py-8"
  >
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-800 mb-1">Novo Agendamento</h1>
      <p class="text-gray-500 text-sm">Siga os passos para agendar seu horário</p>
    </div>

    <BookingStepper />
  </div>
</template>
