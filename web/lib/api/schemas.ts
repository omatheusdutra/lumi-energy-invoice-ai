import { z } from 'zod';

export const monthReferenceSchema = z
  .string()
  .regex(/^(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\/\d{4}$/i);

export const invoiceSchema = z
  .object({
    id: z.string().uuid(),
    numeroCliente: z.string().min(1),
    mesReferencia: monthReferenceSchema,
    mesReferenciaDate: z.string(),
    energiaEletricaKwh: z.number(),
    energiaEletricaRs: z.number(),
    energiaSceeeKwh: z.number(),
    energiaSceeeRs: z.number(),
    energiaCompensadaGdiKwh: z.number(),
    energiaCompensadaGdiRs: z.number(),
    contribIlumRs: z.number(),
    consumoKwh: z.number(),
    energiaCompensadaKwh: z.number(),
    valorTotalSemGd: z.number(),
    economiaGdRs: z.number(),
    sourceFilename: z.string(),
    hashSha256: z.string(),
    dedupCompositeKey: z.string(),
    createdAt: z.string(),
  })
  .strict();

export const listInvoicesResponseSchema = z
  .object({
    data: z.array(invoiceSchema),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(1),
  })
  .strict();

export const energySeriesItemSchema = z
  .object({
    mes_referencia: monthReferenceSchema,
    consumo_kwh: z.number(),
    energia_compensada_kwh: z.number(),
  })
  .strict();

export const financialSeriesItemSchema = z
  .object({
    mes_referencia: monthReferenceSchema,
    valor_total_sem_gd: z.number(),
    economia_gd: z.number(),
  })
  .strict();

export const energyDashboardSchema = z
  .object({
    consumo_kwh_total: z.number(),
    energia_compensada_kwh_total: z.number(),
    series: z.array(energySeriesItemSchema),
  })
  .strict();

export const financialDashboardSchema = z
  .object({
    valor_total_sem_gd_total: z.number(),
    economia_gd_total: z.number(),
    series: z.array(financialSeriesItemSchema),
  })
  .strict();

export const kpiDashboardSchema = z
  .object({
    kwh_por_real: z.number(),
    economia_percentual: z.number(),
    tendencia_6_meses_percent: z.number(),
    ranking_top_n: z.array(
      z
        .object({
          numero_cliente: z.string(),
          consumo_kwh: z.number(),
          valor_total_sem_gd: z.number(),
          economia_gd: z.number(),
        })
        .strict(),
    ),
    series: z.array(
      z
        .object({
          mes_referencia: monthReferenceSchema,
          consumo_kwh: z.number(),
          valor_total_sem_gd: z.number(),
          economia_gd: z.number(),
        })
        .strict(),
    ),
  })
  .strict();

export const alertSchema = z
  .object({
    id: z.string().uuid().or(z.string().min(1)),
    numeroCliente: z.string(),
    mesReferencia: monthReferenceSchema,
    alertType: z.string(),
    severity: z.string(),
    message: z.string(),
    metricValue: z.number().nullable().optional(),
    baselineValue: z.number().nullable().optional(),
    deltaPercent: z.number().nullable().optional(),
    isResolved: z.boolean(),
    metadata: z.unknown().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .strict();

export const alertsResponseSchema = z
  .object({
    data: z.array(alertSchema),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(1),
  })
  .strict();

export type Invoice = z.infer<typeof invoiceSchema>;
export type ListInvoicesResponse = z.infer<typeof listInvoicesResponseSchema>;
export type EnergyDashboard = z.infer<typeof energyDashboardSchema>;
export type FinancialDashboard = z.infer<typeof financialDashboardSchema>;
export type KpiDashboard = z.infer<typeof kpiDashboardSchema>;
export type AlertsResponse = z.infer<typeof alertsResponseSchema>;
