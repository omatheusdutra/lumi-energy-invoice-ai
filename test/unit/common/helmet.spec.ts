describe('helmetConfig', () => {
  async function loadWithEnv(nodeEnv: 'production' | 'test') {
    jest.resetModules();

    const helmetMock = jest.fn((options: unknown) => options);
    jest.doMock('helmet', () => ({
      __esModule: true,
      default: helmetMock,
    }));
    jest.doMock('../../../src/common/config/env', () => ({
      env: { NODE_ENV: nodeEnv },
    }));

    const mod = await import('../../../src/common/security/helmet');

    jest.dontMock('helmet');
    jest.dontMock('../../../src/common/config/env');

    return { helmetConfig: mod.helmetConfig, helmetMock };
  }

  it('disables CSP/HSTS in non-production', async () => {
    const { helmetConfig, helmetMock } = await loadWithEnv('test');
    const callArg = helmetMock.mock.calls[0]?.[0] as Record<string, unknown>;

    expect(callArg.contentSecurityPolicy).toBe(false);
    expect(callArg.hsts).toBe(false);
    expect(callArg.crossOriginEmbedderPolicy).toBe(false);
    expect(helmetConfig).toEqual(callArg);
  });

  it('enables strict CSP/HSTS in production', async () => {
    const { helmetConfig, helmetMock } = await loadWithEnv('production');
    const callArg = helmetMock.mock.calls[0]?.[0] as Record<string, unknown>;
    const csp = callArg.contentSecurityPolicy as { useDefaults: boolean };
    const hsts = callArg.hsts as { maxAge: number; includeSubDomains: boolean; preload: boolean };

    expect(csp.useDefaults).toBe(false);
    expect(hsts.maxAge).toBe(31536000);
    expect(hsts.includeSubDomains).toBe(true);
    expect(hsts.preload).toBe(true);
    expect(helmetConfig).toEqual(callArg);
  });
});
