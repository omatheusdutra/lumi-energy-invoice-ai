import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UploadPanel } from '@/components/upload/upload-panel';
import { queryKeys } from '@/lib/api/query-keys';
import * as uploadApi from '@/lib/api/upload';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

function createClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

describe('UploadPanel', () => {
  it('triggers upload when a file is selected', async () => {
    const uploadSpy = vi.spyOn(uploadApi, 'uploadInvoice').mockResolvedValueOnce({
      id: '1',
      numeroCliente: '3001116735',
      mesReferencia: 'JAN/2024',
      mesReferenciaDate: '2024-01-01T00:00:00.000Z',
      energiaEletricaKwh: 100,
      energiaEletricaRs: 80,
      energiaSceeeKwh: 10,
      energiaSceeeRs: 8,
      energiaCompensadaGdiKwh: 20,
      energiaCompensadaGdiRs: 15,
      contribIlumRs: 5,
      consumoKwh: 110,
      energiaCompensadaKwh: 20,
      valorTotalSemGd: 93,
      economiaGdRs: 15,
      sourceFilename: 'invoice.pdf',
      hashSha256: 'hash',
      dedupCompositeKey: 'hash::3001116735::JAN/2024',
      createdAt: '2026-02-27T00:00:00.000Z',
    });

    const queryClient = createClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <UploadPanel />
      </QueryClientProvider>,
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['%PDF-test'], 'fatura.pdf', { type: 'application/pdf' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(uploadSpy).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(setQueryDataSpy).toHaveBeenCalled());
    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.invoicesRoot,
      }),
    );
    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.dashboardRoot,
      }),
    );

    expect(uploadSpy).toHaveBeenCalledWith(
      file,
      expect.objectContaining({ onProgress: expect.any(Function) }),
    );

    uploadSpy.mockRestore();
    invalidateSpy.mockRestore();
    setQueryDataSpy.mockRestore();
  });
});
