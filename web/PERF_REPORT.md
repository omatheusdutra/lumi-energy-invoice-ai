# Frontend Render Profiling Report

## Scope

- Route: `/invoices`
- Route: `/dashboard`
- Instrumentation: `React.Profiler` via `RenderProfiler`

## How to Capture

1. Enable profiling in `web/.env.local`:

```env
NEXT_PUBLIC_ENABLE_RENDER_PROFILING=true
```

2. Start frontend:

```bash
npm --prefix web run dev
```

3. Use the app normally (switch filters, paginate, open dashboard).
4. Open browser console and inspect:

```js
window.__LUMI_PROFILER__;
```

## Metrics Stored

- `commits`
- `totalActualDurationMs`
- `maxActualDurationMs`
- `averageActualDurationMs`
- `lastCommitAt`

## Expected Outcome After Optimizations

- Lower commit count during invoice switching.
- Lower average render duration on `/invoices`.
- No blocking UI while data refetches (`keepPreviousData`).
- Faster next-page pagination due to prefetch.

## Notes

- Profiling is **dev-only** and gated by env flag.
- No profiler overhead in production.
- Use Chrome React DevTools Profiler for flamegraph-level deep dive.
