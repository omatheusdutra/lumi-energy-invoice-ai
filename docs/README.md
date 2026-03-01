# ⚡ Energy Analytics Hub - Docs Index

[![Docs](https://img.shields.io/badge/Docs-Index-2563eb)](../README.md)
[![Canonical](https://img.shields.io/badge/Source-README.md-111827)](../README.md)
[![Frontend](https://img.shields.io/badge/Frontend-web%2FREADME.md-0ea5e9)](../web/README.md)

This folder is the documentation entrypoint for quick navigation.

## Canonical hierarchy

1. [../README.md](../README.md) - canonical project documentation (API + architecture + setup + tests).
2. [../web/README.md](../web/README.md) - frontend-specific documentation (Next.js app).
3. [../web/PERF_REPORT.md](../web/PERF_REPORT.md) - frontend performance notes.

## Quick links

- Production API docs (Swagger): `/docs` on the deployed API URL
- Backend local Swagger: `http://localhost:3000/docs`
- Frontend local app: `http://localhost:3001/dashboard`

## Documentation policy

- Keep this file as an index only.
- Do not duplicate setup steps or API contracts here.
- Any executable command must live in the canonical root README.
- Frontend-only instructions stay in `web/README.md`.

## When to update this file

Update `docs/README.md` only when:

- a new documentation file is created, removed, or renamed;
- canonical links change;
- navigation structure changes.
