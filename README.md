# Salão de Beleza Leila — Sistema de Agendamento

Aplicação web fullstack de agendamento para salão de beleza, com módulo do cliente e painel administrativo completo.

## Produção

A aplicação está disponível em: **https://salao-leila.up.railway.app/**

| Recurso | URL |
|---------|-----|
| Aplicação | https://salao-leila.up.railway.app/ |
| API | https://salao-leila.up.railway.app/api |
| Swagger | https://salao-leila.up.railway.app/api/docs |

## Estrutura do Repositório

```
cabeleleila-leila/
├── backend/          # API REST — NestJS + TypeORM + PostgreSQL
├── frontend/         # SPA — Vue 3 + Pinia + Tailwind CSS
└── Dockerfile        # Build multi-stage (frontend + backend) para produção
```

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Backend | NestJS 11, TypeORM 0.3, PostgreSQL 15+ |
| Autenticação | Passport.js + JWT |
| Validação | class-validator + class-transformer |
| Documentação API | Swagger / OpenAPI (`/api/docs`) |
| Segurança | Helmet, Rate Limiting, bcrypt (rounds 12) |
| Frontend | Vue 3 (Composition API, `<script setup>`) |
| Estado | Pinia |
| Roteamento | Vue Router 4 (com guards de autenticação) |
| Estilização | Tailwind CSS 4 |
| HTTP Client | Axios (com interceptors JWT e unwrap automático) |
| Animações | @vueuse/motion |
| Testes | Jest — 39 unitários + 31 E2E (sem banco de dados) |

## Instalação e Execução

### Pré-requisitos
- Node.js 20+
- PostgreSQL 15+ (o serviço deve estar rodando antes de executar os comandos abaixo)

> **Iniciando o PostgreSQL e criando o banco:**
> ```bash
> # Linux (WSL / Ubuntu)
> sudo service postgresql start
> sudo -u postgres psql -c "CREATE DATABASE leila_db;"
>
> # macOS (Homebrew)
> brew services start postgresql
> psql postgres -c "CREATE DATABASE leila_db;"
>
> # Docker
> docker run -d --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:15
> docker exec -it postgres psql -U postgres -c "CREATE DATABASE leila_db;"
> ```

### Backend

```bash
cd backend
cp .env.example .env   # configure as variáveis abaixo
npm install
npm run migration:run  # cria as tabelas no banco de dados
npm run seed           # cria admin, cliente teste e 8 serviços
npm run start:dev      # porta 3000
```

**Variáveis de ambiente** (`backend/.env`):
```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASS=postgres
DATABASE_NAME=leila_db
JWT_SECRET=sua_chave_secreta_muito_forte
JWT_EXPIRES_IN=7d
PORT=3000
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # porta 5173
```

**Variável de ambiente** (`frontend/.env`):
```
VITE_API_BASE_URL=http://localhost:3000/api
```

### Credenciais de Teste (após seed)

| Papel | E-mail | Senha |
|-------|--------|-------|
| Admin | admin@leila.com | Admin@123 |
| Cliente | cliente@teste.com | Cliente@123 |

## Mobile First

A interface foi projetada com foco em mobile, garantindo uma experiência fluída em telas pequenas sem abrir mão do desktop.

<img src="public/mobile-print.png" alt="Tela inicial mobile do app" width="280" />

## Funcionalidades

### Módulo Cliente
- Cadastro e login com JWT
- Agendamento em 3 etapas: seleção de serviços → data e horário → confirmação
- Sugestão automática de agendar na mesma data quando já existe agendamento na semana
- Edição e cancelamento de agendamentos (regra dos 2 dias de antecedência)
- Histórico de agendamentos com filtros por período
- Visualização detalhada com status de cada serviço

### Módulo Admin
- **Dashboard** com métricas filtráveis por período (Semanal / Mensal / Total): total de agendamentos, receita, confirmados, pendentes, distribuição por dia da semana e serviço mais procurado
- **Agendamentos**: listagem paginada com filtros por status, data e nome do cliente; confirmação e edição de status/observações
- **Serviços**: CRUD completo do catálogo de serviços (nome, descrição, preço, duração)
- **Documentação interna** em `/admin/docs`: guia completo das funcionalidades, regras de negócio e status disponíveis
- **Swagger UI** em `/api/docs`: documentação interativa da API REST

## Regras de Negócio

| Regra | Descrição |
|-------|-----------|
| Conflito de horários | Impede sobreposições comparando janelas de tempo (horário + duração total dos serviços) |
| Snapshot de preços | Preço gravado no momento do agendamento; alterações no catálogo não o afetam |
| Regra dos 2 dias | Clientes só podem editar/cancelar com mais de 2 dias de antecedência |
| Sugestão de semana | Se já há agendamento na semana, sugere agendar na mesma data para otimizar o atendimento |
| Duração total | Calculada automaticamente pela soma dos serviços; usada na verificação de conflito |

## Segurança

- **JWT** com guards de autenticação e autorização por role (`CLIENT` / `ADMIN`)
- **Rate limiting**: 100 requisições por minuto por IP
- **Helmet**: headers HTTP de segurança em todas as respostas
- **bcrypt**: senhas com salt de 12 rounds
- **Validação** server-side com class-validator em todos os DTOs (400 com detalhes em caso de erro)
- **CORS** configurado para aceitar origens locais (desenvolvimento) e rede interna

## Testes

```bash
cd backend
npm test            # 39 testes unitários (AppointmentsService, AuthService, ServicesService, paginate)
npm run test:e2e    # 31 testes E2E com pipeline NestJS real e service mocked (sem banco de dados)
```

## Arquitetura

```
backend/src/
├── auth/           # Login, registro, JWT strategy, guards de role
├── users/          # Entidade User, CRUD
├── services/       # Catálogo de serviços do salão
├── appointments/   # Agendamentos, regras de negócio, conflito de horários
├── dashboard/      # Métricas e estatísticas para o admin
├── common/         # Exception filter, transform interceptor, paginate util
├── config/         # Configuração TypeORM
└── seed/           # Dados iniciais

frontend/src/
├── components/     # UI (AppButton, AppInput, AppModal…), layout, appointments
├── views/          # auth/, client/, admin/ (incluindo DocsView)
├── stores/         # Pinia: auth, appointments, services, ui
├── composables/    # useAppointments, useToast, useAnimations
├── services/api/   # Camada HTTP: auth.api, appointments.api, services.api
├── router/         # Rotas com guards de autenticação e role
└── types/          # Interfaces TypeScript compartilhadas
```
