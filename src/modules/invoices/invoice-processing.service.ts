import { Injectable } from '@nestjs/common';
import { InvoiceProcessing, ProcessingStatus } from '@prisma/client';
import { env } from '../../common/config/env';
import { InvoiceProcessingRepository } from './invoice-processing.repository';
import { buildInvoiceDedupCompositeKey } from './validators/invoice-dedup.validator';

@Injectable()
export class InvoiceProcessingService {
  constructor(private readonly repository: InvoiceProcessingRepository) {}

  isEnabled(): boolean {
    return env.FEATURE_DATA_QUALITY_ENABLED;
  }

  buildDedupCompositeKey(hashSha256: string, numeroCliente: string, mesReferencia: string): string {
    return buildInvoiceDedupCompositeKey(hashSha256, numeroCliente, mesReferencia);
  }

  async start(hashSha256: string, sourceFilename: string): Promise<InvoiceProcessing | null> {
    if (!this.isEnabled()) {
      return null;
    }

    const existing = await this.repository.findByHash(hashSha256);
    if (!existing) {
      return this.repository.createReceived(hashSha256, sourceFilename);
    }

    if (existing.status === ProcessingStatus.STORED) {
      return existing;
    }

    return this.repository.resetForReprocessing(existing.id, sourceFilename);
  }

  async markExtracted(id: string, rawLlmJson: unknown): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    await this.repository.updateStatus(id, ProcessingStatus.LLM_EXTRACTED, {
      rawLlmJson: rawLlmJson as object,
      redactedLlmJson: this.redactForAudit(rawLlmJson) as object,
    });
  }

  async markValidated(
    id: string,
    numeroCliente: string,
    mesReferencia: string,
    dedupCompositeKey: string,
  ): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    await this.repository.updateStatus(id, ProcessingStatus.VALIDATED, {
      numeroCliente,
      mesReferencia,
      dedupCompositeKey,
    });
  }

  async markStored(id: string, invoiceId: string): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    await this.repository.updateStatus(id, ProcessingStatus.STORED, {
      invoice: {
        connect: {
          id: invoiceId,
        },
      },
      errorReason: null,
    });
  }

  async markFailed(id: string, reason: string): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    await this.repository.updateStatus(id, ProcessingStatus.FAILED, {
      errorReason: reason.slice(0, 500),
    });
  }

  private redactForAudit(input: unknown): unknown {
    if (input === null || input === undefined) {
      return input;
    }

    if (Array.isArray(input)) {
      return input.map((item) => this.redactForAudit(item));
    }

    if (typeof input === 'object') {
      const output: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(input)) {
        if (/(token|secret|password|api[_-]?key)/i.test(key)) {
          output[key] = '[REDACTED]';
        } else {
          output[key] = this.redactForAudit(value);
        }
      }
      return output;
    }

    if (typeof input === 'string' && input.length > 256) {
      return `${input.slice(0, 256)}...[TRUNCATED]`;
    }

    return input;
  }
}
