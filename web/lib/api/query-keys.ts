import type {
  AlertsFiltersInput,
  DashboardFiltersInput,
  InvoiceFiltersInput,
} from '@/lib/api/query-schemas';

function normalizeInvoiceFilters(filters: InvoiceFiltersInput) {
  return [
    filters.numero_cliente ?? '',
    filters.mes_referencia ?? '',
    filters.periodo_inicio ?? '',
    filters.periodo_fim ?? '',
    filters.page ?? 1,
    filters.pageSize ?? 20,
  ] as const;
}

function normalizeDashboardFilters(filters: DashboardFiltersInput) {
  return [
    filters.numero_cliente ?? '',
    filters.mes_referencia ?? '',
    filters.periodo_inicio ?? '',
    filters.periodo_fim ?? '',
  ] as const;
}

function normalizeAlertsFilters(filters: AlertsFiltersInput) {
  return [
    filters.numero_cliente ?? '',
    filters.mes_referencia ?? '',
    filters.page ?? 1,
    filters.pageSize ?? 20,
  ] as const;
}

export const queryKeys = {
  invoicesRoot: ['invoices'] as const,
  invoices: (filters: InvoiceFiltersInput) =>
    ['invoices', ...normalizeInvoiceFilters(filters)] as const,
  invoice: (id: string) => ['invoice', id] as const,

  dashboardRoot: ['dashboard'] as const,
  dashboard: (filters: DashboardFiltersInput) =>
    ['dashboard', ...normalizeDashboardFilters(filters)] as const,
  dashboardEnergy: (filters: DashboardFiltersInput) =>
    ['dashboard', 'energia', ...normalizeDashboardFilters(filters)] as const,

  financialSummaryRoot: ['financial-summary'] as const,
  financialSummary: (filters: DashboardFiltersInput) =>
    ['financial-summary', ...normalizeDashboardFilters(filters)] as const,

  alertsRoot: ['alerts'] as const,
  alerts: (filters: AlertsFiltersInput) => ['alerts', ...normalizeAlertsFilters(filters)] as const,

  invoicesSummaryRoot: ['invoices-summary'] as const,
  invoicesSummary: (filters: DashboardFiltersInput) =>
    ['invoices-summary', ...normalizeDashboardFilters(filters)] as const,
};
