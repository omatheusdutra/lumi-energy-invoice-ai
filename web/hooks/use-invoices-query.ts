'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchInvoices, type ApiError } from '@/lib/api/client';
import { type InvoiceFiltersInput } from '@/lib/api/query-schemas';
import { queryKeys } from '@/lib/api/query-keys';

export function createInvoicesQueryKey(filters: InvoiceFiltersInput) {
  return queryKeys.invoices(filters);
}

export function useInvoicesQuery(filters: InvoiceFiltersInput) {
  return useQuery({
    queryKey: createInvoicesQueryKey(filters),
    queryFn: ({ signal }) => fetchInvoices(filters, { signal }),
    placeholderData: keepPreviousData,
    staleTime: 45_000,
    gcTime: 10 * 60_000,
    retry: (count, error: ApiError) => {
      if ([0, 400, 404, 422].includes(error.status)) {
        return false;
      }
      return count < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1_000 * 2 ** attemptIndex, 8_000),
  });
}
