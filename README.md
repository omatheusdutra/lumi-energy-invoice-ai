# âš¡ Lumi Energy Invoice Intelligence

[![Node.js](https://img.shields.io/badge/Node.js-20.19%2B-339933?logo=nodedotjs&logoColor=white)](#-setup-local)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](#-arquitetura)
[![NestJS](https://img.shields.io/badge/NestJS-11-e0234e?logo=nestjs&logoColor=white)](#-decisoes-arquiteturais)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)](#-decisoes-arquiteturais)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](#-setup-local)
[![Tests](https://img.shields.io/badge/Tests-Jest%20%2B%20Vitest-0ea5e9)](#-testes-e-mock-de-llm)
[![License](https://img.shields.io/badge/License-MIT-111827)](LICENSE)

API NestJS + portal Next.js para ingestÃ£o de faturas de energia em PDF, extraÃ§Ã£o multimodal com LLM, validaÃ§Ã£o JSON estrita, cÃ¡lculos do desafio Lumi e dashboards de energia/financeiro.
Direcionado Ã  qualidade de produÃ§Ã£o: seguranÃ§a, idempotÃªncia, observabilidade e testes. âš¡ðŸ”’ðŸ§ ðŸ“ŠðŸ§ª

## 🌐 Links de produção

- 🚀 **Produção (API):** https://lumi-energy-api-nlin.onrender.com
- 📘 **Produção (Swagger):** https://lumi-energy-api-nlin.onrender.com/docs
- 🧾 **Produção (JSON OpenAPI):** https://lumi-energy-api-nlin.onrender.com/docs-json
- 🖥️ **Produção (Web):** https://lumi-energy-invoice-ai.vercel.app

## 🔄 Atualização planejada

- A ação **Reprocessar** exibida na interface de faturas está prevista para um próximo update.
- No estado atual, o botão permanece desabilitado quando o backend não disponibiliza essa operação.
- O objetivo é habilitar reprocessamento controlado sem quebrar o fluxo principal do teste.
## ðŸ§­ Hierarquia da documentaÃ§Ã£o

- `README.md` (raiz): referÃªncia canÃ´nica do projeto.
- [web/README.md](web/README.md): detalhes especÃ­ficos do frontend.
- [docs/README.md](docs/README.md): Ã­ndice rÃ¡pido sem duplicaÃ§Ã£o.

## ðŸ§  Overview

Fluxo principal exigido pelo teste:

1. Upload de PDF (`POST /invoices/upload`).
2. Envio do PDF ao LLM multimodal (sem OCR/parser local).
3. Resposta em JSON estrito (schema fechado).
4. ValidaÃ§Ã£o + normalizaÃ§Ã£o de nÃºmeros pt-BR.
5. CÃ¡lculos derivados obrigatÃ³rios.
6. PersistÃªncia relacional com Prisma/PostgreSQL.
7. ExposiÃ§Ã£o dos endpoints de listagem e dashboards.

CÃ¡lculos obrigatÃ³rios implementados:

- `consumo_kwh = energia_eletrica_kwh + energia_sceee_kwh`
- `energia_compensada_kwh = energia_compensada_gdi_kwh`
- `valor_total_sem_gd = energia_eletrica_rs + energia_sceee_rs + contrib_ilum_rs`
- `economia_gd_rs = energia_compensada_gdi_rs`

## ðŸ—ï¸ Arquitetura

### Backend

- Framework: NestJS 11 (mÃ³dulos, DI, filtros, interceptors e guards).
- ORM: Prisma sobre PostgreSQL.
- AbstraÃ§Ã£o de LLM: interface `LlmClient` com providers:
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
- Rotas de upload, dashboard, faturas, crÃ©ditos, unidades, configuraÃ§Ãµes e pagamentos.

## ðŸ“¡ API Endpoints

### Core do teste

| MÃ©todo | Endpoint                | DescriÃ§Ã£o                   |
| ------- | ----------------------- | ----------------------------- |
| `POST`  | `/invoices/upload`      | Upload e processamento de PDF |
| `GET`   | `/invoices`             | Listagem paginada com filtros |
| `GET`   | `/dashboard/energia`    | Resultado de energia (kWh)    |
| `GET`   | `/dashboard/financeiro` | Resultado financeiro (R$)     |

### Complementares do projeto

| MÃ©todo | Endpoint                     | DescriÃ§Ã£o            |
| ------- | ---------------------------- | ---------------------- |
| `GET`   | `/dashboard/kpis`            | KPIs e benchmark       |
| `GET`   | `/alerts`                    | Alertas de anomalia    |
| `GET`   | `/tariff-readiness/plans`    | Planos tarifÃ¡rios     |
| `POST`  | `/tariff-readiness/simulate` | SimulaÃ§Ã£o tarifÃ¡ria |
| `GET`   | `/`                          | Info bÃ¡sica da API    |
| `GET`   | `/health/liveness`           | Liveness               |
| `GET`   | `/health/readiness`          | Readiness              |
| `GET`   | `/metrics`                   | MÃ©tricas Prometheus   |
| `GET`   | `/docs`                      | Swagger                |

## ðŸ“¥ Exemplos de requisiÃ§Ãµes (curl)

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

## ðŸš¨ Tratamento de erros

Formato de erro padrÃ£o:

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

- `400`: arquivo invÃ¡lido, filtro invÃ¡lido ou ausÃªncia de `file`.
- `422`: JSON/schema invÃ¡lido retornado pelo LLM.
- `502`: indisponibilidade do provider LLM/circuit breaker.
- `503`: readiness indisponÃ­vel.

## ðŸ” VariÃ¡veis de ambiente

Arquivo base: [.env.example](.env.example)

> `OPENAI_API_KEY` e qualquer segredo de LLM ficam somente no backend.
> No frontend use apenas variÃ¡veis `NEXT_PUBLIC_*`.

### Backend (principais)

| VariÃ¡vel            | ObrigatÃ³ria | DescriÃ§Ã£o                         |
| -------------------- | ------------ | ----------------------------------- |
| `NODE_ENV`           | Sim          | `development`, `test`, `production` |
| `APP_NAME`           | Sim          | Nome da API                         |
| `PORT`               | Sim          | Porta da API (padrÃ£o 3000)         |
| `DATABASE_URL`       | Sim          | ConexÃ£o PostgreSQL                 |
| `OPENAI_API_KEY`     | Sim          | Chave do provider LLM               |
| `OPENAI_BASE_URL`    | NÃ£o         | Base URL do provider                |
| `OPENAI_MODEL`       | Sim          | Modelo LLM                          |
| `OPENAI_TIMEOUT_MS`  | Sim          | Timeout LLM                         |
| `OPENAI_MAX_RETRIES` | Sim          | Retries LLM                         |
| `LOG_LEVEL`          | Sim          | NÃ­vel de logs                      |
| `LOG_FORMAT`         | NÃ£o         | `pretty`/`json`                     |

### Backend (seguranÃ§a e operaÃ§Ã£o)

| VariÃ¡vel                               |
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

| VariÃ¡vel                                   | DescriÃ§Ã£o                               |
| ------------------------------------------- | ----------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`                  | URL da API (ex.: `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_NAME`                      | Nome exibido no portal                    |
| `NEXT_PUBLIC_ENABLE_EXPERIMENTAL_DASHBOARD` | Flag de UI                                |
| `NEXT_PUBLIC_ENABLE_RENDER_PROFILING`       | Profiling em dev                          |

## âš™ï¸ Setup local

Pre-requisitos:

- Node.js `20.19.0` (ver `.nvmrc`)
- npm 10+
- Docker + Docker Compose

### InstalaÃ§Ã£o

```bash
npm ci
npm --prefix web ci
```

### Banco e migraÃ§Ãµes

```bash
docker compose up -d postgres
npm run prisma:generate:safe
npm run prisma:migrate:deploy:safe
```

### Seed opcional

```bash
npm run prisma:seed
```

## â–¶ï¸ ExecuÃ§Ã£o (dev e prod)

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

### ProduÃ§Ã£o

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

## ðŸ§ª Testes e mock de LLM

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

## ðŸ›¡ï¸ Security notes

- ValidaÃ§Ã£o de PDF por MIME + assinatura `%PDF-`.
- Limites de upload e body configurÃ¡veis.
- `helmet`, `throttler` e `requestId` ativos.
- Schema estrito (`additionalProperties: false`) + validaÃ§Ã£o Zod.
- Retry/backoff/circuit-breaker para resiliÃªncia no provider LLM.
- Logs estruturados com controle de stack e sem vazamento de payload sensÃ­vel.

## ðŸ§© DecisÃµes arquiteturais

### Framework backend: NestJS

- Modularidade, DI e testabilidade forte.
- Pipeline nativo para validaÃ§Ã£o, filtros e observabilidade.

### ORM: Prisma

- Tipagem ponta a ponta em TypeScript.
- MigraÃ§Ãµes previsÃ­veis e queries agregadas eficientes.
- Constraints para deduplicaÃ§Ã£o/idempotÃªncia (`hashSha256`, `dedupCompositeKey`).

### LLM: abstraÃ§Ã£o com providers plugÃ¡veis

- `GeminiClient` e `OpenAiResponsesClient` sob `LlmClient`.
- Reduz acoplamento e lock-in.
- Permite fallback de provider sem tocar regra de negÃ³cio.

Trade-offs:

- Mais validaÃ§Ãµes e resiliÃªncia aumentam complexidade.
- Em troca, reduz risco de dados incorretos e melhora robustez operacional.

## âœ… Checklist do teste Lumi

| Item                                                   | Status |
| ------------------------------------------------------ | ------ |
| Upload de PDF via API                                  | âœ…    |
| PDF enviado ao LLM multimodal (sem OCR local)          | âœ…    |
| JSON estrito com schema fechado                        | âœ…    |
| CÃ¡lculos obrigatÃ³rios implementados                  | âœ…    |
| PersistÃªncia relacional com ORM                       | âœ…    |
| `GET /invoices` com filtros/paginaÃ§Ã£o                | âœ…    |
| `GET /dashboard/energia` e `GET /dashboard/financeiro` | âœ…    |
| Tratamento de erro consistente (`400/422/502/503`)     | âœ…    |
| Testes automatizados com mock de LLM                   | âœ…    |
| DocumentaÃ§Ã£o completa de setup/env/execuÃ§Ã£o/API    | âœ…    |

## ðŸ”— ReferÃªncias

- Frontend: [web/README.md](web/README.md)
- Ãndice de docs: [docs/README.md](docs/README.md)

