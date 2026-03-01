import { z } from 'zod';
import type { DashboardFilters } from '@/lib/api/query-schemas';
import type { EnergyDashboard, FinancialDashboard } from '@/lib/api/schemas';
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

function monthRefToTimestamp(monthRef: string): number {
  const [monthToken, yearToken] = monthRef.split('/');
  const monthIndex = monthToken ? MONTH_ORDER[monthToken.toUpperCase()] : undefined;
  const year = Number.parseInt(yearToken ?? '', 10);

  if (monthIndex === undefined || Number.isNaN(year)) {
    return Number.POSITIVE_INFINITY;
  }

  return Date.UTC(year, monthIndex, 1);
}

function sortByMonthReference<T extends { mes_referencia: string }>(rows: T[]): T[] {
  return [...rows].sort(
    (left, right) =>
      monthRefToTimestamp(left.mes_referencia) - monthRefToTimestamp(right.mes_referencia),
  );
}

function calculateTrend(current: number, previous: number | undefined): number | null {
  if (previous === undefined || previous <= 0) {
    return null;
  }

  return Number((((current - previous) / previous) * 100).toFixed(2));
}

const dashboardKpiSchema = z
  .object({
    id: z.enum(['consumo', 'compensada', 'valor-sem-gd', 'economia-gd']),
    label: z.string(),
    unit: z.enum(['kWh', 'R$']),
    value: z.number(),
    trendPercent: z.number().nullable(),
    formula: z.string(),
    sparkline: z.array(z.number()),
  })
  .strict();

const energySeriesPointSchema = z
  .object({
    monthRef: z.string(),
    monthLabel: z.string(),
    consumoKwh: z.number(),
    energiaCompensadaKwh: z.number(),
  })
  .strict();

const financeSeriesPointSchema = z
  .object({
    monthRef: z.string(),
    monthLabel: z.string(),
    valorTotalSemGd: z.number(),
    economiaGd: z.number(),
  })
  .strict();

export const dashboardDtoSchema = z
  .object({
    kpis: z.array(dashboardKpiSchema).length(4),
    series_energy: z.array(energySeriesPointSchema),
    series_finance: z.array(financeSeriesPointSchema),
    meta: z
      .object({
        filters: z
          .object({
            numero_cliente: z.string().optional(),
            mes_referencia: z.string().optional(),
            periodo_inicio: z.string().optional(),
            periodo_fim: z.string().optional(),
          })
          .strict(),
        rangeStart: z.string().optional(),
        rangeEnd: z.string().optional(),
        updatedAt: z.string(),
      })
      .strict(),
  })
  .strict();

export type DashboardDTO = z.infer<typeof dashboardDtoSchema>;

interface BuildDashboardDtoInput {
  energy: EnergyDashboard;
  financial: FinancialDashboard;
  filters: DashboardFilters;
  updatedAt: number;
}

export function buildDashboardDto({
  energy,
  financial,
  filters,
  updatedAt,
}: BuildDashboardDtoInput): DashboardDTO {
  const orderedEnergy = sortByMonthReference(energy.series);
  const orderedFinance = sortByMonthReference(financial.series);

  const energySeries = orderedEnergy.map((item) => ({
    monthRef: item.mes_referencia,
    monthLabel: monthToDateLabel(item.mes_referencia),
    consumoKwh: item.consumo_kwh,
    energiaCompensadaKwh: item.energia_compensada_kwh,
  }));

  const financeSeries = orderedFinance.map((item) => ({
    monthRef: item.mes_referencia,
    monthLabel: monthToDateLabel(item.mes_referencia),
    valorTotalSemGd: item.valor_total_sem_gd,
    economiaGd: item.economia_gd,
  }));

  const lastEnergy = orderedEnergy.at(-1);
  const previousEnergy = orderedEnergy.at(-2);
  const lastFinance = orderedFinance.at(-1);
  const previousFinance = orderedFinance.at(-2);

  const monthReferences = [...orderedEnergy, ...orderedFinance]
    .map((item) => item.mes_referencia)
    .sort((left, right) => monthRefToTimestamp(left) - monthRefToTimestamp(right));

  const normalizedUpdatedAt =
    Number.isFinite(updatedAt) && updatedAt > 0
      ? new Date(updatedAt).toISOString()
      : new Date().toISOString();

  return dashboardDtoSchema.parse({
    kpis: [
      {
        id: 'consumo',
        label: 'Consumo de Energia Elétrica',
        unit: 'kWh',
        value: energy.consumo_kwh_total,
        trendPercent: calculateTrend(lastEnergy?.consumo_kwh ?? 0, previousEnergy?.consumo_kwh),
        formula: 'Consumo (kWh) = Energia Elétrica (kWh) + Energia SCEEE s/ICMS (kWh)',
        sparkline: orderedEnergy.map((item) => item.consumo_kwh),
      },
      {
        id: 'compensada',
        label: 'Energia Compensada',
        unit: 'kWh',
        value: energy.energia_compensada_kwh_total,
        trendPercent: calculateTrend(
          lastEnergy?.energia_compensada_kwh ?? 0,
          previousEnergy?.energia_compensada_kwh,
        ),
        formula: 'Energia Compensada (kWh) = Energia compensada GD I (kWh)',
        sparkline: orderedEnergy.map((item) => item.energia_compensada_kwh),
      },
      {
        id: 'valor-sem-gd',
        label: 'Valor Total sem GD',
        unit: 'R$',
        value: financial.valor_total_sem_gd_total,
        trendPercent: calculateTrend(
          lastFinance?.valor_total_sem_gd ?? 0,
          previousFinance?.valor_total_sem_gd,
        ),
        formula:
          'Valor Total sem GD (R$) = Energia Elétrica (R$) + Energia SCEEE s/ICMS (R$) + Contrib Ilum Pública (R$)',
        sparkline: orderedFinance.map((item) => item.valor_total_sem_gd),
      },
      {
        id: 'economia-gd',
        label: 'Economia GD',
        unit: 'R$',
        value: financial.economia_gd_total,
        trendPercent: calculateTrend(lastFinance?.economia_gd ?? 0, previousFinance?.economia_gd),
        formula: 'Economia GD (R$) = Energia compensada GD I (R$)',
        sparkline: orderedFinance.map((item) => item.economia_gd),
      },
    ],
    series_energy: energySeries,
    series_finance: financeSeries,
    meta: {
      filters: {
        numero_cliente: filters.numero_cliente,
        mes_referencia: filters.mes_referencia,
        periodo_inicio: filters.periodo_inicio,
        periodo_fim: filters.periodo_fim,
      },
      rangeStart: monthReferences.at(0),
      rangeEnd: monthReferences.at(-1),
      updatedAt: normalizedUpdatedAt,
    },
  });
}
