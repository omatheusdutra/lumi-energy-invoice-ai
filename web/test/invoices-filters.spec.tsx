import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InvoicesFilters } from '@/components/invoices/invoices-filters';

describe('InvoicesFilters', () => {
  it('synchronizes local form state when parent defaultValues change', () => {
    const onSubmit = vi.fn();
    const onClear = vi.fn();

    const { rerender } = render(
      <InvoicesFilters
        defaultValues={{ numero_cliente: '3001116735', mes_referencia: 'JAN/2024' }}
        onSubmit={onSubmit}
        onClear={onClear}
      />,
    );

    const clientInput = screen.getByLabelText(/filtro por número de cliente/i);
    expect(clientInput).toHaveValue('3001116735');

    rerender(
      <InvoicesFilters
        defaultValues={{ numero_cliente: '3001422762', mes_referencia: 'FEV/2024' }}
        onSubmit={onSubmit}
        onClear={onClear}
      />,
    );

    expect(screen.getByLabelText(/filtro por número de cliente/i)).toHaveValue('3001422762');
    expect(screen.getByLabelText(/filtro por mês de referência/i)).toHaveValue('FEV/2024');
  });

  it('submits current filter values', () => {
    const onSubmit = vi.fn();

    render(<InvoicesFilters defaultValues={{}} onSubmit={onSubmit} onClear={() => undefined} />);

    fireEvent.change(screen.getByLabelText(/filtro por número de cliente/i), {
      target: { value: '3001116735' },
    });
    fireEvent.change(screen.getByLabelText(/filtro por mês de referência/i), {
      target: { value: 'SET/2024' },
    });

    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        numero_cliente: '3001116735',
        mes_referencia: 'SET/2024',
      }),
    );
  });
});
