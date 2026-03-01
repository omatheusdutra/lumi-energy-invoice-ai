import { describe, expect, it } from 'vitest';
import {
  buildInvoiceStatusSlices,
  buildKpiMetrics,
  mergeDashboardSeries,
} from '@/lib/dashboard/models';

describe('dashboard model transforms', () => {
  it('merges energy and financial series into chart-ready points', () => {
    const series = mergeDashboardSeries(
      {
        consumo_kwh_total: 240,
        energia_compensada_kwh_total: 80,
        series: [
          { mes_referencia: 'JAN/2024', consumo_kwh: 100, energia_compensada_kwh: 30 },
          { mes_referencia: 'FEV/2024', consumo_kwh: 140, energia_compensada_kwh: 50 },
        ],
      },
      {
        valor_total_sem_gd_total: 320,
        economia_gd_total: 90,
        series: [
          { mes_referencia: 'JAN/2024', valor_total_sem_gd: 120, economia_gd: 35 },
          { mes_referencia: 'FEV/2024', valor_total_sem_gd: 200, economia_gd: 55 },
        ],
      },
    );

    expect(series).toHaveLength(2);
    expect(series[0]?.monthRef).toBe('JAN/2024');
    expect(series[1]?.valueWithoutGd).toBe(200);
    expect(series[0]?.generatedKwh).toBeGreaterThan(0);
  });

  it('builds KPI metrics and invoice status slices', () => {
    const metrics = buildKpiMetrics([
      {
        monthRef: 'JAN/2024',
        monthLabel: 'JAN / 2024',
        generatedKwh: 120,
        consumedKwh: 110,
        compensatedKwh: 40,
        balanceKwh: 10,
        valueWithoutGd: 130,
        gdSavings: 20,
      },
      {
        monthRef: 'FEV/2024',
        monthLabel: 'FEV / 2024',
        generatedKwh: 140,
        consumedKwh: 105,
        compensatedKwh: 45,
        balanceKwh: 35,
        valueWithoutGd: 100,
        gdSavings: 15,
      },
    ]);

    expect(metrics).toHaveLength(4);
    expect(metrics[0]?.label).toBe('Energia Gerada');
    expect(metrics[3]?.value).toBe(45);

    const slices = buildInvoiceStatusSlices(8, 12, {
      data: [
        {
          id: '1',
          numeroCliente: '3001116735',
          mesReferencia: 'JAN/2024',
          alertType: 'SPIKE',
          severity: 'WARNING',
          message: 'teste',
          isResolved: false,
        },
        {
          id: '2',
          numeroCliente: '3001116735',
          mesReferencia: 'FEV/2024',
          alertType: 'SPIKE',
          severity: 'CRITICAL',
          message: 'teste',
          isResolved: false,
        },
      ],
      page: 1,
      pageSize: 20,
      total: 2,
      totalPages: 1,
    });

    expect(slices).toHaveLength(4);
    expect(slices[0]?.label).toBe('Completas');
    expect(slices[0]?.value).toBe(8);
  });
});
