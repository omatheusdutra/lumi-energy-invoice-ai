'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  fetchEnergyDashboard,
  fetchFinancialDashboard,
  fetchKpiDashboard,
  type ApiError,
} from '@/lib/api/client';
import { type DashboardFiltersInput } from '@/lib/api/query-schemas';
import { queryKeys } from '@/lib/api/query-keys';

interface UseDashboardQueriesOptions {
  includeKpi?: boolean;
}

function retryWithBackoff(count: number, error: ApiError) {
  if (error.status === 0 || [400, 404, 422].includes(error.status)) {
    return false;
  }
  return count < 2;
}

function retryDelay(attemptIndex: number) {
  return Math.min(1_000 * 2 ** attemptIndex, 8_000);
}

export function useDashboardQueries(
  filters: DashboardFiltersInput,
  options?: UseDashboardQueriesOptions,
) {
  const includeKpi = options?.includeKpi ?? true;

  const energyQuery = useQuery({
    queryKey: queryKeys.dashboardEnergy(filters),
    queryFn: ({ signal }) => fetchEnergyDashboard(filters, { signal }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    retry: retryWithBackoff,
    retryDelay,
  });

  const financialQuery = useQuery({
    queryKey: queryKeys.financialSummary(filters),
    queryFn: ({ signal }) => fetchFinancialDashboard(filters, { signal }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    retry: retryWithBackoff,
    retryDelay,
  });

  const kpiQuery = useQuery({
    queryKey: [...queryKeys.dashboard(filters), 'kpis'],
    queryFn: ({ signal }) => fetchKpiDashboard(filters, { signal }),
    enabled: includeKpi,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    retry: (count, error: ApiError) => {
      if (error.status === 0 || error.status === 404) {
        return false;
      }
      return count < 2;
    },
    retryDelay,
  });

  return {
    energyQuery,
    financialQuery,
    kpiQuery,
  };
}
