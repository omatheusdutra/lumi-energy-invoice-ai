# Lumi Web Portal

README canônico do projeto: [../README.md](../README.md)

Este arquivo cobre apenas detalhes do frontend (`web/`).

## Stack

- Next.js 14 (App Router) + TypeScript
- TanStack Query
- Zod
- Recharts
- Tailwind CSS
- Vitest + Testing Library

## Variáveis de ambiente

Arquivo: [`web/.env.example`](.env.example)

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Lumi Portal
NEXT_PUBLIC_ENABLE_EXPERIMENTAL_DASHBOARD=false
NEXT_PUBLIC_ENABLE_RENDER_PROFILING=false
```

## Setup e execução

```bash
npm --prefix web ci
npm --prefix web run dev
```

App local: `http://localhost:3001`

## Scripts

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

## Rotas principais

- `/dashboard`
- `/upload`
- `/invoices`
- `/creditos`
- `/unidades`
- `/configuracoes`
- `/pagamentos`

## Segurança no frontend

- Sem segredo no client (`OPENAI_API_KEY` nunca no frontend)
- CSP via `middleware.ts`
- Sem `dangerouslySetInnerHTML`
- Validação de payload com Zod

## Performance

- Charts com carregamento lazy/dinâmico
- Cache/deduplicação via TanStack Query
- Profiling opcional (`NEXT_PUBLIC_ENABLE_RENDER_PROFILING=true`)

Relatório de profiling: [PERF_REPORT.md](PERF_REPORT.md)
