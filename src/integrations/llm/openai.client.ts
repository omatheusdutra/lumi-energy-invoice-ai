import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { env } from '../../common/config/env';
import { INVOICE_JSON_SCHEMA, EXTRACTION_PROMPT } from './prompt';
import { ResilientLlmClient } from './resilient-llm.client';

@Injectable()
export class OpenAiResponsesClient extends ResilientLlmClient {
  private readonly client = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    baseURL: env.OPENAI_BASE_URL || undefined,
    timeout: env.OPENAI_TIMEOUT_MS,
  });

  protected providerName(): string {
    return 'openai_responses';
  }

  protected async extractProviderOutput(
    pdfBuffer: Buffer,
    filename: string,
  ): Promise<string | undefined> {
    const response = (await this.client.responses.create({
      model: env.OPENAI_MODEL,
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: EXTRACTION_PROMPT }],
        },
        {
          role: 'user',
          content: [
            { type: 'input_text', text: `Arquivo: ${filename}` },
            {
              type: 'input_file',
              filename,
              file_data: `data:application/pdf;base64,${pdfBuffer.toString('base64')}`,
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'invoice_extraction',
          schema: INVOICE_JSON_SCHEMA,
          strict: true,
        },
      },
    } as unknown as Parameters<OpenAI['responses']['create']>[0])) as unknown as {
      output_text?: string;
    };

    return response.output_text;
  }
}
