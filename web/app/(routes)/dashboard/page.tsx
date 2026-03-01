'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { HandHeart } from 'lucide-react';
import { DashboardInvoicesTable } from '@/components/dashboard/dashboard-invoices-table';
import { EmptyState } from '@/components/dashboard/empty-state';
import { EnergyChart } from '@/components/dashboard/energy-chart';
import { ErrorState } from '@/components/dashboard/error-state';
import { FiltersBar, type DashboardFilterDraft } from '@/components/dashboard/filters-bar';
import { FinanceChart } from '@/components/dashboard/finance-chart';
import { KpiGrid } from '@/components/dashboard/kpi-grid';
import { LoadingSkeleton } from '@/components/dashboard/loading-skeleton';
import { InlineAlert } from '@/components/ui/inline-alert';
import { useDashboardQueries } from '@/hooks/use-dashboard-queries';
import { useInvoicesQuery } from '@/hooks/use-invoices-query';
import { fetchEnergyDashboard, fetchFinancialDashboard, fetchInvoices } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import { dashboardFiltersSchema, invoiceFiltersSchema } from '@/lib/api/query-schemas';
import { buildDashboardDto, type DashboardDTO } from '@/lib/dashboard/dashboard-dto';

const DEFAULT_PAGE_SIZE = 20;

const EMPTY_DRAFT: DashboardFilterDraft = {
  numero_cliente: '',
  mes_referencia: '',
  periodo_inicio: '',
  periodo_fim: '',
};

function normalizeOptional(value: string): string | undefined {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function toFilterCandidate(draft: DashboardFilterDraft) {
  return {
    numero_cliente: normalizeOptional(draft.numero_cliente),
    mes_referencia: normalizeOptional(draft.mes_referencia),
    periodo_inicio: normalizeOptional(draft.periodo_inicio),
    periodo_fim: normalizeOptional(draft.periodo_fim),
  };
}

function toDraft(filters: ReturnType<typeof dashboardFiltersSchema.parse>): DashboardFilterDraft {
  return {
    numero_cliente: filters.numero_cliente ?? '',
    mes_referencia: filters.mes_referencia ?? '',
    periodo_inicio: filters.periodo_inicio ?? '',
    periodo_fim: filters.periodo_fim ?? '',
  };
}

function errorMessageOf(error: unknown): string | null {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }
  return null;
}

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<DashboardFilterDraft>(EMPTY_DRAFT);
  const [filters, setFilters] = useState(() => dashboardFiltersSchema.parse({}));
  const [page, setPage] = useState(1);
  const [filterError, setFilterError] = useState<string | null>(null);

  const invoiceFilters = useMemo(
    () =>
      invoiceFiltersSchema.parse({
        numero_cliente: filters.numero_cliente,
        mes_referencia: filters.mes_referencia,
        periodo_inicio: filters.periodo_inicio,
        periodo_fim: filters.periodo_fim,
        page,
        pageSize: DEFAULT_PAGE_SIZE,
      }),
    [filters, page],
  );

  const { energyQuery, financialQuery } = useDashboardQueries(filters, {
    includeKpi: false,
  });
  const invoicesQuery = useInvoicesQuery(invoiceFilters);

  useEffect(() => {
    const parsed = dashboardFiltersSchema.safeParse(toFilterCandidate(draft));
    if (!parsed.success) {
      return;
    }

    const prefetchFilters = parsed.data;
    const prefetchInvoiceFilters = invoiceFiltersSchema.parse({
      numero_cliente: prefetchFilters.numero_cliente,
      mes_referencia: prefetchFilters.mes_referencia,
      periodo_inicio: prefetchFilters.periodo_inicio,
      periodo_fim: prefetchFilters.periodo_fim,
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    });

    const timer = window.setTimeout(() => {
      void queryClient.prefetchQuery({
        queryKey: queryKeys.dashboardEnergy(prefetchFilters),
        queryFn: ({ signal }) => fetchEnergyDashboard(prefetchFilters, { signal }),
        staleTime: 60_000,
      });

      void queryClient.prefetchQuery({
        queryKey: queryKeys.financialSummary(prefetchFilters),
        queryFn: ({ signal }) => fetchFinancialDashboard(prefetchFilters, { signal }),
        staleTime: 60_000,
      });

      void queryClient.prefetchQuery({
        queryKey: queryKeys.invoices(prefetchInvoiceFilters),
        queryFn: ({ signal }) => fetchInvoices(prefetchInvoiceFilters, { signal }),
        staleTime: 45_000,
      });
    }, 320);

    return () => window.clearTimeout(timer);
  }, [draft, queryClient]);

  const isInitialLoading =
    (!energyQuery.data || !financialQuery.data || !invoicesQuery.data) &&
    (energyQuery.isPending || financialQuery.isPending || invoicesQuery.isPending);

  const isRefreshing =
    energyQuery.isFetching || financialQuery.isFetching || invoicesQuery.isFetching;

  const queryError =
    errorMessageOf(energyQuery.error) ??
    errorMessageOf(financialQuery.error) ??
    errorMessageOf(invoicesQuery.error);

  const dtoResult = useMemo<{ data: DashboardDTO | null; error: string | null }>(() => {
    if (!energyQuery.data || !financialQuery.data) {
      return { data: null, error: null };
    }

    try {
      const lastUpdated = Math.max(
        energyQuery.dataUpdatedAt,
        financialQuery.dataUpdatedAt,
        invoicesQuery.dataUpdatedAt,
      );

      return {
        data: buildDashboardDto({
          energy: energyQuery.data,
          financial: financialQuery.data,
          filters,
          updatedAt: lastUpdated,
        }),
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error ? error.message : 'Não foi possível compor o modelo da dashboard.',
      };
    }
  }, [
    energyQuery.data,
    energyQuery.dataUpdatedAt,
    filters,
    financialQuery.data,
    financialQuery.dataUpdatedAt,
    invoicesQuery.dataUpdatedAt,
  ]);

  const lastUpdatedLabel = useMemo(() => {
    if (!dtoResult.data?.meta.updatedAt) {
      return '--';
    }

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(new Date(dtoResult.data.meta.updatedAt));
  }, [dtoResult.data?.meta.updatedAt]);

  const hasAnyData = useMemo(() => {
    if (!dtoResult.data) {
      return false;
    }

    const hasSeries =
      dtoResult.data.series_energy.length > 0 || dtoResult.data.series_finance.length > 0;
    const hasInvoices = (invoicesQuery.data?.total ?? 0) > 0;

    return hasSeries || hasInvoices;
  }, [dtoResult.data, invoicesQuery.data?.total]);

  const refreshAll = useCallback(async () => {
    await Promise.all([energyQuery.refetch(), financialQuery.refetch(), invoicesQuery.refetch()]);
  }, [energyQuery, financialQuery, invoicesQuery]);

  const applyFilters = useCallback(() => {
    const parsed = dashboardFiltersSchema.safeParse(toFilterCandidate(draft));
    if (!parsed.success) {
      setFilterError(
        'Revise o formato dos filtros: mês referência (MMM/YYYY) e período (YYYY-MM).',
      );
      return;
    }

    setFilterError(null);
    setPage(1);
    setFilters(parsed.data);
  }, [draft]);

  const clearFilters = useCallback(() => {
    const clean = dashboardFiltersSchema.parse({});
    setFilterError(null);
    setDraft(EMPTY_DRAFT);
    setFilters(clean);
    setPage(1);
  }, []);

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-[var(--font-heading)] text-[1.56rem] font-semibold tracking-tight text-[#062a53] md:text-[1.75rem]">
          Energy Analytics Dashboard
        </h1>
        <p className="text-sm font-medium text-slate-500">
          Dashboard &gt; Energy Analytics Dashboard
        </p>
        <p className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50/60 px-3 py-1 text-xs font-medium text-sky-700">
          <HandHeart className="h-3.5 w-3.5" aria-hidden="true" />
          Impacto com propósito: eficiência energética e economia real, sem extrapolar métricas.
        </p>
      </header>

      <FiltersBar
        value={draft}
        onChange={(field, value) => setDraft((previous) => ({ ...previous, [field]: value }))}
        onApply={applyFilters}
        onClear={clearFilters}
        onRefresh={() => void refreshAll()}
        isRefreshing={isRefreshing}
        lastUpdatedLabel={lastUpdatedLabel}
      />

      {filterError ? (
        <InlineAlert
          variant="danger"
          title="Formato de filtro inválido"
          description={filterError}
        />
      ) : null}

      {isInitialLoading ? <LoadingSkeleton /> : null}

      {!isInitialLoading && (queryError || dtoResult.error) ? (
        <ErrorState
          message={queryError ?? dtoResult.error ?? 'Erro inesperado no carregamento.'}
          onRetry={() => void refreshAll()}
        />
      ) : null}

      {!isInitialLoading && !queryError && !dtoResult.error && dtoResult.data && !hasAnyData ? (
        <EmptyState onReset={clearFilters} />
      ) : null}

      {!isInitialLoading && !queryError && !dtoResult.error && dtoResult.data && hasAnyData ? (
        <>
          <KpiGrid items={dtoResult.data.kpis} />

          <section className="grid gap-6 xl:grid-cols-2">
            <EnergyChart data={dtoResult.data.series_energy} />
            <FinanceChart data={dtoResult.data.series_finance} />
          </section>

          {invoicesQuery.data ? (
            <DashboardInvoicesTable
              response={invoicesQuery.data}
              isFetching={invoicesQuery.isFetching}
              onPageChange={setPage}
            />
          ) : null}
        </>
      ) : null}
    </section>
  );
}
