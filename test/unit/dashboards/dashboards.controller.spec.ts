import { DashboardsController } from '../../../src/modules/dashboards/dashboards.controller';

describe('DashboardsController', () => {
  it('delegates energy dashboard query', async () => {
    const getEnergyDashboard = jest.fn(async () => ({ consumo_kwh_total: 1 }));
    const controller = new DashboardsController({
      getEnergyDashboard,
      getFinancialDashboard: jest.fn(),
      getKpisDashboard: jest.fn(),
    } as any);

    const query = { numero_cliente: '3001116735' };
    await controller.energyDashboard(query as any);
    expect(getEnergyDashboard).toHaveBeenCalledWith(query);
  });

  it('delegates financial dashboard query', async () => {
    const getFinancialDashboard = jest.fn(async () => ({ valor_total_sem_gd_total: 10 }));
    const controller = new DashboardsController({
      getEnergyDashboard: jest.fn(),
      getFinancialDashboard,
      getKpisDashboard: jest.fn(),
    } as any);

    const query = { mes_referencia: 'SET/2024' };
    await controller.financialDashboard(query as any);
    expect(getFinancialDashboard).toHaveBeenCalledWith(query);
  });

  it('delegates kpis dashboard query', async () => {
    const getKpisDashboard = jest.fn(async () => ({ ranking_top_n: [] }));
    const controller = new DashboardsController({
      getEnergyDashboard: jest.fn(),
      getFinancialDashboard: jest.fn(),
      getKpisDashboard,
    } as any);

    const query = { top_n: 5 };
    await controller.kpisDashboard(query as any);
    expect(getKpisDashboard).toHaveBeenCalledWith(query);
  });
});
