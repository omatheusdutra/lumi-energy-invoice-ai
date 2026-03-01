'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchInvoices, type ApiError } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import type { Invoice } from '@/lib/api/schemas';

const PAGE_SIZE = 100;
const MAX_PAGES = 25;

async function fetchInvoicesForUnits(signal?: AbortSignal): Promise<Invoice[]> {
  const firstPage = await fetchInvoices(
    {
      page: 1,
      pageSize: PAGE_SIZE,
    },
    { signal },
  );

  const allInvoices = [...firstPage.data];
  const totalPages = Math.min(firstPage.totalPages, MAX_PAGES);

  for (let page = 2; page <= totalPages; page += 1) {
    const nextPage = await fetchInvoices(
      {
        page,
        pageSize: PAGE_SIZE,
      },
      { signal },
    );

    allInvoices.push(...nextPage.data);
  }

  return allInvoices;
}

export function useUnitsQuery() {
  return useQuery({
    queryKey: [...queryKeys.invoicesRoot, 'units'],
    queryFn: ({ signal }) => fetchInvoicesForUnits(signal),
    staleTime: 45_000,
    gcTime: 10 * 60_000,
    retry: (count, error: ApiError) => {
      if ([0, 400, 404, 422].includes(error.status)) {
        return false;
      }
      return count < 2;
    },
  });
}
