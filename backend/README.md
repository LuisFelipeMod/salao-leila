# Backend — Salão de Beleza Leila

API REST construída com NestJS, TypeORM e PostgreSQL. Expõe todos os endpoints consumidos pelo frontend e aplica as regras de negócio do sistema de agendamento.

## Tecnologias

| Biblioteca | Uso |
|-----------|-----|
| NestJS 11 | Framework principal — módulos, controllers, services, guards |
| TypeORM 0.3 | ORM com `synchronize: true` (auto-migration em dev) |
| PostgreSQL 15+ | Banco de dados relacional |
| Passport.js + passport-jwt | Estratégia JWT para autenticação |
| passport-local | Estratégia local (email + senha) para login |
| class-validator | Validação declarativa nos DTOs |
| class-transformer | Transformação e serialização de payloads |
| bcrypt | Hash de senhas (salt rounds = 12) |
| Swagger / OpenAPI | Documentação interativa em `/api/docs` |
| Helmet | Headers HTTP de segurança |
| @nestjs/throttler | Rate limiting (100 req/min por IP) |
| compression | Compressão gzip das respostas |
| Day.js | Manipulação de datas com plugin isoWeek |

## Estrutura

```
src/
├── auth/
│   ├── strategies/       # JwtStrategy, LocalStrategy
│   ├── guards/           # JwtAuthGuard, RolesGuard
│   ├── decorators/       # @Roles()
│   ├── dto/              # LoginDto, RegisterDto
│   ├── auth.controller.ts
│   └── auth.service.ts
├── users/
│   ├── entities/         # User (id, name, email, phone, passwordHash, role)
│   ├── dto/              # CreateUserDto
│   └── users.service.ts
├── services/
│   ├── entities/         # Service (id, name, description, price, durationMinutes, isActive)
│   ├── dto/              # CreateServiceDto, UpdateServiceDto
│   └── services.service.ts
├── appointments/
│   ├── entities/         # Appointment, AppointmentServiceEntity
│   ├── dto/              # CreateAppointmentDto, UpdateAppointmentDto
│   └── appointments.service.ts  # Toda a lógica de negócio
├── dashboard/
│   ├── dashboard.controller.ts  # GET /dashboard/stats?period=, GET /dashboard/today
│   └── dashboard.service.ts
├── common/
│   ├── filters/          # HttpExceptionFilter — formato padrão de erros
│   ├── interceptors/     # TransformInterceptor — envelope { data, statusCode, timestamp }
│   └── utils/            # paginate() — paginação reutilizável
├── config/
│   └── database.config.ts
└── seed/
    └── seed.ts           # Admin + cliente teste + 8 serviços
```

## Como Rodar

```bash
npm install
cp .env.example .env    # configure as variáveis
npm run seed            # popula o banco
npm run start:dev       # porta 3000, hot reload
npm run build           # build de produção
npm run start:prod      # executa o build
```

**Variáveis de ambiente** (`.env`):
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

## Endpoints

### Auth (`/api/auth`)
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/register` | Cadastro — retorna `access_token` + user |
| POST | `/login` | Login — retorna `access_token` + user |
| GET | `/me` | Perfil do usuário autenticado |

### Serviços (`/api/services`)
| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/` | Público | Lista serviços ativos (paginado) |
| POST | `/` | ADMIN | Cria serviço |
| PATCH | `/:id` | ADMIN | Atualiza serviço |
| DELETE | `/:id` | ADMIN | Desativa serviço (soft delete) |

### Agendamentos (`/api/appointments`)
| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| POST | `/` | CLIENT | Cria agendamento |
| GET | `/my` | CLIENT | Lista agendamentos da cliente (paginado, filtros) |
| GET | `/check-week?date=` | CLIENT | Verifica agendamento na semana — retorna `hasAppointment`, `existingDate`, `existingTime` |
| PATCH | `/:id` | CLIENT | Edita agendamento (regra dos 2 dias) |
| DELETE | `/:id` | CLIENT | Cancela agendamento (regra dos 2 dias) |
| GET | `/` | ADMIN | Lista todos os agendamentos (paginado, filtros) |
| GET | `/:id` | Autenticado | Detalhes de um agendamento |
| PATCH | `/:id/confirm` | ADMIN | Confirma agendamento |
| PATCH | `/:id/admin-update` | ADMIN | Edita status e/ou observações |
| PATCH | `/:id/services/:serviceId` | ADMIN | Atualiza status de item de serviço |

### Dashboard (`/api/dashboard`)
| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/stats?period=weekly\|monthly\|total` | ADMIN | Métricas do período |
| GET | `/today` | ADMIN | Agendamentos do dia atual |

## Padrões e Convenções

### Resposta Padrão
Todas as respostas passam pelo `TransformInterceptor`:
```json
{
  "data": { ... },
  "statusCode": 200,
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### Erros
O `HttpExceptionFilter` padroniza os erros:
```json
{
  "statusCode": 400,
  "message": "scheduledDate must be in YYYY-MM-DD format",
  "error": "Bad Request",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "path": "/api/appointments"
}
```

### Autenticação
1. Cliente envia `Authorization: Bearer <token>` no header
2. `JwtAuthGuard` valida e decodifica o token
3. `req.user` fica disponível nos controllers com `{ id, email, role }`
4. `RolesGuard` + `@Roles(UserRole.ADMIN)` protege rotas exclusivas do admin

### Paginação
Utilitário `paginate(repo, page, limit, options)` retorna:
```json
{ "data": [...], "total": 100, "page": 1, "lastPage": 10 }
```

## Regras de Negócio

### Conflito de Horários
`checkTimeConflict()` busca todos os agendamentos não cancelados do mesmo dia e verifica sobreposição com aritmética de minutos:
```
newStart < existingEnd && newEnd > existingStart  →  ConflictException (409)
```
O campo `totalDuration` é armazenado no agendamento para evitar joins extras.

### Snapshot de Preços
O preço de cada serviço é copiado em `AppointmentServiceEntity.price` no momento da criação. Alterações no catálogo não afetam agendamentos passados.

### Regra dos 2 Dias
`updateByClient()` e `cancelByClient()` calculam `dayjs(scheduledDate).diff(dayjs(), 'day')`. Se `< 2`, lança `BadRequestException`.

### Sugestão de Mesma Semana
`checkSameWeek()` consulta agendamentos PENDING ou CONFIRMED da cliente na semana ISO. `checkWeekEndpoint()` retorna `{ hasAppointment, existingDate, existingTime }` para o frontend oferecer a opção de reutilizar a data.

### Dashboard por Período
`getWeeklyStats(period)` aceita `'weekly'`, `'monthly'` ou `'total'`. A cláusula `where` é ajustada dinamicamente; para `'total'`, nenhum filtro de data é aplicado.

## Testes

```bash
npm test            # Jest — testes unitários com repositórios mockados
npm run test:e2e    # Jest — testes E2E com pipeline NestJS real e service mocked
npm run test:cov    # cobertura de código
```

### Estrutura de Testes
- **Unitários** (`src/**/*.spec.ts`): cada service testado isoladamente com `mockRepo()` factory
- **E2E** (`test/*.e2e-spec.ts`): app NestJS real (controllers, guards, pipes, interceptors, filtros) com services mocked via `useValue`; tokens JWT gerados pelo `JwtService` com `process.env.JWT_SECRET`

## Documentação Interativa

Com o servidor rodando, acesse:
```
http://localhost:3000/api/docs
```
Swagger UI com todos os endpoints, schemas dos DTOs e suporte a autenticação Bearer.
