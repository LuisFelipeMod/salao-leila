<script setup lang="ts">
const sections = [
  {
    id: 'visao-geral',
    title: 'Visão Geral',
    icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    content: `
      O sistema de agendamento do Salão Leila é uma aplicação web completa com dois módulos distintos:
      o painel do cliente (onde clientes fazem e gerenciam seus agendamentos) e o painel administrativo
      (onde a Leila gerencia tudo). O backend expõe uma API REST protegida por JWT, e o frontend
      consome essa API de forma reativa com Vue 3 + Pinia.
    `,
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    items: [
      { label: 'Filtro de período', desc: 'Alterne entre Semanal, Mensal e Total para ver as métricas do período desejado.' },
      { label: 'Cards de métricas', desc: 'Total de agendamentos, receita gerada, agendamentos confirmados e pendentes.' },
      { label: 'Gráfico por dia', desc: 'Barras horizontais mostrando a distribuição de agendamentos por dia da semana.' },
      { label: 'Serviço mais procurado', desc: 'Destaque automático do serviço com mais agendamentos no período.' },
      { label: 'Agendamentos de hoje', desc: 'Lista em tempo real dos agendamentos do dia com horário, cliente e status.' },
    ],
  },
  {
    id: 'agendamentos',
    title: 'Gerenciamento de Agendamentos',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    items: [
      { label: 'Filtros', desc: 'Filtre por status, data ou nome do cliente. Use "Limpar" para resetar.' },
      { label: 'Expandir linha', desc: 'Clique em qualquer agendamento para ver os serviços detalhados, observações e o preço total.' },
      { label: 'Confirmar', desc: 'Agendamentos PENDENTES podem ser confirmados com um clique (botão "Confirmar").' },
      { label: 'Editar', desc: 'Abra o modal de edição para alterar o status geral do agendamento ou as observações.' },
      { label: 'Paginação', desc: '15 agendamentos por página. Use "Anterior" / "Próximo" para navegar.' },
    ],
  },
  {
    id: 'servicos',
    title: 'Gerenciamento de Serviços',
    icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
    items: [
      { label: 'Criar serviço', desc: 'Defina nome, descrição, preço (R$) e duração em minutos. O serviço fica ativo imediatamente.' },
      { label: 'Editar', desc: 'Altere qualquer campo do serviço. Mudanças de preço não afetam agendamentos já criados (snapshot).' },
      { label: 'Desativar', desc: 'Serviços desativados deixam de aparecer para novos agendamentos dos clientes, mas histórico é preservado.' },
    ],
  },
  {
    id: 'regras',
    title: 'Regras de Negócio',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    items: [
      { label: 'Regra dos 2 dias', desc: 'Clientes só podem editar ou cancelar agendamentos com mais de 2 dias de antecedência. O admin não tem essa restrição.' },
      { label: 'Sugestão de mesma semana', desc: 'Se a cliente já tem um agendamento na mesma semana, o sistema exibe a data existente e oferece a opção de agendar na mesma data, facilitando o atendimento conjunto.' },
      { label: 'Conflito de horários', desc: 'O sistema impede agendamentos sobrepostos: compara a janela de tempo (horário + duração total dos serviços) e retorna erro 409 se houver conflito.' },
      { label: 'Snapshot de preços', desc: 'O preço de cada serviço é copiado no momento do agendamento. Alterações futuras no catálogo não afetam agendamentos existentes.' },
      { label: 'Duração total', desc: 'A duração total é calculada automaticamente pela soma dos serviços selecionados e armazenada no agendamento.' },
    ],
  },
  {
    id: 'status',
    title: 'Status dos Agendamentos',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    badges: [
      { label: 'PENDENTE', color: 'bg-yellow-100 text-yellow-700', desc: 'Agendamento criado, aguardando confirmação do salão.' },
      { label: 'CONFIRMADO', color: 'bg-green-100 text-green-700', desc: 'Confirmado pelo admin. Cliente está ciente.' },
      { label: 'EM ANDAMENTO', color: 'bg-blue-100 text-blue-700', desc: 'Atendimento em curso no momento.' },
      { label: 'CONCLUÍDO', color: 'bg-gray-100 text-gray-700', desc: 'Atendimento finalizado com sucesso.' },
      { label: 'CANCELADO', color: 'bg-red-100 text-red-700', desc: 'Cancelado pelo cliente ou pelo admin.' },
    ],
  },
  {
    id: 'seguranca',
    title: 'Segurança',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    items: [
      { label: 'JWT (JSON Web Token)', desc: 'Todas as rotas protegidas exigem um token válido no header Authorization. Tokens expiram em 7 dias.' },
      { label: 'Roles (Papéis)', desc: 'Dois papéis: CLIENT e ADMIN. Rotas administrativas rejeitam clientes com 403 Forbidden.' },
      { label: 'Rate Limiting', desc: 'Máximo de 100 requisições por minuto por IP para proteger contra abuso.' },
      { label: 'Helmet', desc: 'Headers HTTP de segurança aplicados automaticamente em todas as respostas.' },
      { label: 'bcrypt', desc: 'Senhas nunca são armazenadas em texto plano — sempre com hash bcrypt (salt rounds = 12).' },
      { label: 'Validação de entrada', desc: 'Todos os DTOs usam class-validator. Campos inválidos retornam 400 com detalhes do erro.' },
    ],
  },
  {
    id: 'api',
    title: 'Documentação da API',
    icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
    content: `
      A API REST é documentada interativamente com Swagger. Todos os endpoints estão listados,
      com parâmetros, tipos de resposta e exemplos de payloads. É possível testar as rotas
      diretamente pelo navegador após autenticar com o token JWT.
    `,
    link: { href: 'https://salao-leila.up.railway.app/api/docs', label: 'Abrir Swagger UI' },
  },
]
</script>

<template>
  <div
    v-motion
    :initial="{ opacity: 0, y: 30 }"
    :enter="{ opacity: 1, y: 0, transition: { duration: 500 } }"
    class="max-w-4xl"
  >
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-800">Documentação do Sistema</h1>
      <p class="text-sm text-gray-500 mt-1">Guia completo das funcionalidades disponíveis no painel administrativo.</p>
    </div>

    <!-- Table of contents -->
    <div class="bg-rose-50 rounded-2xl p-5 mb-8">
      <p class="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-3">Índice</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-1">
        <a
          v-for="s in sections"
          :key="s.id"
          :href="`#${s.id}`"
          class="flex items-center gap-2 text-sm text-rose-700 hover:text-rose-900 py-1"
        >
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          {{ s.title }}
        </a>
      </div>
    </div>

    <!-- Sections -->
    <div class="space-y-6">
      <section
        v-for="s in sections"
        :key="s.id"
        :id="s.id"
        class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <!-- Section header -->
        <div class="flex items-center gap-3 px-6 py-4 border-b border-gray-50 bg-gray-50/60">
          <div class="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center shrink-0">
            <svg class="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="s.icon" />
            </svg>
          </div>
          <h2 class="text-base font-semibold text-gray-800">{{ s.title }}</h2>
        </div>

        <div class="px-6 py-5">
          <!-- Plain text content -->
          <p v-if="s.content" class="text-sm text-gray-600 leading-relaxed">{{ s.content.trim() }}</p>

          <!-- Items list -->
          <ul v-if="s.items" class="space-y-3">
            <li v-for="item in s.items" :key="item.label" class="flex gap-3">
              <div class="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-2" />
              <div>
                <span class="text-sm font-semibold text-gray-700">{{ item.label }}</span>
                <span class="text-sm text-gray-500"> — {{ item.desc }}</span>
              </div>
            </li>
          </ul>

          <!-- Status badges -->
          <div v-if="s.badges" class="space-y-3">
            <div v-for="badge in s.badges" :key="badge.label" class="flex items-start gap-3">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 mt-0.5" :class="badge.color">
                {{ badge.label }}
              </span>
              <p class="text-sm text-gray-600">{{ badge.desc }}</p>
            </div>
          </div>

          <!-- Link -->
          <a
            v-if="s.link"
            :href="s.link.href"
            target="_blank"
            rel="noopener"
            class="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-rose-500 text-white text-sm font-medium rounded-xl hover:bg-rose-600 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            {{ s.link.label }}
          </a>
        </div>
      </section>
    </div>
  </div>
</template>
