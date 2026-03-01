import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import DashboardPage from '@/app/(routes)/dashboard/page';

vi.mock('@/components/dashboard/energy-chart', () => ({
  EnergyChart: () => <div data-testid="energy-chart">energy-chart</div>,
}));

vi.mock('@/components/dashboard/finance-chart', () => ({
  FinanceChart: () => <div data-testid="finance-chart">finance-chart</div>,
}));

vi.mock('@/hooks/use-dashboard-queries', () => ({
  useDashboardQueries: () => ({
    energyQuery: {
      data: {
        consumo_kwh_total: 300,
        energia_compensada_kwh_total: 120,
        series: [
          {
            mes_referencia: 'JAN/2024',
            consumo_kwh: 120,
            energia_compensada_kwh: 40,
          },
          {
            mes_referencia: 'FEV/2024',
            consumo_kwh: 180,
            energia_compensada_kwh: 80,
          },
        ],
      },
      isPending: false,
      isFetching: false,
      error: null,
      dataUpdatedAt: Date.parse('2026-02-28T03:00:00.000Z'),
      refetch: vi.fn(),
    },
    financialQuery: {
      data: {
        valor_total_sem_gd_total: 210,
        economia_gd_total: 80,
        series: [
          {
            mes_referencia: 'JAN/2024',
            valor_total_sem_gd: 80,
            economia_gd: 30,
          },
          {
            mes_referencia: 'FEV/2024',
            valor_total_sem_gd: 130,
            economia_gd: 50,
          },
        ],
      },
      isPending: false,
      isFetching: false,
      error: null,
      dataUpdatedAt: Date.parse('2026-02-28T03:00:00.000Z'),
      refetch: vi.fn(),
    },
    kpiQuery: {
      data: null,
      isPending: false,
      isFetching: false,
      error: null,
      dataUpdatedAt: 0,
      refetch: vi.fn(),
    },
  }),
}));

vi.mock('@/hooks/use-invoices-query', () => ({
  useInvoicesQuery: () => ({
    data: {
      data: [
        {
          id: '1fd22b96-c8ca-4a7c-a40b-ac94f9c25415',
          numeroCliente: '3001116735',
          mesReferencia: 'FEV/2024',
          mesReferenciaDate: '2024-02-01T00:00:00.000Z',
          energiaEletricaKwh: 120,
          energiaEletricaRs: 50,
          energiaSceeeKwh: 60,
          energiaSceeeRs: 30,
          energiaCompensadaGdiKwh: 80,
          energiaCompensadaGdiRs: 45,
          contribIlumRs: 20,
          consumoKwh: 180,
          energiaCompensadaKwh: 80,
          valorTotalSemGd: 100,
          economiaGdRs: 45,
          sourceFilename: 'invoice.pdf',
          hashSha256: 'abc',
          dedupCompositeKey: 'abc::3001116735::FEV/2024',
          createdAt: '2026-02-28T03:00:00.000Z',
        },
      ],
      page: 1,
      pageSize: 20,
      total: 1,
      totalPages: 1,
    },
    isPending: false,
    isFetching: false,
    error: null,
    dataUpdatedAt: Date.parse('2026-02-28T03:00:00.000Z'),
    refetch: vi.fn(),
  }),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

describe('DashboardPage', () => {
  it('renders strict KPI + chart + invoice table sections', () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>,
    );

    expect(
      screen.getByRole('heading', { name: /Energy Analytics Dashboard/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Consumo de Energia Elétrica/i)).toBeInTheDocument();
    expect(screen.getByText(/^Energia Compensada$/i)).toBeInTheDocument();
    expect(screen.getByTestId('energy-chart')).toBeInTheDocument();
    expect(screen.getByTestId('finance-chart')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Biblioteca de faturas/i })).toBeInTheDocument();
  });
});
