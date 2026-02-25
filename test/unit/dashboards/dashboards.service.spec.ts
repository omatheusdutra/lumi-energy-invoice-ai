import { DashboardsService } from '../../../src/modules/dashboards/dashboards.service';

describe('DashboardsService', () => {
  it('delegates to invoices service', async () => {
    const invoicesService = {
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

    const service = new DashboardsService(invoicesService as never);
    const result = await service.getEnergyDashboard({});

    expect(result.consumo_kwh_total).toBe(10);
    expect(invoicesService.getEnergyDashboard).toHaveBeenCalledTimes(1);
  });
});
