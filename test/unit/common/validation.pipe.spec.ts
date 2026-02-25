describe('AppValidationPipe', () => {
  async function loadPipe(nodeEnv: 'production' | 'test') {
    jest.resetModules();
    jest.doMock('../../../src/common/config/env', () => ({
      env: { NODE_ENV: nodeEnv },
    }));

    const mod = await import('../../../src/common/http/validation.pipe');
    jest.dontMock('../../../src/common/config/env');
    return mod.AppValidationPipe;
  }

  it('enables strict validation defaults in non-production', async () => {
    const pipe = await loadPipe('test');
    const internal = pipe as unknown as {
      validatorOptions: Record<string, unknown>;
      transformOptions: Record<string, unknown>;
      isDetailedOutputDisabled: boolean;
      isTransformEnabled: boolean;
    };

    expect(internal.validatorOptions.whitelist).toBe(true);
    expect(internal.validatorOptions.forbidNonWhitelisted).toBe(true);
    expect(internal.validatorOptions.forbidUnknownValues).toBe(true);
    expect(internal.transformOptions.enableImplicitConversion).toBe(true);
    expect(internal.isDetailedOutputDisabled).toBe(false);
    expect(internal.isTransformEnabled).toBe(true);
  });

  it('disables detailed validation output in production', async () => {
    const pipe = await loadPipe('production');
    const internal = pipe as unknown as { isDetailedOutputDisabled: boolean };
    expect(internal.isDetailedOutputDisabled).toBe(true);
  });
});
