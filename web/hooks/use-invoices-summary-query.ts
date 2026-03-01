'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchInvoices, type ApiError } from '@/lib/api/client';
import { type DashboardFiltersInput } from '@/lib/api/query-schemas';
import { queryKeys } from '@/lib/api/query-keys';

export function useInvoicesSummaryQuery(filters: DashboardFiltersInput) {
  return useQuery({
    queryKey: queryKeys.invoicesSummary(filters),
    queryFn: ({ signal }) =>
      fetchInvoices(
        {
          numero_cliente: filters.numero_cliente,
          mes_referencia: filters.mes_referencia,
          periodo_inicio: filters.periodo_inicio,
          periodo_fim: filters.periodo_fim,
          page: 1,
          pageSize: 100,
        },
        { signal },
      ),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    retry: (count, error: ApiError) => {
      if (error.status === 0 || error.status === 404) {
        return false;
      }
      return count < 2;
    },
  });
}
