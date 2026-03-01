import { BadGatewayException } from '@nestjs/common';
import { InvoiceProcessing, ProcessingStatus } from '@prisma/client';
import { AlertsService } from '../../../src/modules/alerts/alerts.service';
import { LlmClient } from '../../../src/integrations/llm/llm.client';
import {
  CLIENT_NUMBER_FIELD,
  ELECTRIC_ENERGY_FIELD,
  GD_COMPENSATED_ENERGY_FIELD,
  PUBLIC_LIGHTING_FIELD,
  REFERENCE_MONTH_FIELD,
  SCEEE_ENERGY_FIELD,
} from '../../../src/integrations/llm/prompt';
import { InvoiceProcessingService } from '../../../src/modules/invoices/invoice-processing.service';
import { InvoicesRepository } from '../../../src/modules/invoices/invoices.repository';
import { InvoicesService } from '../../../src/modules/invoices/invoices.service';

describe('InvoicesService', () => {
  let service: InvoicesService;
  let repository: jest.Mocked<InvoicesRepository>;
  let llm: jest.Mocked<LlmClient>;
  let processing: jest.Mocked<InvoiceProcessingService>;
  let alerts: jest.Mocked<AlertsService>;

  beforeEach(() => {
    repository = {
      findByHash: jest.fn(),
      findByDedupCompositeKey: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      createWithProcessing: jest.fn(),
      list: jest.fn(),
      findRecentByClientBeforeDate: jest.fn(),
      aggregateEnergy: jest.fn(),
      aggregateFinancial: jest.fn(),
      aggregateBenchmark: jest.fn(),
      getClientRanking: jest.fn(),
    } as unknown as jest.Mocked<InvoicesRepository>;

    llm = {
      extractInvoiceData: jest.fn(),
    };

    processing = {
      isEnabled: jest.fn(() => true),
      buildDedupCompositeKey: jest.fn((hash, client, mes) => `${hash}::${client}::${mes}`),
      start: jest.fn(async () => null),
      markExtracted: jest.fn(async () => undefined),
      markValidated: jest.fn(async () => undefined),
      markStored: jest.fn(async () => undefined),
      markFailed: jest.fn(async () => undefined),
    } as unknown as jest.Mocked<InvoiceProcessingService>;

    alerts = {
      ensureEnabled: jest.fn(),
      evaluateAndPersist: jest.fn(async () => []),
      listAlerts: jest.fn(),
    } as unknown as jest.Mocked<AlertsService>;

    service = new InvoicesService(repository, llm, processing, alerts);
  });

  it('processes a valid PDF and persists derived values', async () => {
    const file = {
      mimetype: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\ncontent', 'utf8'),
      originalname: 'fatura.pdf',
    } as Express.Multer.File;

    llm.extractInvoiceData.mockResolvedValue({
      [CLIENT_NUMBER_FIELD]: '3001116735',
      [REFERENCE_MONTH_FIELD]: 'SET/2024',
      [ELECTRIC_ENERGY_FIELD]: { quantidade_kwh: '100', valor_rs: '50,20' },
      [SCEEE_ENERGY_FIELD]: { quantidade_kwh: '20', valor_rs: '10,30' },
      [GD_COMPENSATED_ENERGY_FIELD]: { quantidade_kwh: '30', valor_rs: '12,10' },
      [PUBLIC_LIGHTING_FIELD]: { valor_rs: '5,40' },
    });

    repository.findByHash.mockResolvedValue(null);
    repository.findByDedupCompositeKey.mockResolvedValue(null);
    repository.create.mockImplementation(
      async (data) =>
        ({
          id: 'inv-1',
          createdAt: new Date('2024-09-10T00:00:00.000Z'),
          ...data,
        }) as never,
    );

    const result = await service.processUpload(file);

    expect(result.consumoKwh).toBe(120);
    expect(result.energiaCompensadaKwh).toBe(30);
    expect(result.valorTotalSemGd).toBe(65.9);
    expect(result.economiaGdRs).toBe(12.1);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.createWithProcessing).not.toHaveBeenCalled();
    expect(alerts.evaluateAndPersist).toHaveBeenCalledTimes(1);
  });

  it('marks processing as failed when provider errors', async () => {
    const file = {
      mimetype: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\ncontent', 'utf8'),
      originalname: 'fatura.pdf',
    } as Express.Multer.File;

    const processingState = {
      id: 'proc-1',
      hashSha256: 'hash',
      sourceFilename: 'fatura.pdf',
      status: ProcessingStatus.RECEIVED,
      createdAt: new Date(),
      updatedAt: new Date(),
      dedupCompositeKey: null,
      numeroCliente: null,
      mesReferencia: null,
      rawLlmJson: null,
      redactedLlmJson: null,
      errorReason: null,
      invoiceId: null,
    } satisfies InvoiceProcessing;

    processing.start.mockResolvedValue(processingState);
    repository.findByHash.mockResolvedValue(null);
    llm.extractInvoiceData.mockRejectedValue(new Error('network error'));

    await expect(service.processUpload(file)).rejects.toBeInstanceOf(BadGatewayException);
    expect(processing.markFailed).toHaveBeenCalledTimes(1);
  });

  it('persists invoice atomically with processing status when data quality is enabled', async () => {
    const file = {
      mimetype: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\ncontent', 'utf8'),
      originalname: 'fatura.pdf',
    } as Express.Multer.File;

    const processingState = {
      id: 'proc-atomic',
      hashSha256: 'hash',
      sourceFilename: 'fatura.pdf',
      status: ProcessingStatus.RECEIVED,
      createdAt: new Date(),
      updatedAt: new Date(),
      dedupCompositeKey: null,
      numeroCliente: null,
      mesReferencia: null,
      rawLlmJson: null,
      redactedLlmJson: null,
      errorReason: null,
      invoiceId: null,
    } satisfies InvoiceProcessing;

    processing.start.mockResolvedValue(processingState);
    repository.findByHash.mockResolvedValue(null);
    repository.findByDedupCompositeKey.mockResolvedValue(null);
    llm.extractInvoiceData.mockResolvedValue({
      [CLIENT_NUMBER_FIELD]: '3001116735',
      [REFERENCE_MONTH_FIELD]: 'SET/2024',
      [ELECTRIC_ENERGY_FIELD]: { quantidade_kwh: '100', valor_rs: '50,20' },
      [SCEEE_ENERGY_FIELD]: { quantidade_kwh: '20', valor_rs: '10,30' },
      [GD_COMPENSATED_ENERGY_FIELD]: { quantidade_kwh: '30', valor_rs: '12,10' },
      [PUBLIC_LIGHTING_FIELD]: { valor_rs: '5,40' },
    });
    repository.createWithProcessing.mockImplementation(
      async (data) =>
        ({
          id: 'inv-atomic',
          createdAt: new Date('2024-09-10T00:00:00.000Z'),
          ...data,
        }) as never,
    );

    const result = await service.processUpload(file);

    expect(result.id).toBe('inv-atomic');
    expect(repository.createWithProcessing).toHaveBeenCalledTimes(1);
    expect(repository.create).not.toHaveBeenCalled();
    expect(processing.markStored).not.toHaveBeenCalled();
  });
});
