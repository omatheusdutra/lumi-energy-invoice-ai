import { Invoice, TariffPlan } from '@prisma/client';

export interface TariffEstimateResult {
  estimatedCostRs: number;
  details: Record<string, unknown>;
}

export interface TariffEstimatorProvider {
  estimate(invoice: Invoice, plan: TariffPlan): Promise<TariffEstimateResult>;
}

export const TARIFF_ESTIMATOR_PROVIDER = Symbol('TARIFF_ESTIMATOR_PROVIDER');
