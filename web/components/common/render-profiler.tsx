'use client';

import { Profiler, type ReactNode } from 'react';
import { webEnv } from '@/lib/env';

interface RenderProfilerProps {
  id: string;
  children: ReactNode;
}

interface ProfilerMetrics {
  commits: number;
  totalActualDurationMs: number;
  maxActualDurationMs: number;
  averageActualDurationMs: number;
  lastCommitAt: string;
}

declare global {
  interface Window {
    __LUMI_PROFILER__?: Record<string, ProfilerMetrics>;
  }
}

function updateMetrics(id: string, actualDuration: number) {
  if (typeof window === 'undefined') {
    return;
  }

  const store = window.__LUMI_PROFILER__ ?? {};
  const current = store[id] ?? {
    commits: 0,
    totalActualDurationMs: 0,
    maxActualDurationMs: 0,
    averageActualDurationMs: 0,
    lastCommitAt: new Date().toISOString(),
  };

  const commits = current.commits + 1;
  const total = current.totalActualDurationMs + actualDuration;

  store[id] = {
    commits,
    totalActualDurationMs: Number(total.toFixed(2)),
    maxActualDurationMs: Number(Math.max(current.maxActualDurationMs, actualDuration).toFixed(2)),
    averageActualDurationMs: Number((total / commits).toFixed(2)),
    lastCommitAt: new Date().toISOString(),
  };

  window.__LUMI_PROFILER__ = store;
}

export function RenderProfiler({ id, children }: RenderProfilerProps) {
  const enabled =
    process.env.NODE_ENV === 'development' && webEnv.NEXT_PUBLIC_ENABLE_RENDER_PROFILING;

  if (!enabled) {
    return children;
  }

  return (
    <Profiler id={id} onRender={(_, __, actualDuration) => updateMetrics(id, actualDuration)}>
      {children}
    </Profiler>
  );
}
