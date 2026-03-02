# ⚡ Energy Analytics Hub - Frontend

[![Next.js](https://img.shields.io/badge/Next.js-14-111827?logo=nextdotjs&logoColor=white)](#-setup-local)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=111827)](#-stack)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](#-stack)
[![TanStack Query](https://img.shields.io/badge/TanStack%20Query-v5-ff4154?logo=reactquery&logoColor=white)](#-stack)
[![Recharts](https://img.shields.io/badge/Recharts-2.x-22c55e)](#-stack)
[![Tests](https://img.shields.io/badge/Tests-Vitest%20%2B%20Testing%20Library-0ea5e9)](#-testes)

Frontend Next.js do portal **Energy Analytics Hub**, consumindo a API NestJS para upload de faturas, dashboards energeticos/financeiros e analise operacional.

README canonico do projeto (backend + frontend): [../README.md](../README.md)

## 🧠 Overview

Este README cobre apenas o escopo de `web/`:

- UI de upload e preview de faturas
- Dashboards de energia e financeiro
- Listagem de faturas com filtros
- Paginas de creditos, unidades, configuracoes e pagamentos

## 🧱 Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- TanStack Query (cache, dedupe e refetch)
- Zod (validacao de contratos)
- Axios (client HTTP)
- Recharts (visualizacao de dados)
- Tailwind CSS
- Vitest + Testing Library

## 🔐 Variaveis de ambiente

Arquivo base: [web/.env.example](.env.example)

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Energy Analytics Hub
NEXT_PUBLIC_ENABLE_EXPERIMENTAL_DASHBOARD=false
NEXT_PUBLIC_ENABLE_RENDER_PROFILING=false
```

Notas:

- Use apenas variaveis `NEXT_PUBLIC_*` no frontend.
- Nunca exponha segredos de LLM no frontend.

## ⚙️ Setup local

Instalacao:

```bash
npm --prefix web ci
```

Desenvolvimento:

```bash
npm --prefix web run dev
```

App local: `http://localhost:3001`

## ▶️ Scripts

```bash
npm --prefix web run dev
npm --prefix web run build
npm --prefix web run start
npm --prefix web run lint
npm --prefix web run typecheck
npm --prefix web run test
npm --prefix web run test:cov
npm --prefix web run quality:check
```

## 📡 Rotas principais

- `/dashboard`
- `/upload`
- `/invoices`
- `/creditos`
- `/unidades`
- `/configuracoes`
- `/pagamentos`

## 🔗 Integracao com API

Base URL configurada por `NEXT_PUBLIC_API_BASE_URL`.

Endpoints consumidos no frontend:

- `POST /invoices/upload`
- `GET /invoices`
- `GET /dashboard/energia`
- `GET /dashboard/financeiro`
- `GET /dashboard/kpis`
- `GET /alerts`

## 🔒 Seguranca no frontend

- Sem `dangerouslySetInnerHTML`
- Sanitizacao de exibicao pelo fluxo React
- Validacao de payloads com Zod
- Headers de seguranca via configuracao do app

## 🚀 Performance

- Lazy load de componentes de grafico
- Cache e deduplicacao de requisicoes com TanStack Query
- Flags de profiling para analise de render

Relatorio de profiling: [PERF_REPORT.md](PERF_REPORT.md)

## 🧪 Testes

```bash
npm --prefix web run test
npm --prefix web run test:cov
```

## 🔄 Atualização planejada

- A função **Reprocessar** na tabela de faturas está mapeada na UI, mas depende de suporte backend para ativação.
- Até essa entrega, o botão pode aparecer desabilitado com mensagem informativa.
## 🌐 Deploy (Vercel)

Configuracao recomendada:

- Framework: Next.js
- Root Directory: `web`
- Build Command: `npm run build`

Env vars minimas em producao:

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_APP_NAME`

Para evitar bloqueio de browser, configure `CORS_ORIGIN` no backend com a URL do frontend publicado.

## 📎 Referencias

- README principal: [../README.md](../README.md)
- Docs index: [../docs/README.md](../docs/README.md)

