import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InvoicesTable } from '@/components/invoices/invoices-table';

describe('InvoicesTable', () => {
  it('renders invoice rows and values', () => {
    render(
      <InvoicesTable
        response={{
          data: [
            {
              id: 'f80e1afc-0727-4e1e-8ffd-f9000b0f9ae4',
              numeroCliente: '3001116735',
              mesReferencia: 'SET/2024',
              mesReferenciaDate: '2024-09-01T00:00:00.000Z',
              energiaEletricaKwh: 120,
              energiaEletricaRs: 88.7,
              energiaSceeeKwh: 30,
              energiaSceeeRs: 22.1,
              energiaCompensadaGdiKwh: 45,
              energiaCompensadaGdiRs: 30,
              contribIlumRs: 7.5,
              consumoKwh: 150,
              energiaCompensadaKwh: 45,
              valorTotalSemGd: 118.3,
              economiaGdRs: 30,
              sourceFilename: 'invoice.pdf',
              hashSha256: 'abc',
              dedupCompositeKey: 'abc::3001116735::SET/2024',
              createdAt: '2026-02-25T00:00:00.000Z',
            },
          ],
          page: 1,
          pageSize: 20,
          total: 1,
          totalPages: 1,
        }}
      />,
    );

    expect(
      screen.getByRole('table', { name: /Tabela de faturas de energia/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('3001116735')).toBeInTheDocument();
    expect(screen.getByText('SET/2024')).toBeInTheDocument();
  });
});
