import { LLM_CLIENT } from '../../../../src/integrations/llm/llm.client';

describe('llm.client token', () => {
  it('exports a stable DI symbol token', () => {
    expect(typeof LLM_CLIENT).toBe('symbol');
    expect(String(LLM_CLIENT)).toContain('LLM_CLIENT');
  });
});
