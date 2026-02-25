type EnvOverrides = {
  OPENAI_MODEL?: string;
  OPENAI_BASE_URL?: string | undefined;
  OPENAI_API_KEY?: string;
};

async function evaluateWithEnv(overrides: EnvOverrides): Promise<boolean> {
  let result = false;

  jest.resetModules();
  jest.doMock('../../../../src/common/config/env', () => ({
    env: {
      OPENAI_MODEL: 'gpt-4.1-mini',
      OPENAI_BASE_URL: 'https://api.openai.com/v1',
      OPENAI_API_KEY: 'test-key',
      ...overrides,
    },
  }));

  await jest.isolateModulesAsync(async () => {
    const { shouldUseGeminiProvider } =
      await import('../../../../src/integrations/llm/llm.factory');
    result = shouldUseGeminiProvider();
  });

  jest.dontMock('../../../../src/common/config/env');
  return result;
}

describe('llm.factory', () => {
  it('returns true when model contains gemini', async () => {
    await expect(evaluateWithEnv({ OPENAI_MODEL: 'gemini-2.5-flash' })).resolves.toBe(true);
  });

  it('returns true when base url is generativelanguage', async () => {
    await expect(
      evaluateWithEnv({
        OPENAI_BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      }),
    ).resolves.toBe(true);
  });

  it('returns true when API key starts with AIza', async () => {
    await expect(
      evaluateWithEnv({
        OPENAI_API_KEY: 'AIzaSyDummyKey12345678901234567890',
      }),
    ).resolves.toBe(true);
  });

  it('returns false when no gemini signal is present', async () => {
    await expect(
      evaluateWithEnv({
        OPENAI_MODEL: 'gpt-4.1-mini',
        OPENAI_BASE_URL: 'https://api.openai.com/v1',
        OPENAI_API_KEY: 'test-key',
      }),
    ).resolves.toBe(false);
  });

  it('handles undefined OPENAI_BASE_URL path safely', async () => {
    await expect(
      evaluateWithEnv({
        OPENAI_BASE_URL: undefined,
      }),
    ).resolves.toBe(false);
  });
});
