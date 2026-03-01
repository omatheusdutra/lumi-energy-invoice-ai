import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InsightsPanel } from '@/components/dashboard/insights-panel';

describe('InsightsPanel', () => {
  it('renders fallback text when alerts are missing', () => {
    render(<InsightsPanel fallbackTrendPercent={12.5} fallbackEstimatedEconomy={180} />);

    expect(screen.getByText(/Nenhum alerta persistido disponível/i)).toBeInTheDocument();
    expect(screen.getByText(/12,5%/i)).toBeInTheDocument();
  });
});
