import { Module } from '@nestjs/common';
import { AlertsModule } from '../alerts/alerts.module';
import { GeminiClient } from '../../integrations/llm/gemini.client';
import { PrismaModule } from '../../prisma/prisma.module';
import { LLM_CLIENT } from '../../integrations/llm/llm.client';
import { shouldUseGeminiProvider } from '../../integrations/llm/llm.factory';
import { OpenAiResponsesClient } from '../../integrations/llm/openai.client';
import { InvoiceProcessingRepository } from './invoice-processing.repository';
import { InvoiceProcessingService } from './invoice-processing.service';
import { InvoicesController } from './invoices.controller';
import { InvoicesRepository } from './invoices.repository';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [PrismaModule, AlertsModule],
  controllers: [InvoicesController],
  providers: [
    InvoicesService,
    InvoicesRepository,
    InvoiceProcessingRepository,
    InvoiceProcessingService,
    OpenAiResponsesClient,
    GeminiClient,
    {
      provide: LLM_CLIENT,
      useFactory: (openAiClient: OpenAiResponsesClient, geminiClient: GeminiClient) =>
        shouldUseGeminiProvider() ? geminiClient : openAiClient,
      inject: [OpenAiResponsesClient, GeminiClient],
    },
  ],
  exports: [InvoicesService],
})
export class InvoicesModule {}
