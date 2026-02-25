describe('GeminiClient', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  const setupTestEnv = () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      OPENAI_API_KEY: 'AIzaSyDummyKey12345678901234567890',
      OPENAI_BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      OPENAI_MODEL: 'gemini-2.5-flash',
      OPENAI_TIMEOUT_MS: '5000',
      OPENAI_MAX_RETRIES: '0',
      LLM_CIRCUIT_BREAKER_ENABLED: 'false',
    };
  };

  const buildValidOutputText = (fields: typeof import('../../../../src/integrations/llm/prompt')) =>
    JSON.stringify({
      [fields.CLIENT_NUMBER_FIELD]: '3001116735',
      [fields.REFERENCE_MONTH_FIELD]: 'JAN/2024',
      [fields.ELECTRIC_ENERGY_FIELD]: {
        quantidade_kwh: '100',
        valor_rs: '50,00',
      },
      [fields.SCEEE_ENERGY_FIELD]: {
        quantidade_kwh: '10',
        valor_rs: '8,00',
      },
      [fields.GD_COMPENSATED_ENERGY_FIELD]: {
        quantidade_kwh: '20',
        valor_rs: '7,00',
      },
      [fields.PUBLIC_LIGHTING_FIELD]: {
        valor_rs: '4,00',
      },
    });

  beforeEach(() => {
    jest.resetModules();
    setupTestEnv();
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('sends responseSchema in Gemini generationConfig and parses structured response', async () => {
    const fields = await import('../../../../src/integrations/llm/prompt');
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: buildValidOutputText(fields) }],
              },
            },
          ],
        }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { GeminiClient } = await import('../../../../src/integrations/llm/gemini.client');
    const client = new GeminiClient();

    const result = await client.extractInvoiceData(
      Buffer.from('%PDF-1.4\ntest-invoice', 'utf8'),
      'invoice.pdf',
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(requestInit.body));

    expect(body.generationConfig.responseMimeType).toBe('application/json');
    expect(body.generationConfig.responseSchema).toBeDefined();
    expect(body.generationConfig.responseSchema.additionalProperties).toBe(false);
    expect(body.generationConfig.responseSchema.required).toContain(fields.CLIENT_NUMBER_FIELD);
    expect(result[fields.CLIENT_NUMBER_FIELD]).toBe('3001116735');
  });

  it('returns 502 on provider 4xx (including schema-rejection 400) without retrying fallback payload', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => '{"error":"Invalid generationConfig.responseSchema"}',
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { GeminiClient } = await import('../../../../src/integrations/llm/gemini.client');
    const client = new GeminiClient();

    await expect(
      client.extractInvoiceData(Buffer.from('%PDF-1.4\ntest-invoice', 'utf8'), 'invoice.pdf'),
    ).rejects.toMatchObject({
      status: 502,
      message: 'Failed to process document in LLM provider',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(requestInit.body));
    expect(body.generationConfig.responseSchema).toBeDefined();
  });

  it('returns 422 when provider text is not valid JSON payload', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: '{"broken":' }],
              },
            },
          ],
        }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { GeminiClient } = await import('../../../../src/integrations/llm/gemini.client');
    const client = new GeminiClient();

    await expect(
      client.extractInvoiceData(Buffer.from('%PDF-1.4\ntest-invoice', 'utf8'), 'invoice.pdf'),
    ).rejects.toMatchObject({
      status: 422,
      message: 'LLM returned invalid JSON',
    });
  });
});
