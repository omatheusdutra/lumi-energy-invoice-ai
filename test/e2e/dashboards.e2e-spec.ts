import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { HttpExceptionFilter } from '../../src/common/http/http-exception.filter';
import { AppValidationPipe } from '../../src/common/http/validation.pipe';
import { DashboardsController } from '../../src/modules/dashboards/dashboards.controller';
import { DashboardsService } from '../../src/modules/dashboards/dashboards.service';
import { InvoicesService } from '../../src/modules/invoices/invoices.service';

describe('DashboardsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const invoicesServiceMock = {
      getEnergyDashboard: jest.fn(async () => ({
        consumo_kwh_total: 10,
        energia_compensada_kwh_total: 3,
        series: [],
      })),
      getFinancialDashboard: jest.fn(async () => ({
        valor_total_sem_gd_total: 20,
        economia_gd_total: 4,
        series: [],
      })),
      getKpisDashboard: jest.fn(async () => ({
        kwh_por_real: 1,
        economia_percentual: 10,
        tendencia_6_meses_percent: 2,
        ranking_top_n: [],
        series: [],
      })),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [DashboardsController],
      providers: [
        DashboardsService,
        {
          provide: InvoicesService,
          useValue: invoicesServiceMock,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(AppValidationPipe);
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /dashboard/energia', async () => {
    const response = await request(app.getHttpServer()).get('/dashboard/energia');
    expect(response.status).toBe(200);
    expect(response.body.consumo_kwh_total).toBe(10);
  });
});
