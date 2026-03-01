# ⚡ Lumi Energy Invoice Intelligence

[![Node.js](https://img.shields.io/badge/Node.js-20.19%2B-339933?logo=nodedotjs&logoColor=white)](#-setup-local)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](#-arquitetura)
[![NestJS](https://img.shields.io/badge/NestJS-11-e0234e?logo=nestjs&logoColor=white)](#-decisoes-arquiteturais)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)](#-decisoes-arquiteturais)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](#-setup-local)
[![Tests](https://img.shields.io/badge/Tests-Jest%20%2B%20Vitest-0ea5e9)](#-testes-e-mock-de-llm)
[![License](https://img.shields.io/badge/License-MIT-111827)](LICENSE)

API NestJS + portal Next.js para ingestão de faturas de energia em PDF, extração multimodal com LLM, validação JSON estrita, cálculos do desafio Lumi e dashboards de energia/financeiro.
Direcionado à qualidade de produção: segurança, idempotência, observabilidade e testes. ⚡🔒🧠📊🧪

## 🧭 Hierarquia da documentação

- `README.md` (raiz): referência canônica do projeto.
- [web/README.md](web/README.md): detalhes específicos do frontend.
- [docs/README.md](docs/README.md): índice rápido sem duplicação.

## 🧠 Overview

Fluxo principal exigido pelo teste:

1. Upload de PDF (`POST /invoices/upload`).
2. Envio do PDF ao LLM multimodal (sem OCR/parser local).
3. Resposta em JSON estrito (schema fechado).
4. Validação + normalização de números pt-BR.
5. Cálculos derivados obrigatórios.
6. Persistência relacional com Prisma/PostgreSQL.
7. Exposição dos endpoints de listagem e dashboards.

Cálculos obrigatórios implementados:

- `consumo_kwh = energia_eletrica_kwh + energia_sceee_kwh`
- `energia_compensada_kwh = energia_compensada_gdi_kwh`
- `valor_total_sem_gd = energia_eletrica_rs + energia_sceee_rs + contrib_ilum_rs`
- `economia_gd_rs = energia_compensada_gdi_rs`

## 🏗️ Arquitetura

### Backend

- Framework: NestJS 11 (módulos, DI, filtros, interceptors e guards).
- ORM: Prisma sobre PostgreSQL.
- Abstração de LLM: interface `LlmClient` com providers:
  - `GeminiClient`
  - `OpenAiResponsesClient`
- Cross-cutting:
  - `ValidationPipe` global
  - `HttpExceptionFilter`
  - `requestIdMiddleware`
  - `HttpLoggingInterceptor`
  - `helmet` + throttling global

### Frontend

- Next.js 14 (App Router) + TypeScript.
- TanStack Query + Zod + Recharts.
- Rotas de upload, dashboard, faturas, créditos, unidades, configurações e pagamentos.

## 📡 API Endpoints

### Core do teste

| Método | Endpoint                | Descrição                     |
| ------ | ----------------------- | ----------------------------- |
| `POST` | `/invoices/upload`      | Upload e processamento de PDF |
| `GET`  | `/invoices`             | Listagem paginada com filtros |
| `GET`  | `/dashboard/energia`    | Resultado de energia (kWh)    |
| `GET`  | `/dashboard/financeiro` | Resultado financeiro (R$)     |

### Complementares do projeto

| Método | Endpoint                     | Descrição           |
| ------ | ---------------------------- | ------------------- |
| `GET`  | `/dashboard/kpis`            | KPIs e benchmark    |
| `GET`  | `/alerts`                    | Alertas de anomalia |
| `GET`  | `/tariff-readiness/plans`    | Planos tarifários   |
| `POST` | `/tariff-readiness/simulate` | Simulação tarifária |
| `GET`  | `/`                          | Info básica da API  |
| `GET`  | `/health/liveness`           | Liveness            |
| `GET`  | `/health/readiness`          | Readiness           |
| `GET`  | `/metrics`                   | Métricas Prometheus |
| `GET`  | `/docs`                      | Swagger             |

## 📥 Exemplos de requisições (curl)

### Upload e processamento de fatura

```bash
curl -X POST "http://localhost:3000/invoices/upload" \
  -H "x-request-id: req-local-001" \
  -F "file=@./fatura.pdf;type=application/pdf"
```

Resposta 201 (exemplo):

```json
{
  "id": "00128fe2-1650-41f0-8524-982d45e92256",
  "numeroCliente": "7204076116",
  "mesReferencia": "JAN/2024",
  "energiaEletricaKwh": 50,
  "energiaSceeeKwh": 456,
  "energiaCompensadaGdiKwh": 456,
  "contribIlumRs": 49.43,
  "consumoKwh": 506,
  "energiaCompensadaKwh": 456,
  "valorTotalSemGd": 329.6,
  "economiaGdRs": 222.22,
  "sourceFilename": "3001116735-01-2024.pdf",
  "createdAt": "2026-02-25T12:38:21.737Z"
}
```

### Listagem com filtros

```bash
curl "http://localhost:3000/invoices?numero_cliente=3001116735&mes_referencia=SET/2024&page=1&pageSize=20"
```

Resposta 200 (exemplo):

```json
{
  "data": [
    {
      "id": "00128fe2-1650-41f0-8524-982d45e92256",
      "numeroCliente": "3001116735",
      "mesReferencia": "SET/2024"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1,
  "totalPages": 1
}
```

### Dashboard de energia

```bash
curl "http://localhost:3000/dashboard/energia?numero_cliente=3001116735&periodo_inicio=2024-01&periodo_fim=2024-12"
```

Resposta 200 (exemplo):

```json
{
  "consumo_kwh_total": 120,
  "energia_compensada_kwh_total": 30,
  "series": [
    {
      "mes_referencia": "SET/2024",
      "consumo_kwh": 120,
      "energia_compensada_kwh": 30
    }
  ]
}
```

### Dashboard financeiro

```bash
curl "http://localhost:3000/dashboard/financeiro?numero_cliente=3001116735&periodo_inicio=2024-01&periodo_fim=2024-12"
```

Resposta 200 (exemplo):

```json
{
  "valor_total_sem_gd_total": 65,
  "economia_gd_total": 15,
  "series": [
    {
      "mes_referencia": "SET/2024",
      "valor_total_sem_gd": 65,
      "economia_gd": 15
    }
  ]
}
```

## 🚨 Tratamento de erros

Formato de erro padrão:

```json
{
  "statusCode": 422,
  "message": "LLM returned invalid JSON",
  "path": "/invoices/upload",
  "requestId": "129d37a4-327f-4c2e-b89b-c39599fa58e3",
  "timestamp": "2026-02-28T03:27:31.288Z"
}
```

Status esperados:

- `400`: arquivo inválido, filtro inválido ou ausência de `file`.
- `422`: JSON/schema inválido retornado pelo LLM.
- `502`: indisponibilidade do provider LLM/circuit breaker.
- `503`: readiness indisponível.

## 🔐 Variáveis de ambiente

Arquivo base: [.env.example](.env.example)

> `OPENAI_API_KEY` e qualquer segredo de LLM ficam somente no backend.
> No frontend use apenas variáveis `NEXT_PUBLIC_*`.

### Backend (principais)

| Variável             | Obrigatória | Descrição                           |
| -------------------- | ----------- | ----------------------------------- |
| `NODE_ENV`           | Sim         | `development`, `test`, `production` |
| `APP_NAME`           | Sim         | Nome da API                         |
| `PORT`               | Sim         | Porta da API (padrão 3000)          |
| `DATABASE_URL`       | Sim         | Conexão PostgreSQL                  |
| `OPENAI_API_KEY`     | Sim         | Chave do provider LLM               |
| `OPENAI_BASE_URL`    | Não         | Base URL do provider                |
| `OPENAI_MODEL`       | Sim         | Modelo LLM                          |
| `OPENAI_TIMEOUT_MS`  | Sim         | Timeout LLM                         |
| `OPENAI_MAX_RETRIES` | Sim         | Retries LLM                         |
| `LOG_LEVEL`          | Sim         | Nível de logs                       |
| `LOG_FORMAT`         | Não         | `pretty`/`json`                     |

### Backend (segurança e operação)

| Variável                                |
| --------------------------------------- |
| `UPLOAD_MAX_MB`                         |
| `JSON_BODY_LIMIT_MB`                    |
| `URLENCODED_BODY_LIMIT_MB`              |
| `CORS_ORIGIN`                           |
| `RATE_LIMIT_TTL`                        |
| `RATE_LIMIT_LIMIT`                      |
| `TRUST_PROXY`                           |
| `HEALTHCHECK_TIMEOUT_MS`                |
| `MAX_PAGE_SIZE`                         |
| `LLM_CIRCUIT_BREAKER_ENABLED`           |
| `LLM_CIRCUIT_BREAKER_FAILURE_THRESHOLD` |
| `LLM_CIRCUIT_BREAKER_COOLDOWN_MS`       |
| `FEATURE_DATA_QUALITY_ENABLED`          |
| `FEATURE_ALERTS_ENABLED`                |
| `FEATURE_TARIFF_READINESS_ENABLED`      |
| `FEATURE_BENCHMARK_ENABLED`             |
| `ALERT_SPIKE_PERCENT_THRESHOLD`         |
| `ALERT_ZSCORE_THRESHOLD`                |
| `ALERT_BASELINE_MIN_MONTHS`             |
| `KPI_TOP_N_DEFAULT`                     |
| `RAW_LLM_AUDIT_TTL_DAYS`                |
| `PRISMA_GENERATE_MAX_ATTEMPTS`          |
| `PRISMA_GENERATE_BASE_DELAY_MS`         |
| `PRISMA_MIGRATE_MAX_ATTEMPTS`           |
| `PRISMA_MIGRATE_BASE_DELAY_MS`          |

### Frontend (`web/.env.example`)

| Variável                                    | Descrição                                 |
| ------------------------------------------- | ----------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`                  | URL da API (ex.: `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_NAME`                      | Nome exibido no portal                    |
| `NEXT_PUBLIC_ENABLE_EXPERIMENTAL_DASHBOARD` | Flag de UI                                |
| `NEXT_PUBLIC_ENABLE_RENDER_PROFILING`       | Profiling em dev                          |

## ⚙️ Setup local

Pre-requisitos:

- Node.js `20.19.0` (ver `.nvmrc`)
- npm 10+
- Docker + Docker Compose

### Instalação

```bash
npm ci
npm --prefix web ci
```

### Banco e migrações

```bash
docker compose up -d postgres
npm run prisma:generate:safe
npm run prisma:migrate:deploy:safe
```

### Seed opcional

```bash
npm run prisma:seed
```

## ▶️ Execução (dev e prod)

### Desenvolvimento

API:

```bash
npm run dev:api
```

Web:

```bash
npm run dev:web
```

URLs:

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/docs`
- Web: `http://localhost:3001/dashboard`

### Produção

Backend:

```bash
npm run build
npm run start:prod
```

Frontend:

```bash
npm --prefix web run build
npm --prefix web run start
```

## 🧪 Testes e mock de LLM

Backend:

```bash
npm run quality:check
npm run test -- --runInBand
npm run test:integration -- --runInBand
npm run test:e2e -- --runInBand
npm run test:cov
```

Frontend:

```bash
npm --prefix web run lint
npm --prefix web run typecheck
npm --prefix web run test
npm --prefix web run test:cov
```

Mock de LLM:

- Unit tests usam `LlmClient` mockado.
- E2E sobrescreve provider `LLM_CLIENT` com doubles, sem rede real.

## 🛡️ Security notes

- Validação de PDF por MIME + assinatura `%PDF-`.
- Limites de upload e body configuráveis.
- `helmet`, `throttler` e `requestId` ativos.
- Schema estrito (`additionalProperties: false`) + validação Zod.
- Retry/backoff/circuit-breaker para resiliência no provider LLM.
- Logs estruturados com controle de stack e sem vazamento de payload sensível.

## 🧩 Decisões arquiteturais

### Framework backend: NestJS

- Modularidade, DI e testabilidade forte.
- Pipeline nativo para validação, filtros e observabilidade.

### ORM: Prisma

- Tipagem ponta a ponta em TypeScript.
- Migrações previsíveis e queries agregadas eficientes.
- Constraints para deduplicação/idempotência (`hashSha256`, `dedupCompositeKey`).

### LLM: abstração com providers plugáveis

- `GeminiClient` e `OpenAiResponsesClient` sob `LlmClient`.
- Reduz acoplamento e lock-in.
- Permite fallback de provider sem tocar regra de negócio.

Trade-offs:

- Mais validações e resiliência aumentam complexidade.
- Em troca, reduz risco de dados incorretos e melhora robustez operacional.

## ✅ Checklist do teste Lumi

| Item                                                   | Status |
| ------------------------------------------------------ | ------ |
| Upload de PDF via API                                  | ✅     |
| PDF enviado ao LLM multimodal (sem OCR local)          | ✅     |
| JSON estrito com schema fechado                        | ✅     |
| Cálculos obrigatórios implementados                    | ✅     |
| Persistência relacional com ORM                        | ✅     |
| `GET /invoices` com filtros/paginação                  | ✅     |
| `GET /dashboard/energia` e `GET /dashboard/financeiro` | ✅     |
| Tratamento de erro consistente (`400/422/502/503`)     | ✅     |
| Testes automatizados com mock de LLM                   | ✅     |
| Documentação completa de setup/env/execução/API        | ✅     |

## 🔗 Referências

- Frontend: [web/README.md](web/README.md)
- Índice de docs: [docs/README.md](docs/README.md)
