# Frontend — Salão de Beleza Leila

SPA construída com Vue 3, Pinia e Tailwind CSS. Consome a API REST do backend e entrega dois módulos distintos: painel do cliente e painel administrativo.

## Tecnologias

| Biblioteca | Versão | Uso |
|-----------|--------|-----|
| Vue 3 | ^3.5 | Framework principal — Composition API + `<script setup>` |
| Pinia | ^2.x | Gerenciamento de estado (auth, appointments, services, ui) |
| Vue Router 4 | ^4.x | Navegação com guards de autenticação e role |
| Tailwind CSS | ^4.x | Estilização utilitária |
| Axios | ^1.x | HTTP client com interceptors para JWT e unwrap de resposta |
| @vueuse/motion | ^2.x | Animações declarativas com `v-motion` |
| Day.js | ^1.x | Manipulação de datas (isoWeek plugin) |
| TypeScript | ^5.x | Tipagem estática em toda a aplicação |
| Vite | ^6.x | Build e dev server (host `0.0.0.0` para rede local) |

## Estrutura

```
src/
├── components/
│   ├── ui/               # AppButton, AppInput, AppModal, AppBadge, AppCard, AppSkeleton, AppToast
│   ├── layout/           # AppHeader, AppSidebar, AppFooter, AppBottomNav
│   └── appointments/     # BookingStepper, ServiceSelector
├── views/
│   ├── auth/             # LoginView, RegisterView
│   ├── client/           # HomeView, BookingView, HistoryView, AppointmentDetailView
│   └── admin/            # DashboardView, AppointmentsView, ServicesView, DocsView
├── stores/               # auth.store, appointments.store, services.store, ui.store
├── composables/          # useAppointments, useToast, useAnimations
├── services/api/         # auth.api, appointments.api, services.api, index (Axios instance)
├── router/               # index.ts com guards de autenticação e role
└── types/                # index.ts — interfaces TypeScript compartilhadas
```

## Como Rodar

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build de produção
npm run preview    # preview do build
```

**Variável de ambiente** (`.env`):
```
VITE_API_BASE_URL=http://localhost:3000/api
```

## Padrões e Convenções

### Componentes
- Todos os componentes usam `<script setup lang="ts">` com Composition API
- Props e emits tipados via TypeScript
- Componentes de UI reutilizáveis isolados em `components/ui/`

### Estado (Pinia)
- Uma store por domínio (auth, appointments, services, ui)
- Stores retornam refs, computed e funções async — sem actions separadas
- `ui.store` controla sidebar, toasts e estado global de UI

### Roteamento
- Guard global `router.beforeEach` verifica autenticação e role antes de cada navegação
- Metadados `{ requiresAuth, requiresAdmin, guest }` por rota
- Redirecionamento automático: admin → `/admin/dashboard`, cliente → `/`

### HTTP (Axios)
- Instância centralizada em `services/api/index.ts`
- Interceptor de request: injeta token JWT do localStorage
- Interceptor de response: desempacota o wrapper `{ data, statusCode, timestamp }` do backend
- Erro 401: limpa token e redireciona para `/login`

### Layouts
- **Cliente**: AppHeader + `<main>` + AppFooter (hidden no mobile) + AppBottomNav (só mobile — tabs Início / Agendar FAB / Histórico)
- **Admin**: AppHeader + AppSidebar (drawer no mobile, fixo no desktop) + `<main>`

## Módulo Cliente

### Fluxo de Agendamento (`/booking`)
Stepper de 3 passos com animações `v-motion`:
1. **Serviços** — seleção com toggle, preço e duração calculados em tempo real
2. **Data e Hora** — date input + grid de horários pré-definidos (08:00–18:00)
3. **Confirmação** — revisão completa; se houver agendamento na mesma semana, exibe a data existente e botão "Usar esta data"

### Histórico (`/history`)
Listagem paginada com filtros por status e período. Cada linha expansível mostra os serviços com status individual.

## Módulo Admin

### Dashboard (`/admin/dashboard`)
- Abas de período: **Semanal / Mensal / Total** (recarrega estatísticas via `watch`)
- Cards de métricas em grid 2-col (mobile) / 4-col (desktop)
- Gráfico de barras por dia da semana + serviço mais procurado
- Lista de agendamentos do dia

### Agendamentos (`/admin/appointments`)
- Filtros por status, data e nome do cliente
- Linha expansível com detalhes dos serviços
- Ações: confirmar (PENDING), editar status/observações via modal
- Paginação (15 por página)

### Serviços (`/admin/services`)
- CRUD completo com modal de criação/edição
- Desativação suave (soft delete) — serviço some do stepper do cliente mas o histórico é preservado

### Documentação (`/admin/docs`)
Página de documentação interna com:
- Visão geral do sistema
- Explicação de cada tela do admin
- Regras de negócio detalhadas
- Tabela de status dos agendamentos com descrições
- Checklist de segurança implementada
- Link para o Swagger UI
