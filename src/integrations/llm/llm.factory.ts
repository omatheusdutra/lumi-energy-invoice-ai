import { env } from '../../common/config/env';

export function shouldUseGeminiProvider(): boolean {
  const model = env.OPENAI_MODEL.toLowerCase();
  const baseUrl = env.OPENAI_BASE_URL?.toLowerCase() ?? '';
  const key = env.OPENAI_API_KEY;

  return (
    model.includes('gemini') ||
    baseUrl.includes('generativelanguage.googleapis.com') ||
    key.startsWith('AIza')
  );
}
