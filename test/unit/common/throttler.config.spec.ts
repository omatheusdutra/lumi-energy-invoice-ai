describe('throttlerConfig', () => {
  it('maps ttl and limit from env', async () => {
    jest.resetModules();
    jest.doMock('../../../src/common/config/env', () => ({
      env: { RATE_LIMIT_TTL: 120, RATE_LIMIT_LIMIT: 42 },
    }));

    const { throttlerConfig } = await import('../../../src/common/security/throttler.config');
    jest.dontMock('../../../src/common/config/env');

    expect(throttlerConfig).toEqual([
      {
        ttl: 120,
        limit: 42,
      },
    ]);
  });
});
