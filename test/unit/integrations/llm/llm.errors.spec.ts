import {
  LlmProviderException,
  LlmSchemaValidationException,
} from '../../../../src/integrations/llm/llm.errors';

describe('llm.errors', () => {
  it('builds provider exception with default message and status', () => {
    const error = new LlmProviderException();
    expect(error.getStatus()).toBe(502);
    expect(error.message).toBe('Failed to process document in LLM provider');
  });

  it('builds provider exception with custom message', () => {
    const error = new LlmProviderException('provider down');
    expect(error.getStatus()).toBe(502);
    expect(error.message).toBe('provider down');
  });

  it('builds schema validation exception with default message and status', () => {
    const error = new LlmSchemaValidationException();
    expect(error.getStatus()).toBe(422);
    expect(error.message).toBe('LLM returned invalid JSON');
  });

  it('builds schema validation exception with custom message', () => {
    const error = new LlmSchemaValidationException('invalid payload');
    expect(error.getStatus()).toBe(422);
    expect(error.message).toBe('invalid payload');
  });
});
