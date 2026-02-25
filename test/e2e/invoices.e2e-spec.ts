import { INestApplication, UnprocessableEntityException } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test, TestingModule } from '@nestjs/testing';
import { ProcessingStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import * as request from 'supertest';
import { HttpExceptionFilter } from '../../src/common/http/http-exception.filter';
import { AppValidationPipe } from '../../src/common/http/validation.pipe';
import { HttpLoggingInterceptor } from '../../src/common/logging/http-logging.interceptor';
import {
  CLIENT_NUMBER_FIELD,
  ELECTRIC_ENERGY_FIELD,
  GD_COMPENSATED_ENERGY_FIELD,
  PUBLIC_LIGHTING_FIELD,
  REFERENCE_MONTH_FIELD,
  SCEEE_ENERGY_FIELD,
} from '../../src/integrations/llm/prompt';
import { resetPrometheusMetricsForTests } from '../../src/common/metrics/metrics.registry';
import { LLM_CLIENT } from '../../src/integrations/llm/llm.client';
import { AlertsService } from '../../src/modules/alerts/alerts.service';
import { DashboardsModule } from '../../src/modules/dashboards/dashboards.module';
import { HealthModule } from '../../src/modules/health/health.module';
import { InvoiceProcessingService } from '../../src/modules/invoices/invoice-processing.service';
import { InvoicesModule } from '../../src/modules/invoices/invoices.module';
import { InvoicesRepository } from '../../src/modules/invoices/invoices.repository';
import { MetricsModule } from '../../src/modules/metrics/metrics.module';
import { TariffReadinessModule } from '../../src/modules/tariff-readiness/tariff-readiness.module';
import { TariffReadinessService } from '../../src/modules/tariff-readiness/tariff-readiness.service';
import { PrismaService } from '../../src/prisma/prisma.service';

interface StoredInvoice {
  id: string;
  createdAt: Date;
  hashSha256: string;
  dedupCompositeKey: string;
  numeroCliente: string;
  mesReferencia: string;
  mesReferenciaDate: Date;
  energiaEletricaKwh: number;
  energiaEletricaRs: number;
  energiaSceeeKwh: number;
  energiaSceeeRs: number;
  energiaCompensadaGdiKwh: number;
  energiaCompensadaGdiRs: number;
  contribIlumRs: number;
  consumoKwh: number;
  energiaCompensadaKwh: number;
  valorTotalSemGd: number;
  economiaGdRs: number;
  sourceFilename: string;
}

describe('Invoices + Optional Modules (e2e)', () => {
  let app: INestApplication;
  let llmMock: { extractInvoiceData: jest.Mock };
  let prismaMock: { $queryRaw: jest.Mock };
  let alertsMock: {
    evaluateAndPersist: jest.Mock;
    listAlerts: jest.Mock;
  };
  let processingMock: {
    start: jest.Mock;
    buildDedupCompositeKey: jest.Mock;
    markExtracted: jest.Mock;
    markValidated: jest.Mock;
    markStored: jest.Mock;
    markFailed: jest.Mock;
  };
  let tariffMock: {
    listPlans: jest.Mock;
    simulate: jest.Mock;
  };
  let repositoryMock: {
    findByHash: jest.Mock;
    findByDedupCompositeKey: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    list: jest.Mock;
    findRecentByClientBeforeDate: jest.Mock;
    aggregateEnergy: jest.Mock;
    aggregateFinancial: jest.Mock;
    aggregateBenchmark: jest.Mock;
    getClientRanking: jest.Mock;
    reset: () => void;
  };

  beforeAll(async () => {
    const storage: StoredInvoice[] = [];

    const applyFilter = (
      invoice: StoredInvoice,
      filters: {
        numeroCliente?: string;
        mesReferencia?: string;
        periodoInicio?: Date;
        periodoFim?: Date;
      },
    ) => {
      if (filters.numeroCliente && invoice.numeroCliente !== filters.numeroCliente) {
        return false;
      }
      if (filters.mesReferencia && invoice.mesReferencia !== filters.mesReferencia) {
        return false;
      }
      if (filters.periodoInicio && invoice.mesReferenciaDate < filters.periodoInicio) {
        return false;
      }
      if (filters.periodoFim && invoice.mesReferenciaDate > filters.periodoFim) {
        return false;
      }
      return true;
    };

    repositoryMock = {
      reset: () => {
        storage.splice(0, storage.length);
      },
      findByHash: jest.fn(
        async (hash: string) => storage.find((item) => item.hashSha256 === hash) ?? null,
      ),
      findByDedupCompositeKey: jest.fn(
        async (dedupKey: string) =>
          storage.find((item) => item.dedupCompositeKey === dedupKey) ?? null,
      ),
      findById: jest.fn(async (id: string) => storage.find((item) => item.id === id) ?? null),
      create: jest.fn(async (input: Omit<StoredInvoice, 'id' | 'createdAt'>) => {
        const created: StoredInvoice = {
          id: randomUUID(),
          createdAt: new Date(),
          ...input,
        };
        storage.push(created);
        return created;
      }),
      list: jest.fn(async (filters: any, pagination: { page: number; pageSize: number }) => {
        const filtered = storage.filter((item) => applyFilter(item, filters));
        const start = (pagination.page - 1) * pagination.pageSize;
        return {
          data: filtered.slice(start, start + pagination.pageSize),
          total: filtered.length,
        };
      }),
      findRecentByClientBeforeDate: jest.fn(),
      aggregateEnergy: jest.fn(async (filters: any) => {
        const filtered = storage.filter((item) => applyFilter(item, filters));
        const grouped = new Map<string, { consumoKwh: number; energiaCompensadaKwh: number }>();

        for (const item of filtered) {
          const previous = grouped.get(item.mesReferencia) ?? {
            consumoKwh: 0,
            energiaCompensadaKwh: 0,
          };
          grouped.set(item.mesReferencia, {
            consumoKwh: previous.consumoKwh + item.consumoKwh,
            energiaCompensadaKwh: previous.energiaCompensadaKwh + item.energiaCompensadaKwh,
          });
        }

        return {
          consumoKwhTotal: filtered.reduce((acc, item) => acc + item.consumoKwh, 0),
          energiaCompensadaKwhTotal: filtered.reduce(
            (acc, item) => acc + item.energiaCompensadaKwh,
            0,
          ),
          series: [...grouped.entries()].map(([mesReferencia, values]) => ({
            mesReferencia,
            consumoKwh: values.consumoKwh,
            energiaCompensadaKwh: values.energiaCompensadaKwh,
          })),
        };
      }),
      aggregateFinancial: jest.fn(async (filters: any) => {
        const filtered = storage.filter((item) => applyFilter(item, filters));
        const grouped = new Map<string, { valorTotalSemGd: number; economiaGd: number }>();

        for (const item of filtered) {
          const previous = grouped.get(item.mesReferencia) ?? { valorTotalSemGd: 0, economiaGd: 0 };
          grouped.set(item.mesReferencia, {
            valorTotalSemGd: previous.valorTotalSemGd + item.valorTotalSemGd,
            economiaGd: previous.economiaGd + item.economiaGdRs,
          });
        }

        return {
          valorTotalSemGdTotal: filtered.reduce((acc, item) => acc + item.valorTotalSemGd, 0),
          economiaGdTotal: filtered.reduce((acc, item) => acc + item.economiaGdRs, 0),
          series: [...grouped.entries()].map(([mesReferencia, values]) => ({
            mesReferencia,
            valorTotalSemGd: values.valorTotalSemGd,
            economiaGd: values.economiaGd,
          })),
        };
      }),
      aggregateBenchmark: jest.fn(async (filters: any) => {
        const filtered = storage.filter((item) => applyFilter(item, filters));
        const grouped = new Map<
          string,
          { date: Date; consumo: number; valor: number; economia: number }
        >();

        for (const item of filtered) {
          const previous = grouped.get(item.mesReferencia) ?? {
            date: item.mesReferenciaDate,
            consumo: 0,
            valor: 0,
            economia: 0,
          };
          grouped.set(item.mesReferencia, {
            date: item.mesReferenciaDate,
            consumo: previous.consumo + item.consumoKwh,
            valor: previous.valor + item.valorTotalSemGd,
            economia: previous.economia + item.economiaGdRs,
          });
        }

        return {
          consumoKwhTotal: filtered.reduce((acc, item) => acc + item.consumoKwh, 0),
          valorTotalSemGdTotal: filtered.reduce((acc, item) => acc + item.valorTotalSemGd, 0),
          economiaGdTotal: filtered.reduce((acc, item) => acc + item.economiaGdRs, 0),
          monthlySeries: [...grouped.entries()]
            .map(([mesReferencia, item]) => ({
              mesReferencia,
              mesReferenciaDate: item.date,
              consumoKwh: item.consumo,
              valorTotalSemGd: item.valor,
              economiaGd: item.economia,
            }))
            .sort((a, b) => a.mesReferenciaDate.getTime() - b.mesReferenciaDate.getTime()),
        };
      }),
      getClientRanking: jest.fn(async () => [
        {
          numeroCliente: '3001116735',
          consumoKwh: 120,
          valorTotalSemGd: 65,
          economiaGd: 15,
        },
      ]),
    };

    llmMock = {
      extractInvoiceData: jest.fn(),
    };

    prismaMock = {
      $queryRaw: jest.fn(async () => [{ ok: 1 }]),
    };

    alertsMock = {
      evaluateAndPersist: jest.fn(async () => []),
      listAlerts: jest.fn(async () => ({
        data: [
          {
            id: 'a1',
            numeroCliente: '3001116735',
            mesReferencia: 'SET/2024',
            alertType: 'CONSUMO_SPIKE',
            severity: 'WARNING',
            message: 'Consumo subiu 40%',
            metricValue: 140,
            baselineValue: 100,
            deltaPercent: 40,
            isResolved: false,
            metadata: {},
          },
        ],
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      })),
    };

    processingMock = {
      start: jest.fn(async () => null),
      buildDedupCompositeKey: jest.fn(
        (hash: string, client: string, mes: string) => `${hash}::${client}::${mes}`,
      ),
      markExtracted: jest.fn(async () => undefined),
      markValidated: jest.fn(async () => undefined),
      markStored: jest.fn(async () => undefined),
      markFailed: jest.fn(async () => undefined),
    };

    tariffMock = {
      listPlans: jest.fn(async () => [
        {
          id: 'plan-1',
          name: 'Convencional',
          provider: 'internal-stub',
          currency: 'BRL',
          isActive: true,
        },
      ]),
      simulate: jest.fn(async () => ({
        simulation_id: 'sim-1',
        invoice_id: 'inv-1',
        tariff_plan: {
          id: 'plan-1',
          name: 'Convencional',
        },
        baseline_cost_rs: 100,
        estimated_cost_rs: 92,
        savings_rs: 8,
        savings_percent: 8,
        details: { strategy: 'stub' },
      })),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        InvoicesModule,
        DashboardsModule,
        HealthModule,
        TariffReadinessModule,
        MetricsModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(LLM_CLIENT)
      .useValue(llmMock)
      .overrideProvider(InvoicesRepository)
      .useValue(repositoryMock)
      .overrideProvider(AlertsService)
      .useValue(alertsMock)
      .overrideProvider(InvoiceProcessingService)
      .useValue(processingMock)
      .overrideProvider(TariffReadinessService)
      .useValue(tariffMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(AppValidationPipe);
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new HttpLoggingInterceptor());
    const swaggerConfig = new DocumentBuilder()
      .setTitle('teste-lumi-api API')
      .setDescription('API documentation')
      .setVersion('1.0.0')
      .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, swaggerDocument);
    await app.init();
  });

  beforeEach(() => {
    resetPrometheusMetricsForTests();
    repositoryMock.reset();
    llmMock.extractInvoiceData.mockReset();
    prismaMock.$queryRaw.mockResolvedValue([{ ok: 1 }]);
    alertsMock.evaluateAndPersist.mockClear();
    processingMock.start.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health/liveness should return ok', async () => {
    const response = await request(app.getHttpServer()).get('/health/liveness');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('GET /health/readiness should return ready', async () => {
    const response = await request(app.getHttpServer()).get('/health/readiness');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ready');
  });

  it('GET /health/readiness should return 503 when db is unavailable', async () => {
    prismaMock.$queryRaw.mockRejectedValueOnce(new Error('db down'));

    const response = await request(app.getHttpServer()).get('/health/readiness');

    expect(response.status).toBe(503);
    expect(response.body.message).toBe('Service not ready');
  });

  it('POST /invoices/upload should persist and return 201', async () => {
    llmMock.extractInvoiceData.mockResolvedValue({
      [CLIENT_NUMBER_FIELD]: '3001116735',
      [REFERENCE_MONTH_FIELD]: 'SET/2024',
      [ELECTRIC_ENERGY_FIELD]: { quantidade_kwh: '100', valor_rs: '50,00' },
      [SCEEE_ENERGY_FIELD]: { quantidade_kwh: '10', valor_rs: '8,50' },
      [GD_COMPENSATED_ENERGY_FIELD]: { quantidade_kwh: '20', valor_rs: '7,10' },
      [PUBLIC_LIGHTING_FIELD]: { valor_rs: '4,00' },
    });

    const response = await request(app.getHttpServer())
      .post('/invoices/upload')
      .attach('file', Buffer.from('%PDF-1.4\ninvoice-a', 'utf8'), {
        filename: 'invoice-a.pdf',
        contentType: 'application/pdf',
      });

    expect(response.status).toBe(201);
    expect(response.body.numeroCliente).toBe('3001116735');
    expect(response.body.consumoKwh).toBe(110);
    expect(response.body.valorTotalSemGd).toBe(62.5);
    expect(alertsMock.evaluateAndPersist).toHaveBeenCalledTimes(1);
  });

  it('POST /invoices/upload should reject non-pdf files', async () => {
    const response = await request(app.getHttpServer())
      .post('/invoices/upload')
      .attach('file', Buffer.from('not a pdf', 'utf8'), {
        filename: 'invoice.txt',
        contentType: 'text/plain',
      });

    expect(response.status).toBe(400);
  });

  it('POST /invoices/upload should reject invalid pdf signature even with pdf mimetype', async () => {
    const response = await request(app.getHttpServer())
      .post('/invoices/upload')
      .attach('file', Buffer.from('not-a-real-pdf', 'utf8'), {
        filename: 'invoice-invalid-header.pdf',
        contentType: 'application/pdf',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('PDF signature');
  });

  it('POST /invoices/upload should return 422 when llm payload is invalid/incomplete', async () => {
    processingMock.start.mockResolvedValueOnce({
      id: 'proc-422',
      hashSha256: 'hash-422',
      sourceFilename: 'invoice-422.pdf',
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
    });
    llmMock.extractInvoiceData.mockRejectedValue(
      new UnprocessableEntityException('LLM returned invalid JSON'),
    );

    const response = await request(app.getHttpServer())
      .post('/invoices/upload')
      .attach('file', Buffer.from('%PDF-1.4\ninvoice-422', 'utf8'), {
        filename: 'invoice-422.pdf',
        contentType: 'application/pdf',
      });

    expect(response.status).toBe(422);
    expect(processingMock.markFailed).toHaveBeenCalled();
  });

  it('POST /invoices/upload should return 502 on llm failure', async () => {
    processingMock.start.mockResolvedValueOnce({
      id: 'proc-1',
      hashSha256: 'hash',
      sourceFilename: 'invoice-err.pdf',
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
    });
    llmMock.extractInvoiceData.mockRejectedValue(new Error('provider down'));

    const response = await request(app.getHttpServer())
      .post('/invoices/upload')
      .attach('file', Buffer.from('%PDF-1.4\ninvoice-err', 'utf8'), {
        filename: 'invoice-err.pdf',
        contentType: 'application/pdf',
      });

    expect(response.status).toBe(502);
    expect(processingMock.markFailed).toHaveBeenCalled();
  });

  it('GET /invoices and dashboards should respect filters and totals', async () => {
    llmMock.extractInvoiceData
      .mockResolvedValueOnce({
        [CLIENT_NUMBER_FIELD]: '3001116735',
        [REFERENCE_MONTH_FIELD]: 'SET/2024',
        [ELECTRIC_ENERGY_FIELD]: { quantidade_kwh: '100', valor_rs: '50,00' },
        [SCEEE_ENERGY_FIELD]: { quantidade_kwh: '20', valor_rs: '10,00' },
        [GD_COMPENSATED_ENERGY_FIELD]: { quantidade_kwh: '30', valor_rs: '15,00' },
        [PUBLIC_LIGHTING_FIELD]: { valor_rs: '5,00' },
      })
      .mockResolvedValueOnce({
        [CLIENT_NUMBER_FIELD]: '3001422762',
        [REFERENCE_MONTH_FIELD]: 'OUT/2024',
        [ELECTRIC_ENERGY_FIELD]: { quantidade_kwh: '200', valor_rs: '80,00' },
        [SCEEE_ENERGY_FIELD]: { quantidade_kwh: '30', valor_rs: '12,00' },
        [GD_COMPENSATED_ENERGY_FIELD]: { quantidade_kwh: '50', valor_rs: '20,00' },
        [PUBLIC_LIGHTING_FIELD]: { valor_rs: '7,00' },
      });

    await request(app.getHttpServer())
      .post('/invoices/upload')
      .attach('file', Buffer.from('%PDF-1.4\ninvoice-c1', 'utf8'), {
        filename: 'invoice-c1.pdf',
        contentType: 'application/pdf',
      });

    await request(app.getHttpServer())
      .post('/invoices/upload')
      .attach('file', Buffer.from('%PDF-1.4\ninvoice-c2', 'utf8'), {
        filename: 'invoice-c2.pdf',
        contentType: 'application/pdf',
      });

    const listResponse = await request(app.getHttpServer()).get(
      '/invoices?numero_cliente=3001116735',
    );
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.total).toBe(1);

    const energyResponse = await request(app.getHttpServer()).get(
      '/dashboard/energia?numero_cliente=3001116735',
    );
    expect(energyResponse.status).toBe(200);
    expect(energyResponse.body.consumo_kwh_total).toBe(120);

    const financeResponse = await request(app.getHttpServer()).get(
      '/dashboard/financeiro?numero_cliente=3001116735',
    );
    expect(financeResponse.status).toBe(200);
    expect(financeResponse.body.valor_total_sem_gd_total).toBe(65);

    const kpisResponse = await request(app.getHttpServer()).get(
      '/dashboard/kpis?numero_cliente=3001116735',
    );
    expect(kpisResponse.status).toBe(200);
    expect(kpisResponse.body).toHaveProperty('kwh_por_real');
    expect(kpisResponse.body).toHaveProperty('ranking_top_n');
  });

  it('GET /alerts should return paginated alerts', async () => {
    const response = await request(app.getHttpServer()).get('/alerts?numero_cliente=3001116735');

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.data[0].numeroCliente).toBe('3001116735');
  });

  it('GET /tariff-readiness/plans and POST /simulate should return simulation', async () => {
    const plansResponse = await request(app.getHttpServer()).get('/tariff-readiness/plans');
    expect(plansResponse.status).toBe(200);
    expect(plansResponse.body[0].name).toBe('Convencional');

    const simulateResponse = await request(app.getHttpServer())
      .post('/tariff-readiness/simulate')
      .send({
        invoice_id: 'c56a4180-65aa-42ec-a945-5fd21dec0538',
        tariff_plan_id: 'c56a4180-65aa-42ec-a945-5fd21dec0539',
      });

    expect(simulateResponse.status).toBe(201);
    expect(simulateResponse.body.savings_percent).toBe(8);
  });

  it('GET /metrics should expose prometheus metrics for pipeline stages', async () => {
    llmMock.extractInvoiceData.mockResolvedValue({
      [CLIENT_NUMBER_FIELD]: '3001116735',
      [REFERENCE_MONTH_FIELD]: 'SET/2024',
      [ELECTRIC_ENERGY_FIELD]: { quantidade_kwh: '100', valor_rs: '50,00' },
      [SCEEE_ENERGY_FIELD]: { quantidade_kwh: '10', valor_rs: '8,50' },
      [GD_COMPENSATED_ENERGY_FIELD]: { quantidade_kwh: '20', valor_rs: '7,10' },
      [PUBLIC_LIGHTING_FIELD]: { valor_rs: '4,00' },
    });

    await request(app.getHttpServer())
      .post('/invoices/upload')
      .attach('file', Buffer.from('%PDF-1.4\ninvoice-metrics', 'utf8'), {
        filename: 'invoice-metrics.pdf',
        contentType: 'application/pdf',
      });

    const metricsResponse = await request(app.getHttpServer()).get('/metrics');

    expect(metricsResponse.status).toBe(200);
    expect(metricsResponse.headers['content-type']).toContain('text/plain');
    expect(metricsResponse.text).toContain('# HELP invoice_processing_stage_total');
    expect(metricsResponse.text).toContain(
      'invoice_processing_stage_total{stage="upload",result="success"}',
    );
    expect(metricsResponse.text).toContain(
      'invoice_processing_stage_total{stage="llm_extract",result="success"}',
    );
    expect(metricsResponse.text).toContain(
      'invoice_processing_stage_total{stage="db_persist",result="success"}',
    );
    expect(metricsResponse.text).toContain(
      'invoice_processing_stage_duration_seconds_count{stage="upload"}',
    );
    expect(metricsResponse.text).toContain(
      'http_server_requests_total{method="POST",route="/invoices/upload",status_code="201"}',
    );
    expect(metricsResponse.text).toContain(
      'http_server_request_duration_seconds_count{method="POST",route="/invoices/upload",status_code="201"}',
    );
  });

  it('GET /docs and /docs-json should expose OpenAPI contract snapshot', async () => {
    const docsResponse = await request(app.getHttpServer()).get('/docs');
    expect(docsResponse.status).toBe(200);
    expect(docsResponse.text).toContain('Swagger UI');

    const openApiResponse = await request(app.getHttpServer()).get('/docs-json');
    expect(openApiResponse.status).toBe(200);

    const contractSnapshot = {
      openapi: openApiResponse.body.openapi,
      info: {
        title: openApiResponse.body.info?.title,
        version: openApiResponse.body.info?.version,
      },
      paths: Object.keys(openApiResponse.body.paths ?? {}).sort(),
      schemas: Object.keys(openApiResponse.body.components?.schemas ?? {}).sort(),
      invoiceUpload: {
        hasRequestBody: Boolean(
          openApiResponse.body.paths?.['/invoices/upload']?.post?.requestBody,
        ),
        responses: Object.keys(
          openApiResponse.body.paths?.['/invoices/upload']?.post?.responses ?? {},
        ).sort(),
      },
      requiredPaths: {
        upload: Boolean(openApiResponse.body.paths?.['/invoices/upload']),
        invoices: Boolean(openApiResponse.body.paths?.['/invoices']),
        dashboardEnergia: Boolean(openApiResponse.body.paths?.['/dashboard/energia']),
        dashboardFinanceiro: Boolean(openApiResponse.body.paths?.['/dashboard/financeiro']),
      },
    };

    expect(contractSnapshot).toMatchSnapshot();
  });
});
