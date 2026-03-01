import {
  BadRequestException,
  BadGatewayException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Invoice, ProcessingStatus } from '@prisma/client';
import { createHash } from 'crypto';
import { env } from '../../common/config/env';
import { log } from '../../common/logging/logger';
import { RequestWithId } from '../../common/logging/request-id.middleware';
import {
  type InvoiceProcessingStage,
  recordInvoiceStageError,
  recordInvoiceStageSuccess,
} from '../../common/metrics/metrics.registry';
import { assertPdfFileSignature } from '../../common/security/file-signature';
import { isPdfMimeType } from '../../common/security/upload.validation';
import {
  normalizeMesReferencia,
  parsePeriodoFim,
  parsePeriodoInicio,
} from '../../common/utils/dates';
import { roundToTwo } from '../../common/utils/numbers';
import { LLM_CLIENT, LlmClient } from '../../integrations/llm/llm.client';
import { AlertsService } from '../alerts/alerts.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { KpiQueryDto } from './dto/kpi-query.dto';
import { ListInvoicesQueryDto } from './dto/list-invoices-query.dto';
import { InvoiceFilters } from './invoice.types';
import { InvoiceProcessingService } from './invoice-processing.service';
import { calculateDerivedValues } from './mappers/invoice-calculator';
import { mapExtractedInvoiceToDomain } from './mappers/llm-to-domain.mapper';
import { InvoicesRepository } from './invoices.repository';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly invoicesRepository: InvoicesRepository,
    @Inject(LLM_CLIENT) private readonly llmClient: LlmClient,
    private readonly invoiceProcessingService: InvoiceProcessingService,
    private readonly alertsService: AlertsService,
  ) {}

  async processUpload(file: Express.Multer.File, request?: RequestWithId): Promise<Invoice> {
    const requestId = request?.requestId;
    const startedAt = Date.now();
    const uploadStageStartedAt = startedAt;
    let currentStage: InvoiceProcessingStage = 'upload';
    let currentStageStartedAt = uploadStageStartedAt;

    if (!file) {
      recordInvoiceStageError('upload', Date.now() - uploadStageStartedAt, 'file_missing');
      throw new BadRequestException('File is required');
    }

    log({
      level: 'info',
      type: 'invoice_processing_started',
      requestId,
      filename: file.originalname,
      mimetype: file.mimetype,
      sizeBytes: file.size ?? file.buffer.length,
    });

    if (!isPdfMimeType(file.mimetype)) {
      recordInvoiceStageError('upload', Date.now() - uploadStageStartedAt, 'invalid_mime_type');
      throw new BadRequestException('Invalid file: only PDF is allowed');
    }

    try {
      assertPdfFileSignature(file.buffer);
    } catch {
      recordInvoiceStageError('upload', Date.now() - uploadStageStartedAt, 'invalid_pdf_signature');
      throw new BadRequestException('Invalid file: PDF signature not recognized');
    }

    const hashSha256 = createHash('sha256').update(file.buffer).digest('hex');
    const processing = await this.invoiceProcessingService.start(hashSha256, file.originalname);

    if (processing && processing.status === ProcessingStatus.STORED && processing.invoiceId) {
      const storedInvoice = await this.invoicesRepository.findById(processing.invoiceId);
      if (storedInvoice) {
        return storedInvoice;
      }
    }

    const existingByHash = await this.invoicesRepository.findByHash(hashSha256);
    if (existingByHash) {
      if (processing) {
        await this.invoiceProcessingService.markStored(processing.id, existingByHash.id);
      }
      recordInvoiceStageSuccess('upload', Date.now() - uploadStageStartedAt);
      log({
        level: 'info',
        type: 'invoice_processing_dedup_hit',
        requestId,
        dedupType: 'hash',
        invoiceId: existingByHash.id,
        durationMs: Date.now() - startedAt,
      });
      return existingByHash;
    }

    try {
      recordInvoiceStageSuccess('upload', Date.now() - uploadStageStartedAt);
      currentStage = 'llm_extract';
      const llmStartedAt = Date.now();
      currentStageStartedAt = llmStartedAt;
      const extracted = await this.llmClient.extractInvoiceData(file.buffer, file.originalname);
      recordInvoiceStageSuccess('llm_extract', Date.now() - llmStartedAt);
      log({
        level: 'info',
        type: 'invoice_processing_llm_extracted',
        requestId,
        filename: file.originalname,
        durationMs: Date.now() - llmStartedAt,
      });
      if (processing) {
        await this.invoiceProcessingService.markExtracted(processing.id, extracted);
      }

      const mapped = mapExtractedInvoiceToDomain(extracted);
      const derived = calculateDerivedValues(mapped);
      const dedupCompositeKey = this.invoiceProcessingService.buildDedupCompositeKey(
        hashSha256,
        mapped.numeroCliente,
        mapped.mesReferencia,
      );

      if (processing) {
        await this.invoiceProcessingService.markValidated(
          processing.id,
          mapped.numeroCliente,
          mapped.mesReferencia,
          dedupCompositeKey,
        );
      }

      const existingByComposite =
        await this.invoicesRepository.findByDedupCompositeKey(dedupCompositeKey);
      if (existingByComposite) {
        if (processing) {
          await this.invoiceProcessingService.markStored(processing.id, existingByComposite.id);
        }
        log({
          level: 'info',
          type: 'invoice_processing_dedup_hit',
          requestId,
          dedupType: 'composite',
          invoiceId: existingByComposite.id,
          durationMs: Date.now() - startedAt,
        });
        return existingByComposite;
      }

      currentStage = 'db_persist';
      const persistenceStartedAt = Date.now();
      currentStageStartedAt = persistenceStartedAt;
      const invoiceData = {
        ...mapped,
        ...derived,
        sourceFilename: file.originalname,
        hashSha256,
        dedupCompositeKey,
      };
      const invoice = processing
        ? await this.invoicesRepository.createWithProcessing(invoiceData, processing.id)
        : await this.invoicesRepository.create(invoiceData);
      recordInvoiceStageSuccess('db_persist', Date.now() - persistenceStartedAt);
      log({
        level: 'info',
        type: 'invoice_processing_persisted',
        requestId,
        invoiceId: invoice.id,
        durationMs: Date.now() - persistenceStartedAt,
      });

      await this.evaluateAlertsSafely(invoice);
      log({
        level: 'info',
        type: 'invoice_processing_succeeded',
        requestId,
        invoiceId: invoice.id,
        durationMs: Date.now() - startedAt,
      });
      return invoice;
    } catch (error) {
      if (processing) {
        const reason = error instanceof Error ? error.message : 'Unknown processing failure';
        await this.invoiceProcessingService.markFailed(processing.id, reason);
      }

      recordInvoiceStageError(
        currentStage,
        Date.now() - currentStageStartedAt,
        this.resolveErrorType(error),
      );

      const statusCode =
        error instanceof UnprocessableEntityException
          ? 422
          : error instanceof BadGatewayException
            ? 502
            : 502;
      log({
        level: statusCode >= 500 ? 'error' : 'warn',
        type: 'invoice_processing_failed',
        requestId,
        filename: file.originalname,
        statusCode,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : 'Unknown processing failure',
      });

      if (error instanceof UnprocessableEntityException || error instanceof BadGatewayException) {
        throw error;
      }

      throw new BadGatewayException('Failed to process document in LLM provider');
    }
  }

  async listInvoices(query: ListInvoicesQueryDto): Promise<{
    data: Invoice[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  }> {
    if (query.pageSize > env.MAX_PAGE_SIZE) {
      throw new BadRequestException(`pageSize must be <= ${env.MAX_PAGE_SIZE}`);
    }

    const filters = this.mapFilters(query);
    const { data, total } = await this.invoicesRepository.list(filters, {
      page: query.page,
      pageSize: query.pageSize,
    });

    return {
      data,
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize) || 1,
    };
  }

  async getEnergyDashboard(query: DashboardQueryDto): Promise<{
    consumo_kwh_total: number;
    energia_compensada_kwh_total: number;
    series: Array<{ mes_referencia: string; consumo_kwh: number; energia_compensada_kwh: number }>;
  }> {
    const filters = this.mapFilters(query);
    const response = await this.invoicesRepository.aggregateEnergy(filters);

    return {
      consumo_kwh_total: response.consumoKwhTotal,
      energia_compensada_kwh_total: response.energiaCompensadaKwhTotal,
      series: response.series.map((item) => ({
        mes_referencia: item.mesReferencia,
        consumo_kwh: item.consumoKwh,
        energia_compensada_kwh: item.energiaCompensadaKwh,
      })),
    };
  }

  async getFinancialDashboard(query: DashboardQueryDto): Promise<{
    valor_total_sem_gd_total: number;
    economia_gd_total: number;
    series: Array<{ mes_referencia: string; valor_total_sem_gd: number; economia_gd: number }>;
  }> {
    const filters = this.mapFilters(query);
    const response = await this.invoicesRepository.aggregateFinancial(filters);

    return {
      valor_total_sem_gd_total: response.valorTotalSemGdTotal,
      economia_gd_total: response.economiaGdTotal,
      series: response.series.map((item) => ({
        mes_referencia: item.mesReferencia,
        valor_total_sem_gd: item.valorTotalSemGd,
        economia_gd: item.economiaGd,
      })),
    };
  }

  async getKpisDashboard(query: KpiQueryDto): Promise<{
    kwh_por_real: number;
    economia_percentual: number;
    tendencia_6_meses_percent: number;
    ranking_top_n: Array<{
      numero_cliente: string;
      consumo_kwh: number;
      valor_total_sem_gd: number;
      economia_gd: number;
    }>;
    series: Array<{
      mes_referencia: string;
      consumo_kwh: number;
      valor_total_sem_gd: number;
      economia_gd: number;
    }>;
  }> {
    if (!env.FEATURE_BENCHMARK_ENABLED) {
      throw new NotFoundException('Feature benchmark is disabled');
    }

    const filters = this.mapFilters(query);
    const topN = query.top_n ?? env.KPI_TOP_N_DEFAULT;

    const benchmark = await this.invoicesRepository.aggregateBenchmark(filters);
    const ranking = await this.invoicesRepository.getClientRanking(filters, topN);

    const kwhPorReal =
      benchmark.valorTotalSemGdTotal > 0
        ? roundToTwo(benchmark.consumoKwhTotal / benchmark.valorTotalSemGdTotal)
        : 0;

    const economiaPercentual =
      benchmark.valorTotalSemGdTotal + benchmark.economiaGdTotal > 0
        ? roundToTwo(
            (benchmark.economiaGdTotal /
              (benchmark.valorTotalSemGdTotal + benchmark.economiaGdTotal)) *
              100,
          )
        : 0;

    const trendSeries = benchmark.monthlySeries.slice(-6);
    const tendencia6MesesPercent = this.calculateTrendPercent(
      trendSeries.map((item) => item.consumoKwh),
    );

    return {
      kwh_por_real: kwhPorReal,
      economia_percentual: economiaPercentual,
      tendencia_6_meses_percent: tendencia6MesesPercent,
      ranking_top_n: ranking.map((item) => ({
        numero_cliente: item.numeroCliente,
        consumo_kwh: item.consumoKwh,
        valor_total_sem_gd: item.valorTotalSemGd,
        economia_gd: item.economiaGd,
      })),
      series: benchmark.monthlySeries.map((item) => ({
        mes_referencia: item.mesReferencia,
        consumo_kwh: item.consumoKwh,
        valor_total_sem_gd: item.valorTotalSemGd,
        economia_gd: item.economiaGd,
      })),
    };
  }

  private calculateTrendPercent(series: number[]): number {
    if (series.length < 2) {
      return 0;
    }

    const first = series[0];
    const last = series[series.length - 1];
    if (first === undefined || last === undefined || first <= 0) {
      return 0;
    }

    return roundToTwo(((last - first) / first) * 100);
  }

  private async evaluateAlertsSafely(invoice: Invoice): Promise<void> {
    if (!env.FEATURE_ALERTS_ENABLED) {
      return;
    }

    try {
      await this.alertsService.evaluateAndPersist(invoice);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown alerts error';
      log({
        level: 'warn',
        type: 'invoice_alerts_evaluation_failed',
        invoiceId: invoice.id,
        error: message,
      });
    }
  }

  private mapFilters(query: {
    numero_cliente?: string;
    mes_referencia?: string;
    periodo_inicio?: string;
    periodo_fim?: string;
  }): InvoiceFilters {
    try {
      return {
        numeroCliente: query.numero_cliente?.trim(),
        mesReferencia: query.mes_referencia
          ? normalizeMesReferencia(query.mes_referencia)
          : undefined,
        periodoInicio: parsePeriodoInicio(query.periodo_inicio),
        periodoFim: parsePeriodoFim(query.periodo_fim),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid filters';
      throw new BadRequestException(message);
    }
  }

  private resolveErrorType(error: unknown): string {
    if (error instanceof UnprocessableEntityException) {
      return 'unprocessable_entity';
    }

    if (error instanceof BadGatewayException) {
      return 'bad_gateway';
    }

    if (error instanceof BadRequestException) {
      return 'bad_request';
    }

    return 'internal_error';
  }
}
