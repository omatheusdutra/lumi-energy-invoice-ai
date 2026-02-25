import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { env } from '../../common/config/env';

@Injectable()
export class HealthService {
  private readonly appVersion = process.env.npm_package_version ?? 'unknown';

  getApiInfo(requestId?: string) {
    return {
      status: 'ok',
      service: env.APP_NAME,
      environment: env.NODE_ENV,
      version: this.appVersion,
      requestId,
      endpoints: {
        root: '/',
        liveness: '/health/liveness',
        readiness: '/health/readiness',
        metrics: '/metrics',
        docs: '/docs',
      },
      timestamp: new Date().toISOString(),
    };
  }

  async getLiveness(requestId?: string) {
    return {
      status: 'ok',
      requestId,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  constructor(private readonly prisma: PrismaService) {}

  async getReadiness(requestId?: string) {
    const start = Date.now();
    const timeoutGuard = this.createTimeoutGuard(env.HEALTHCHECK_TIMEOUT_MS);

    try {
      await Promise.race([this.prisma.$queryRaw`SELECT 1`, timeoutGuard.promise]);

      return {
        status: 'ready',
        requestId,
        checks: {
          database: {
            status: 'up',
            latencyMs: Date.now() - start,
          },
        },
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        message: 'Service not ready',
        checks: {
          database: {
            status: 'down',
          },
        },
      });
    } finally {
      timeoutGuard.clear();
    }
  }

  private createTimeoutGuard(ms: number): { promise: Promise<never>; clear: () => void } {
    let timeout: NodeJS.Timeout | undefined;
    const promise = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => reject(new Error('Healthcheck timeout')), ms);
      timeout.unref?.();
    });

    return {
      promise,
      clear: () => {
        if (timeout) {
          clearTimeout(timeout);
        }
      },
    };
  }
}
