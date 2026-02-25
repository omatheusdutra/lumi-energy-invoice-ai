# Submission Report - Teste Pratico Lumi

## 1) Escopo entregue

- API REST NestJS/TypeScript para ingestao de PDF de fatura de energia.
- PDF enviado direto ao LLM multimodal (sem extracao local por OCR/pdf parser).
- Structured Output/JSON estrito validado por schema.
- Calculos derivados e persistencia relacional com Prisma/PostgreSQL.
- Endpoints core: upload, listagem, dashboard energia e dashboard financeiro.
- Testes unitarios, integracao e e2e com mock de LLM.

## 2) Checklist do edital

- [x] Upload PDF com validacao de mimetype, assinatura `%PDF-` e limite de tamanho.
- [x] Pipeline PDF -> LLM multimodal -> JSON estrito -> validacao -> persistencia.
- [x] Campos obrigatorios e normalizacao pt-BR.
- [x] Derivados: `consumo_kwh`, `energia_compensada_kwh`, `valor_total_sem_gd`, `economia_gd_rs`.
- [x] Banco relacional + ORM (PostgreSQL + Prisma).
- [x] `GET /invoices` com filtros/paginacao.
- [x] `GET /dashboard/energia` e `GET /dashboard/financeiro`.
- [x] Erros coerentes: 400, 422, 502.
- [x] Seguranca baseline: helmet, throttling, request-id, validacao global.
- [x] README com setup, env vars, execucao e exemplos.

## 3) Melhorias de arquitetura aplicadas

- Separacao de provider LLM por classe:
  - `OpenAiResponsesClient`
  - `GeminiClient`
- Selecao via factory/DI (`LlmClient`) para reduzir acoplamento.
- Resiliencia compartilhada em base comum (`retry`, `backoff`, `circuit breaker`, parse/erros).
- Unificacao de DTO de dashboard para evitar drift.

## 4) Evidencias de execucao local

Execucao local validada em **2026-02-25**:

- `npm run quality:check`
  - `format:check` OK
  - `lint` OK
- `npm run test -- --runInBand`
  - **12 suites**, **24 testes**, todos OK
- `npm run test:integration -- --runInBand`
  - **1 suite**, **2 testes**, todos OK
- `npm run test:e2e -- --runInBand`
  - **3 suites**, **16 testes**, todos OK
- `npm run build`
  - compilacao TypeScript OK

## 5) Comando unico para avaliacao

```bash
npm run submission:check
```

## 6) Como reproduzir rapidamente

```bash
docker compose up -d postgres
npm ci
npm run prisma:generate:safe
npm run prisma:migrate:deploy:safe
npm run submission:check
```

## 7) Evidencia funcional com PDFs reais

Fluxo de upload em lote com os arquivos fornecidos foi executado e retornou `HTTP 201` para os PDFs processados.
