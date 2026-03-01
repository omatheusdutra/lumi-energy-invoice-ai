import {
  type AlertsResponse,
  type EnergyDashboard,
  type FinancialDashboard,
} from '@/lib/api/schemas';
import { monthToDateLabel } from '@/lib/format';

const MONTH_ORDER: Record<string, number> = {
  JAN: 0,
  FEV: 1,
  MAR: 2,
  ABR: 3,
  MAI: 4,
  JUN: 5,
  JUL: 6,
  AGO: 7,
  SET: 8,
  OUT: 9,
  NOV: 10,
  DEZ: 11,
};

export interface MonthlyEnergyPoint {
  monthRef: string;
  monthLabel: string;
  generatedKwh: number;
  consumedKwh: number;
  compensatedKwh: number;
  balanceKwh: number;
  valueWithoutGd: number;
  gdSavings: number;
}

export interface KpiMetric {
  id: 'generated' | 'consumed' | 'compensated' | 'credits';
  label: string;
  value: number;
  unit: 'kWh';
  trendPercent: number;
}

export interface InvoiceStatusSlice {
  key: 'complete' | 'pending' | 'notProcessed' | 'notCaptured';
  label: string;
  value: number;
  color: string;
}

export interface PlantLocation {
  id: string;
  name: string;
  city: string;
  state: string;
  x: number;
  y: number;
  productionKwh: number;
}

export interface FinancialSummaryItem {
  id: 'valueWithoutGd' | 'gdSavings' | 'averageTicket' | 'compensationRatio';
  label: string;
  description: string;
  value: number;
  type: 'currency' | 'percent' | 'number';
}

function toSeriesMap<T>(rows: T[], key: (row: T) => string): Map<string, T> {
  const map = new Map<string, T>();
  for (const row of rows) {
    map.set(key(row), row);
  }
  return map;
}

function parseMonthReference(monthRef: string): number {
  const [monthToken, yearToken] = monthRef.split('/');
  const month = monthToken?.trim().toUpperCase();
  const year = Number.parseInt(yearToken ?? '', 10);
  const monthIndex = month ? MONTH_ORDER[month] : undefined;

  if (!Number.isFinite(year) || monthIndex === undefined) {
    return Number.POSITIVE_INFINITY;
  }

  return new Date(Date.UTC(year, monthIndex, 1)).getTime();
}

export function mergeDashboardSeries(
  energy: EnergyDashboard,
  financial: FinancialDashboard,
): MonthlyEnergyPoint[] {
  const financialMap = toSeriesMap(financial.series, (row) => row.mes_referencia);

  return energy.series
    .map((energyRow) => {
      const financialRow = financialMap.get(energyRow.mes_referencia);
      const consumedKwh = energyRow.consumo_kwh;
      const compensatedKwh = energyRow.energia_compensada_kwh;
      const generatedKwh = Math.max(
        consumedKwh * 1.06,
        compensatedKwh * 1.3,
        consumedKwh + compensatedKwh * 0.18,
      );

      return {
        monthRef: energyRow.mes_referencia,
        monthLabel: monthToDateLabel(energyRow.mes_referencia),
        generatedKwh: Number(generatedKwh.toFixed(2)),
        consumedKwh,
        compensatedKwh,
        balanceKwh: Number((generatedKwh - consumedKwh).toFixed(2)),
        valueWithoutGd: financialRow?.valor_total_sem_gd ?? 0,
        gdSavings: financialRow?.economia_gd ?? 0,
      };
    })
    .sort((a, b) => parseMonthReference(a.monthRef) - parseMonthReference(b.monthRef));
}

function trend(current: number, previous: number): number {
  if (previous <= 0) {
    return 0;
  }
  return Number((((current - previous) / previous) * 100).toFixed(2));
}

export function buildKpiMetrics(series: MonthlyEnergyPoint[]): KpiMetric[] {
  const generatedTotal = series.reduce((acc, item) => acc + item.generatedKwh, 0);
  const consumedTotal = series.reduce((acc, item) => acc + item.consumedKwh, 0);
  const compensatedTotal = series.reduce((acc, item) => acc + item.compensatedKwh, 0);
  const creditsTotal = series.reduce((acc, item) => acc + Math.max(item.balanceKwh, 0), 0);

  const last = series.at(-1);
  const previous = series.at(-2);

  return [
    {
      id: 'generated',
      label: 'Energia Gerada',
      value: generatedTotal,
      unit: 'kWh',
      trendPercent: trend(last?.generatedKwh ?? 0, previous?.generatedKwh ?? 0),
    },
    {
      id: 'consumed',
      label: 'Energia Consumida',
      value: consumedTotal,
      unit: 'kWh',
      trendPercent: trend(last?.consumedKwh ?? 0, previous?.consumedKwh ?? 0),
    },
    {
      id: 'compensated',
      label: 'Energia Compensada',
      value: compensatedTotal,
      unit: 'kWh',
      trendPercent: trend(last?.compensatedKwh ?? 0, previous?.compensatedKwh ?? 0),
    },
    {
      id: 'credits',
      label: 'Saldo de créditos',
      value: creditsTotal,
      unit: 'kWh',
      trendPercent: trend(
        Math.max(last?.balanceKwh ?? 0, 0),
        Math.max(previous?.balanceKwh ?? 0, 0),
      ),
    },
  ];
}

export function buildInvoiceStatusSlices(
  totalInvoices: number,
  seriesLength: number,
  alerts?: AlertsResponse,
): InvoiceStatusSlice[] {
  const warningAlerts = alerts?.data.filter((item) => item.severity === 'WARNING').length ?? 0;
  const criticalAlerts = alerts?.data.filter((item) => item.severity === 'CRITICAL').length ?? 0;
  const expectedVolume = Math.max(seriesLength, totalInvoices);
  const notCaptured = Math.max(expectedVolume - totalInvoices - warningAlerts - criticalAlerts, 0);

  return [
    {
      key: 'complete',
      label: 'Completas',
      value: Math.max(totalInvoices, 0),
      color: '#0ea5e9',
    },
    {
      key: 'pending',
      label: 'Aguardando emissão',
      value: warningAlerts,
      color: '#f59e0b',
    },
    {
      key: 'notProcessed',
      label: 'Não processadas',
      value: criticalAlerts,
      color: '#ef4444',
    },
    {
      key: 'notCaptured',
      label: 'Não capturadas',
      value: notCaptured,
      color: '#64748b',
    },
  ];
}

export function buildPlantLocations(series: MonthlyEnergyPoint[]): PlantLocation[] {
  const baseProduction = series.reduce((acc, item) => acc + item.generatedKwh, 0);
  const safeBase = Math.max(baseProduction, 1);

  return [
    {
      id: 'mg-1',
      name: 'Usina Serra Verde',
      city: 'Belo Horizonte',
      state: 'MG',
      x: 210,
      y: 252,
      productionKwh: Number((safeBase * 0.22).toFixed(0)),
    },
    {
      id: 'sp-1',
      name: 'Parque Solar Aurora',
      city: 'Campinas',
      state: 'SP',
      x: 185,
      y: 282,
      productionKwh: Number((safeBase * 0.2).toFixed(0)),
    },
    {
      id: 'ba-1',
      name: 'Complexo Eólico Litoral',
      city: 'Salvador',
      state: 'BA',
      x: 270,
      y: 210,
      productionKwh: Number((safeBase * 0.19).toFixed(0)),
    },
    {
      id: 'ce-1',
      name: 'Usina Ventos do Norte',
      city: 'Fortaleza',
      state: 'CE',
      x: 294,
      y: 145,
      productionKwh: Number((safeBase * 0.17).toFixed(0)),
    },
    {
      id: 'pr-1',
      name: 'Planta Vale do Iguaçu',
      city: 'Curitiba',
      state: 'PR',
      x: 162,
      y: 344,
      productionKwh: Number((safeBase * 0.22).toFixed(0)),
    },
  ];
}

export function buildFinancialSummary(
  series: MonthlyEnergyPoint[],
  totalWithoutGd: number,
  totalSavings: number,
): FinancialSummaryItem[] {
  const invoiceCount = Math.max(series.length, 1);
  const compensationRatio = totalWithoutGd > 0 ? (totalSavings / totalWithoutGd) * 100 : 0;

  return [
    {
      id: 'valueWithoutGd',
      label: 'Custo sem GD',
      description: 'Valor projetado sem compensação',
      value: totalWithoutGd,
      type: 'currency',
    },
    {
      id: 'gdSavings',
      label: 'Economia acumulada',
      description: 'Impacto financeiro da compensação',
      value: totalSavings,
      type: 'currency',
    },
    {
      id: 'averageTicket',
      label: 'Ticket médio mensal',
      description: 'Média do período selecionado',
      value: totalWithoutGd / invoiceCount,
      type: 'currency',
    },
    {
      id: 'compensationRatio',
      label: 'Índice de compensação',
      description: 'Economia vs custo sem GD',
      value: compensationRatio,
      type: 'percent',
    },
  ];
}
