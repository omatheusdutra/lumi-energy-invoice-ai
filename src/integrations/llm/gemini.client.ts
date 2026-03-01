import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { env } from '../../common/config/env';
import { EXTRACTION_PROMPT, INVOICE_JSON_SCHEMA } from './prompt';
import { ResilientLlmClient } from './resilient-llm.client';

@Injectable()
export class GeminiClient extends ResilientLlmClient {
  protected providerName(): string {
    return 'gemini_native';
  }

  protected async extractProviderOutput(pdfBuffer: Buffer, filename: string): Promise<string> {
    const model = this.normalizeGeminiModel(env.OPENAI_MODEL);
    const endpoint = `${this.getGeminiApiBaseUrl()}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.OPENAI_API_KEY)}`;
    const request = this.buildGeminiRequestBody(pdfBuffer, filename);
    const response = await this.postGeminiGenerateContent(endpoint, request);

    if (!response.ok) {
      const providerMessage = (response.responseText ?? '').slice(0, 300);
      throw new Error(`Gemini API request failed (${response.status}): ${providerMessage}`);
    }

    const text = response.payload?.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text;
    if (!text) {
      throw new UnprocessableEntityException('LLM did not return any content');
    }

    return text;
  }

  private normalizeGeminiModel(model: string): string {
    return model.replace(/^models\//i, '');
  }

  private getGeminiApiBaseUrl(): string {
    const configured = env.OPENAI_BASE_URL?.trim();
    if (configured && configured.includes('generativelanguage.googleapis.com')) {
      return configured.replace(/\/openai\/?$/i, '');
    }

    return 'https://generativelanguage.googleapis.com/v1beta';
  }

  private buildGeminiRequestBody(pdfBuffer: Buffer, filename: string): Record<string, unknown> {
    const generationConfig: Record<string, unknown> = {
      temperature: 0,
      responseMimeType: 'application/json',
      responseSchema: this.toGeminiSchema(INVOICE_JSON_SCHEMA as unknown as GeminiJsonSchemaNode),
    };

    return {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${EXTRACTION_PROMPT}\n\nArquivo: ${filename}\nRetorne apenas o JSON solicitado.`,
            },
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: pdfBuffer.toString('base64'),
              },
            },
          ],
        },
      ],
      generationConfig,
    };
  }

  private async postGeminiGenerateContent(
    endpoint: string,
    body: Record<string, unknown>,
  ): Promise<GeminiResponseResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.OPENAI_TIMEOUT_MS);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const responseText = await response.text();
      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          responseText,
        };
      }

      let payload: GeminiGenerateContentPayload | undefined;
      try {
        payload = JSON.parse(responseText) as GeminiGenerateContentPayload;
      } catch {
        throw new UnprocessableEntityException('LLM returned invalid JSON');
      }

      return {
        ok: true,
        status: response.status,
        payload,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private toGeminiSchema(schema: GeminiJsonSchemaNode): GeminiSchemaNode {
    const rawType = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
    const nullable = rawType.includes('null');
    const nonNullTypes = rawType.filter((item): item is string => item !== 'null');
    const selectedType = nonNullTypes[0];
    const mappedType = this.mapGeminiType(selectedType);

    const result: GeminiSchemaNode = {
      type: mappedType,
      ...(nullable ? { nullable: true } : {}),
    };

    if (mappedType === 'OBJECT') {
      if (schema.properties) {
        result.properties = Object.fromEntries(
          Object.entries(schema.properties).map(([key, value]) => [
            key,
            this.toGeminiSchema(value as GeminiJsonSchemaNode),
          ]),
        );
      }

      if (schema.required) {
        result.required = schema.required;
      }
    }

    if (mappedType === 'ARRAY' && schema.items) {
      result.items = this.toGeminiSchema(schema.items);
    }

    return result;
  }

  private mapGeminiType(type: string | undefined): GeminiSchemaType {
    if (type === 'number') {
      return 'NUMBER';
    }
    if (type === 'integer') {
      return 'INTEGER';
    }
    if (type === 'boolean') {
      return 'BOOLEAN';
    }
    if (type === 'array') {
      return 'ARRAY';
    }
    if (type === 'object') {
      return 'OBJECT';
    }
    return 'STRING';
  }
}

type GeminiSchemaType = 'STRING' | 'NUMBER' | 'INTEGER' | 'BOOLEAN' | 'ARRAY' | 'OBJECT';

type GeminiJsonSchemaNode = {
  type?: string | string[];
  properties?: Record<string, GeminiJsonSchemaNode>;
  required?: string[];
  items?: GeminiJsonSchemaNode;
};

type GeminiSchemaNode = {
  type: GeminiSchemaType;
  nullable?: boolean;
  properties?: Record<string, GeminiSchemaNode>;
  required?: string[];
  items?: GeminiSchemaNode;
};

type GeminiGenerateContentPayload = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

type GeminiResponseResult =
  | {
      ok: true;
      status: number;
      payload: GeminiGenerateContentPayload;
    }
  | {
      ok: false;
      status: number;
      responseText: string;
    };
