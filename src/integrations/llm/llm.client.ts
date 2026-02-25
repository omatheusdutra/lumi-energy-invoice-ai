import { ExtractedInvoiceJson } from './llm.types';

export interface LlmClient {
  extractInvoiceData(pdfBuffer: Buffer, filename: string): Promise<ExtractedInvoiceJson>;
}

export const LLM_CLIENT = Symbol('LLM_CLIENT');
