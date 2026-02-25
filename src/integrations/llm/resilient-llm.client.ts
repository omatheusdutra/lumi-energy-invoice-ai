import {
  BadGatewayException,
  RequestTimeoutException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ZodError } from 'zod';
import { env } from '../../common/config/env';
import { log } from '../../common/logging/logger';
import { LlmClient } from './llm.client';
import { extractedInvoiceSchema, type ExtractedInvoiceJson } from './prompt';

export abstract class ResilientLlmClient implements LlmClient {
  private consecutiveFailures = 0;
  private circuitOpenedAt?: number;

  async extractInvoiceData(pdfBuffer: Buffer, filename: string): Promise<ExtractedInvoiceJson> {
    this.ensureCircuitAvailability();

    const maxRetries = env.OPENAI_MAX_RETRIES;
    const extractionStartedAt = Date.now();
    const provider = this.providerName();
    log({
      level: 'info',
      type: 'llm_extract_started',
      filename,
      model: env.OPENAI_MODEL,
      provider,
      maxRetries,
    });

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const attemptStartedAt = Date.now();
      try {
        const outputText = await this.extractProviderOutput(pdfBuffer, filename);
        if (!outputText) {
          throw new UnprocessableEntityException('LLM did not return any content');
        }

        const parsedJson = JSON.parse(outputText) as unknown;
        const validated = extractedInvoiceSchema.parse(parsedJson);

        this.resetCircuit();
        log({
          level: 'info',
          type: 'llm_extract_succeeded',
          filename,
          provider,
          attempt: attempt + 1,
          attemptDurationMs: Date.now() - attemptStartedAt,
          totalDurationMs: Date.now() - extractionStartedAt,
        });
        return validated;
      } catch (error) {
        if (error instanceof ZodError || error instanceof SyntaxError) {
          log({
            level: 'warn',
            type: 'llm_extract_schema_failed',
            filename,
            provider,
            attempt: attempt + 1,
            attemptDurationMs: Date.now() - attemptStartedAt,
            error: error.message,
          });
          throw new UnprocessableEntityException('LLM returned invalid JSON');
        }

        if (error instanceof UnprocessableEntityException) {
          log({
            level: 'warn',
            type: 'llm_extract_unprocessable',
            filename,
            provider,
            attempt: attempt + 1,
            attemptDurationMs: Date.now() - attemptStartedAt,
            error: error.message,
          });
          throw error;
        }

        const isLastAttempt = attempt === maxRetries;
        if (isLastAttempt) {
          this.markFailure();
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown LLM provider failure';
          log({
            level: 'error',
            type: 'llm_extract_failed',
            filename,
            provider,
            attempts: attempt + 1,
            totalDurationMs: Date.now() - extractionStartedAt,
            error: errorMessage,
          });
          throw new BadGatewayException('Failed to process document in LLM provider');
        }

        const backoffMs = this.backoffMs(attempt);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown LLM provider failure';
        log({
          level: 'warn',
          type: 'llm_extract_retrying',
          filename,
          provider,
          attempt: attempt + 1,
          attemptDurationMs: Date.now() - attemptStartedAt,
          backoffMs,
          error: errorMessage,
        });
        await this.sleep(backoffMs);
      }
    }

    log({
      level: 'error',
      type: 'llm_extract_timeout',
      filename,
      provider,
      totalDurationMs: Date.now() - extractionStartedAt,
    });
    throw new RequestTimeoutException('Timeout while processing in LLM provider');
  }

  protected abstract providerName(): string;

  protected abstract extractProviderOutput(
    pdfBuffer: Buffer,
    filename: string,
  ): Promise<string | undefined>;

  private backoffMs(attempt: number): number {
    return Math.min(2000 * (attempt + 1), 8000);
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private ensureCircuitAvailability(): void {
    if (!env.LLM_CIRCUIT_BREAKER_ENABLED) {
      return;
    }

    if (!this.circuitOpenedAt) {
      return;
    }

    const elapsed = Date.now() - this.circuitOpenedAt;
    if (elapsed >= env.LLM_CIRCUIT_BREAKER_COOLDOWN_MS) {
      this.resetCircuit();
      return;
    }

    log({
      level: 'warn',
      type: 'llm_circuit_breaker_open',
      cooldownRemainingMs: env.LLM_CIRCUIT_BREAKER_COOLDOWN_MS - elapsed,
    });
    throw new BadGatewayException('LLM provider temporarily unavailable (circuit breaker open)');
  }

  private markFailure(): void {
    if (!env.LLM_CIRCUIT_BREAKER_ENABLED) {
      return;
    }

    this.consecutiveFailures += 1;
    if (this.consecutiveFailures >= env.LLM_CIRCUIT_BREAKER_FAILURE_THRESHOLD) {
      this.circuitOpenedAt = Date.now();
      log({
        level: 'warn',
        type: 'llm_circuit_breaker_triggered',
        consecutiveFailures: this.consecutiveFailures,
      });
    }
  }

  private resetCircuit(): void {
    this.consecutiveFailures = 0;
    this.circuitOpenedAt = undefined;
  }
}
