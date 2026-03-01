import { describe, expect, it } from 'vitest';
import { queryKeys } from '@/lib/api/query-keys';

describe('queryKeys', () => {
  it('builds stable invoice keys with defaults', () => {
    expect(queryKeys.invoicesRoot).toEqual(['invoices']);
    expect(queryKeys.invoices({})).toEqual(['invoices', '', '', '', '', 1, 20]);
    expect(queryKeys.invoice('inv-1')).toEqual(['invoice', 'inv-1']);
  });

  it('builds stable dashboard and summary keys with filters', () => {
    const filters = {
      numero_cliente: '3001116735',
      mes_referencia: 'SET/2024',
      periodo_inicio: '2024-01',
      periodo_fim: '2024-12',
    };

    expect(queryKeys.dashboardRoot).toEqual(['dashboard']);
    expect(queryKeys.dashboard(filters)).toEqual([
      'dashboard',
      '3001116735',
      'SET/2024',
      '2024-01',
      '2024-12',
    ]);
    expect(queryKeys.dashboardEnergy(filters)).toEqual([
      'dashboard',
      'energia',
      '3001116735',
      'SET/2024',
      '2024-01',
      '2024-12',
    ]);
    expect(queryKeys.financialSummaryRoot).toEqual(['financial-summary']);
    expect(queryKeys.financialSummary(filters)).toEqual([
      'financial-summary',
      '3001116735',
      'SET/2024',
      '2024-01',
      '2024-12',
    ]);
    expect(queryKeys.dashboard({})).toEqual(['dashboard', '', '', '', '']);
    expect(queryKeys.dashboardEnergy({})).toEqual(['dashboard', 'energia', '', '', '', '']);
    expect(queryKeys.financialSummary({})).toEqual(['financial-summary', '', '', '', '']);
  });

  it('builds alerts and invoices summary keys', () => {
    expect(queryKeys.alertsRoot).toEqual(['alerts']);
    expect(
      queryKeys.alerts({
        numero_cliente: '3001422762',
        mes_referencia: 'OUT/2024',
        page: 2,
        pageSize: 5,
      }),
    ).toEqual(['alerts', '3001422762', 'OUT/2024', 2, 5]);

    expect(queryKeys.invoicesSummaryRoot).toEqual(['invoices-summary']);
    expect(
      queryKeys.invoicesSummary({
        numero_cliente: '3001422762',
        periodo_inicio: '2024-01',
        periodo_fim: '2024-12',
      }),
    ).toEqual(['invoices-summary', '3001422762', '', '2024-01', '2024-12']);
    expect(queryKeys.alerts({})).toEqual(['alerts', '', '', 1, 20]);
    expect(queryKeys.invoicesSummary({})).toEqual(['invoices-summary', '', '', '', '']);
  });
});
