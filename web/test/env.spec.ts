import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

async function importEnvModule() {
  vi.resetModules();
  return import('@/lib/env');
}

describe('web env', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('parses valid env and applies defaults', async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:3000';
    delete process.env.NEXT_PUBLIC_APP_NAME;
    delete process.env.NEXT_PUBLIC_ENABLE_EXPERIMENTAL_DASHBOARD;
    delete process.env.NEXT_PUBLIC_ENABLE_RENDER_PROFILING;

    const { webEnv } = await importEnvModule();

    expect(webEnv.NEXT_PUBLIC_API_BASE_URL).toBe('http://localhost:3000');
    expect(webEnv.NEXT_PUBLIC_APP_NAME).toBe('Lumi Portal');
    expect(webEnv.NEXT_PUBLIC_ENABLE_EXPERIMENTAL_DASHBOARD).toBe(false);
    expect(webEnv.NEXT_PUBLIC_ENABLE_RENDER_PROFILING).toBe(false);
  });

  it('parses feature flags when explicitly enabled', async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:3000';
    process.env.NEXT_PUBLIC_ENABLE_EXPERIMENTAL_DASHBOARD = 'true';
    process.env.NEXT_PUBLIC_ENABLE_RENDER_PROFILING = 'true';

    const { webEnv } = await importEnvModule();

    expect(webEnv.NEXT_PUBLIC_ENABLE_EXPERIMENTAL_DASHBOARD).toBe(true);
    expect(webEnv.NEXT_PUBLIC_ENABLE_RENDER_PROFILING).toBe(true);
  });

  it('throws when required url is missing or invalid', async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'invalid-url';

    await expect(importEnvModule()).rejects.toThrow('Invalid web env configuration');
  });
});
