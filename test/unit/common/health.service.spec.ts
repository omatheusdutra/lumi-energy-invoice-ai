import { ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { HealthService } from '../../../src/modules/health/health.service';

describe('HealthService', () => {
  let service: HealthService;
  let prisma: { $queryRaw: jest.Mock };

  beforeEach(() => {
    prisma = {
      $queryRaw: jest.fn(),
    };

    service = new HealthService(prisma as unknown as PrismaService);
  });

  it('returns API metadata for root endpoint', () => {
    const result = service.getApiInfo('req-root');

    expect(result.status).toBe('ok');
    expect(result.requestId).toBe('req-root');
    expect(result.endpoints.root).toBe('/');
    expect(result.endpoints.liveness).toBe('/health/liveness');
    expect(result.endpoints.readiness).toBe('/health/readiness');
    expect(result.endpoints.metrics).toBe('/metrics');
    expect(result.endpoints.docs).toBe('/docs');
  });

  it('returns readiness when database is healthy', async () => {
    prisma.$queryRaw.mockResolvedValue([{ ok: 1 }]);

    const result = await service.getReadiness('req-123');

    expect(result.status).toBe('ready');
    expect(result.requestId).toBe('req-123');
    expect(result.checks.database.status).toBe('up');
  });

  it('throws service unavailable when database check fails', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('db down'));

    await expect(service.getReadiness()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
