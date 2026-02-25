import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { HttpExceptionFilter } from '../../src/common/http/http-exception.filter';
import { AppValidationPipe } from '../../src/common/http/validation.pipe';
import { HealthController } from '../../src/modules/health/health.controller';
import { HealthService } from '../../src/modules/health/health.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('HealthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: { $queryRaw: jest.fn(async () => [{ ok: 1 }]) },
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

  it('GET /health/liveness', async () => {
    const response = await request(app.getHttpServer()).get('/health/liveness');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('GET / should return API metadata', async () => {
    const response = await request(app.getHttpServer()).get('/');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.endpoints?.liveness).toBe('/health/liveness');
    expect(response.body.endpoints?.readiness).toBe('/health/readiness');
    expect(response.body.endpoints?.metrics).toBe('/metrics');
    expect(response.body.endpoints?.docs).toBe('/docs');
  });
});
