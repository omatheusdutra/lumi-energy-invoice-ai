# ⚡ Lumi Energy Invoice Intelligence

[![Node.js](https://img.shields.io/badge/Node.js-20.19%2B-339933?logo=nodedotjs&logoColor=white)](#-setup-local)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](#-arquitetura)
[![NestJS](https://img.shields.io/badge/NestJS-11-e0234e?logo=nestjs&logoColor=white)](#-decis%C3%B5es-arquiteturais)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)](#-decis%C3%B5es-arquiteturais)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](#-setup-local)
[![Tests](https://img.shields.io/badge/Tests-Jest%20%2B%20Vitest-0ea5e9)](#-testes-e-mock-de-llm)
[![License](https://img.shields.io/badge/License-MIT-111827)](LICENSE)

API NestJS + portal Next.js para ingestão de faturas de energia em PDF, extração multimodal com LLM, validação JSON estrita, cálculos do desafio Lumi e dashboards de energia/financeiro.

Foco em qualidade de produção: segurança, idempotência, observabilidade e testes.

## 🌐 Links de produção

- 🚀 **Produção (API):** https://lumi-energy-api-nlin.onrender.com
- 📘 **Produção (Swagger):** https://lumi-energy-api-nlin.onrender.com/docs
- 🧾 **Produção (JSON OpenAPI):** https://lumi-energy-api-nlin.onrender.com/docs-json
- 🖥️ **Produção (Web):** https://lumi-energy-invoice-ai.vercel.app

> Observação sobre o Render (plano free): após inatividade, a API pode levar alguns segundos para “acordar” na primeira requisição.

## 🔄 Atualização planejada

- A ação **Reprocessar** exibida na interface de faturas está prevista para um próximo update.
- No estado atual, o botão pode permanecer desabilitado quando o backend não disponibiliza essa operação.
- O objetivo é habilitar reprocessamento controlado sem quebrar o fluxo principal do teste.

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

### Dashboard de energia

```bash
curl "http://localhost:3000/dashboard/energia?numero_cliente=3001116735&periodo_inicio=2024-01&periodo_fim=2024-12"
```

### Dashboard financeiro

```bash
curl "http://localhost:3000/dashboard/financeiro?numero_cliente=3001116735&periodo_inicio=2024-01&periodo_fim=2024-12"
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
> No frontend, use apenas variáveis `NEXT_PUBLIC_*`.

### Backend (principais)

| Variável            | Obrigatória | Descrição                           |
| ------------------- | ----------- | ----------------------------------- |
| `NODE_ENV`          | Sim         | `development`, `test`, `production` |
| `APP_NAME`          | Sim         | Nome da API                         |
| `PORT`              | Sim         | Porta da API (padrão 3000)          |
| `DATABASE_URL`      | Sim         | Conexão PostgreSQL                  |
| `OPENAI_API_KEY`    | Sim         | Chave do provider LLM               |
| `OPENAI_BASE_URL`   | Não         | Base URL do provider                |
| `OPENAI_MODEL`      | Sim         | Modelo LLM                          |
| `OPENAI_TIMEOUT_MS` | Sim         | Timeout LLM                         |

## ⚙️ Setup local

Pré-requisitos:

- Node.js 20.19+
- Docker e Docker Compose (opcional, recomendado para banco)

Instalação:

```bash
npm ci
npm --prefix web ci
```

### Banco e Prisma

```bash
npm run prisma:generate
npm run prisma:migrate:deploy
npm run prisma:seed
```

## ▶️ Running (dev/prod)

Backend (dev):

```bash
npm run start:dev
```

Frontend (dev):

```bash
npm run dev:web
```

Build de produção:

```bash
npm run build
npm --prefix web run build
```

## 🧪 Testes e mock de LLM

Backend:

```bash
npm run test -- --runInBand
npm run test:integration -- --runInBand
npm run test:e2e -- --runInBand
```

Frontend:

```bash
npm --prefix web run test
npm --prefix web run test:cov
```

Qualidade:

```bash
npm run quality:check
npm --prefix web run quality:check
```

## 🔒 Notas de segurança

- Validação de upload por MIME + assinatura `%PDF-`.
- Limites de payload e rate limiting.
- `helmet` e proteção de headers.
- Timeout e retry no cliente LLM.
- Fallback/circuit breaker para instabilidade do provider.

## 🧩 Decisões arquiteturais

- **NestJS**: estrutura modular + DI + padrões robustos para API.
- **Prisma**: produtividade com tipagem forte e migrations previsíveis.
- **LLM via interface `LlmClient`**: desacoplamento de provider e testabilidade.

Trade-offs considerados:

- Mais validação e filtros aumentam segurança e previsibilidade.
- Circuit breaker reduz cascata de falhas externas.
- Estrutura modular aumenta manutenção de longo prazo.

## ✅ Checklist do teste (resumo)

- Upload de PDF e processamento multimodal via LLM.
- JSON estrito com validação.
- Cálculos derivados obrigatórios persistidos.
- Banco relacional com ORM.
- Endpoints de listagem e dashboards de energia/financeiro.
- Testes unitários/integrados/e2e sem dependência de chave real em cenários de teste.

---
