import { DefaultTariffEstimatorProvider } from '../../../src/modules/tariff-readiness/providers/default-tariff.provider';

describe('DefaultTariffEstimatorProvider', () => {
  const provider = new DefaultTariffEstimatorProvider();

  it('uses multiplier from plan metadata when numeric', async () => {
    const result = await provider.estimate(
      { valorTotalSemGd: 100 } as any,
      { name: 'Qualquer', metadata: { multiplier: 0.8 } } as any,
    );

    expect(result.estimatedCostRs).toBe(80);
    expect(result.details.multiplier).toBe(0.8);
  });

  it('falls back to branca multiplier when metadata multiplier is not numeric', async () => {
    const result = await provider.estimate(
      { valorTotalSemGd: 100 } as any,
      { name: 'Tarifa Branca', metadata: { multiplier: '0.7' } } as any,
    );

    expect(result.estimatedCostRs).toBe(92);
    expect(result.details.multiplier).toBe(0.92);
  });

  it('falls back to default multiplier 1 for non-branca plans', async () => {
    const result = await provider.estimate(
      { valorTotalSemGd: 100 } as any,
      { name: 'Convencional', metadata: null } as any,
    );

    expect(result.estimatedCostRs).toBe(100);
    expect(result.details.multiplier).toBe(1);
  });
});
