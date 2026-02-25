import { HealthController } from '../../../src/modules/health/health.controller';

describe('HealthController', () => {
  it('delegates root/liveness/readiness to HealthService', async () => {
    const getApiInfo = jest.fn(() => ({ status: 'ok' }));
    const getLiveness = jest.fn(() => ({ status: 'ok' }));
    const getReadiness = jest.fn(async () => ({ status: 'ready' }));

    const controller = new HealthController({
      getApiInfo,
      getLiveness,
      getReadiness,
    } as any);

    const req = { requestId: 'req-1' } as any;

    expect(controller.root(req).status).toBe('ok');
    const liveness = await Promise.resolve(controller.liveness(req));
    const readiness = await Promise.resolve(controller.readiness(req));
    expect(liveness).toEqual({ status: 'ok' });
    expect(readiness).toEqual({ status: 'ready' });

    expect(getApiInfo).toHaveBeenCalledWith('req-1');
    expect(getLiveness).toHaveBeenCalledWith('req-1');
    expect(getReadiness).toHaveBeenCalledWith('req-1');
  });
});
