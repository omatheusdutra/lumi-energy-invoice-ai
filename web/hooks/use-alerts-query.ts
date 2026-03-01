'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchAlerts, type ApiError } from '@/lib/api/client';
import { type AlertsFiltersInput } from '@/lib/api/query-schemas';
import { queryKeys } from '@/lib/api/query-keys';

export function useAlertsQuery(filters: AlertsFiltersInput) {
  return useQuery({
    queryKey: queryKeys.alerts(filters),
    queryFn: ({ signal }) => fetchAlerts(filters, { signal }),
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
