import { TariffReadinessController } from '../../../src/modules/tariff-readiness/tariff-readiness.controller';

describe('TariffReadinessController', () => {
  it('delegates listPlans and simulate to service', async () => {
    const listPlans = jest.fn(async () => [{ id: 'p1' }]);
    const simulate = jest.fn(async () => ({ simulation_id: 'sim-1' }));
    const controller = new TariffReadinessController({ listPlans, simulate } as any);

    await expect(controller.listPlans()).resolves.toEqual([{ id: 'p1' }]);
    expect(listPlans).toHaveBeenCalledTimes(1);

    const body = { invoice_id: 'inv-1', tariff_plan_id: 'plan-1' };
    await expect(controller.simulate(body as any)).resolves.toEqual({ simulation_id: 'sim-1' });
    expect(simulate).toHaveBeenCalledWith(body);
  });
});
