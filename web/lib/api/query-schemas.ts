import { z } from 'zod';

export const invoiceFiltersSchema = z
  .object({
    numero_cliente: z.string().trim().min(1).optional(),
    mes_referencia: z
      .string()
      .regex(/^(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\/\d{4}$/i)
      .optional(),
    periodo_inicio: z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
      .optional(),
    periodo_fim: z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
      .optional(),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
  })
  .strict();

export const dashboardFiltersSchema = z
  .object({
    numero_cliente: z.string().trim().min(1).optional(),
    mes_referencia: z
      .string()
      .regex(/^(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\/\d{4}$/i)
      .optional(),
    periodo_inicio: z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
      .optional(),
    periodo_fim: z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
      .optional(),
  })
  .strict();

export const kpiFiltersSchema = dashboardFiltersSchema
  .extend({
    top_n: z.number().int().min(1).optional(),
  })
  .strict();

export const alertsFiltersSchema = z
  .object({
    numero_cliente: z.string().trim().min(1).optional(),
    mes_referencia: z
      .string()
      .regex(/^(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\/\d{4}$/i)
      .optional(),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
  })
  .strict();

export type InvoiceFiltersInput = z.input<typeof invoiceFiltersSchema>;
export type InvoiceFilters = z.infer<typeof invoiceFiltersSchema>;
export type DashboardFiltersInput = z.input<typeof dashboardFiltersSchema>;
export type DashboardFilters = z.infer<typeof dashboardFiltersSchema>;
export type KpiFiltersInput = z.input<typeof kpiFiltersSchema>;
export type KpiFilters = z.infer<typeof kpiFiltersSchema>;
export type AlertsFiltersInput = z.input<typeof alertsFiltersSchema>;
export type AlertsFilters = z.infer<typeof alertsFiltersSchema>;
