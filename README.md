# Salão de Beleza Leila - Sistema de Agendamento

Sistema web completo de agendamento para o salão de beleza da Leila, com módulo de clientes e painel administrativo.

## Tecnologias

### Back-end
- **NestJS** v11 — arquitetura modular
- **TypeORM** v0.3 + **PostgreSQL**
- **Passport + JWT** — autenticação
- **class-validator / class-transformer** — validação e DTOs
- **Swagger** — documentação da API
- **Helmet, Compression, Rate Limiting** — segurança e performance

### Front-end
- **Vue.js 3** — Composition API + `<script setup>`
- **Pinia** — gerenciamento de estado
- **Vue Router 4** — navegação com guards
- **Axios** — requisições HTTP
- **Tailwind CSS 4** — estilização
- **@vueuse/motion** — animações
- **Day.js** — manipulação de datas

## Pré-requisitos

- Node.js >= 18
- PostgreSQL >= 14
- npm >= 9

## Instalação e Execução

### 1. Banco de Dados

Crie o banco PostgreSQL:

```sql
CREATE DATABASE leila_db;
```

### 2. Back-end

```bash
cd backend
cp .env.example .env   # edite se necessário
npm install
npm run seed           # popula o banco com dados iniciais
npm run start:dev      # inicia em http://localhost:3000
```

A documentação da API estará em: http://localhost:3000/api/docs

### 3. Front-end

```bash
cd frontend
cp .env .env.local     # edite se necessário
npm install
npm run dev            # inicia em http://localhost:5173
```

## Variáveis de Ambiente

### Back-end (`backend/.env`)

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

### Front-end (`frontend/.env`)

```
VITE_API_BASE_URL=http://localhost:3000/api
```

## Usuários de Teste

| Tipo   | E-mail             | Senha       |
|--------|-------------------|-------------|
| Admin  | admin@leila.com   | Admin@123   |
| Cliente| cliente@teste.com | Cliente@123 |

## Funcionalidades

### Módulo Cliente
- Cadastro e login com JWT
- Agendamento com seleção de serviços, data e horário (stepper de 3 passos)
- Sugestão inteligente de mesma semana (se já há agendamento na semana)
- Alteração de agendamento (apenas se faltam mais de 2 dias)
- Histórico de agendamentos com filtro por período
- Detalhes do agendamento com status individual dos serviços

### Módulo Admin
- Painel operacional com listagem, filtros e ações
- Confirmação de agendamentos
- Alteração de agendamentos sem restrição de prazo
- Gerenciamento de status individual de cada serviço
- Dashboard com métricas semanais, receita, serviço mais solicitado
- CRUD de serviços do salão

### Segurança
- JWT com guards de autenticação e autorização por role
- Validação server-side com class-validator em todos os endpoints
- Validação client-side antes de enviar ao servidor
- Rate limiting (100 req/min por IP)
- Helmet + Compression + CORS

### UX
- Animações em todas as views e interações (Motion.js)
- Loading states com skeleton loaders
- Toast notifications animadas
- Design responsivo com paleta rose/dourado

## Arquitetura

```
cabeleleila-leila/
├── backend/          # API NestJS
│   └── src/
│       ├── auth/           # Autenticação JWT + guards
│       ├── users/          # Gestão de usuários
│       ├── services/       # Serviços do salão
│       ├── appointments/   # Agendamentos + regras de negócio
│       ├── dashboard/      # Métricas e relatórios
│       ├── common/         # Filters, interceptors, pipes
│       ├── config/         # Configuração do banco
│       └── seed/           # Seed de dados iniciais
├── frontend/         # SPA Vue.js
│   └── src/
│       ├── components/     # UI, layout, appointments
│       ├── views/          # Client, admin, auth views
│       ├── stores/         # Pinia stores
│       ├── composables/    # Hooks reutilizáveis
│       ├── services/api/   # Camada de comunicação com API
│       ├── router/         # Vue Router com guards
│       └── types/          # TypeScript interfaces
```
