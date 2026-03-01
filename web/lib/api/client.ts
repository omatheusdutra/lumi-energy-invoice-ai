import {
  alertsResponseSchema,
  energyDashboardSchema,
  financialDashboardSchema,
  kpiDashboardSchema,
  listInvoicesResponseSchema,
} from '@/lib/api/schemas';
import { ApiError } from '@/lib/api/api-error';
import { requestWithSchema } from '@/lib/api/http-client';
import {
  alertsFiltersSchema,
  dashboardFiltersSchema,
  invoiceFiltersSchema,
  kpiFiltersSchema,
  type AlertsFiltersInput,
  type DashboardFiltersInput,
  type InvoiceFiltersInput,
  type KpiFiltersInput,
} from '@/lib/api/query-schemas';

export { ApiError } from '@/lib/api/api-error';

interface RequestOptions {
  signal?: AbortSignal;
}

function toQueryString(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') {
      continue;
    }
    searchParams.set(key, String(value));
  }

  const queryString = searchParams.toString();
  return queryString.length > 0 ? `?${queryString}` : '';
}

function parseStrict<T>(schemaName: string, parse: (payload: unknown) => T) {
  return (payload: unknown): T => {
    try {
      return parse(payload);
    } catch (error) {
      throw new ApiError(`Invalid response schema for ${schemaName}`, 502, error);
    }
  };
}

export async function fetchInvoices(filters: InvoiceFiltersInput, options?: RequestOptions) {
  const query = invoiceFiltersSchema.parse(filters);

  return requestWithSchema(
    {
      method: 'GET',
      signal: options?.signal,
      url: `/invoices${toQueryString({
        numero_cliente: query.numero_cliente,
        mes_referencia: query.mes_referencia,
        periodo_inicio: query.periodo_inicio,
        periodo_fim: query.periodo_fim,
        page: query.page,
        pageSize: query.pageSize,
      })}`,
    },
    parseStrict('invoices', (payload) => listInvoicesResponseSchema.parse(payload)),
  );
}

export async function fetchEnergyDashboard(
  filters: DashboardFiltersInput,
  options?: RequestOptions,
) {
  const query = dashboardFiltersSchema.parse(filters);

  return requestWithSchema(
    {
      method: 'GET',
      signal: options?.signal,
      url: `/dashboard/energia${toQueryString({
        numero_cliente: query.numero_cliente,
        mes_referencia: query.mes_referencia,
        periodo_inicio: query.periodo_inicio,
        periodo_fim: query.periodo_fim,
      })}`,
    },
    parseStrict('dashboard/energia', (payload) => energyDashboardSchema.parse(payload)),
  );
}

export async function fetchFinancialDashboard(
  filters: DashboardFiltersInput,
  options?: RequestOptions,
) {
  const query = dashboardFiltersSchema.parse(filters);

  return requestWithSchema(
    {
      method: 'GET',
      signal: options?.signal,
      url: `/dashboard/financeiro${toQueryString({
        numero_cliente: query.numero_cliente,
        mes_referencia: query.mes_referencia,
        periodo_inicio: query.periodo_inicio,
        periodo_fim: query.periodo_fim,
      })}`,
    },
    parseStrict('dashboard/financeiro', (payload) => financialDashboardSchema.parse(payload)),
  );
}

export async function fetchKpiDashboard(filters: KpiFiltersInput, options?: RequestOptions) {
  const query = kpiFiltersSchema.parse(filters);

  return requestWithSchema(
    {
      method: 'GET',
      signal: options?.signal,
      url: `/dashboard/kpis${toQueryString({
        numero_cliente: query.numero_cliente,
        mes_referencia: query.mes_referencia,
        periodo_inicio: query.periodo_inicio,
        periodo_fim: query.periodo_fim,
        top_n: query.top_n,
      })}`,
    },
    parseStrict('dashboard/kpis', (payload) => kpiDashboardSchema.parse(payload)),
  );
}

export async function fetchAlerts(filters: AlertsFiltersInput, options?: RequestOptions) {
  const query = alertsFiltersSchema.parse(filters);

  return requestWithSchema(
    {
      method: 'GET',
      signal: options?.signal,
      url: `/alerts${toQueryString({
        numero_cliente: query.numero_cliente,
        mes_referencia: query.mes_referencia,
        page: query.page,
        pageSize: query.pageSize,
      })}`,
    },
    parseStrict('alerts', (payload) => alertsResponseSchema.parse(payload)),
  );
}
