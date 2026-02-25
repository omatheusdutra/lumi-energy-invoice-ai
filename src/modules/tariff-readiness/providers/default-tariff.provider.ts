import { Injectable } from '@nestjs/common';
import { Invoice, TariffPlan } from '@prisma/client';
import { roundToTwo } from '../../../common/utils/numbers';
import {
  type TariffEstimateResult,
  type TariffEstimatorProvider,
} from './tariff-estimator.interface';

@Injectable()
export class DefaultTariffEstimatorProvider implements TariffEstimatorProvider {
  async estimate(invoice: Invoice, plan: TariffPlan): Promise<TariffEstimateResult> {
    const metadata = (plan.metadata ?? {}) as Record<string, unknown>;
    const multiplierFromMetadata =
      typeof metadata.multiplier === 'number' ? metadata.multiplier : undefined;

    const multiplier =
      multiplierFromMetadata ?? (plan.name.toLowerCase().includes('branca') ? 0.92 : 1);

    const estimatedCostRs = roundToTwo(invoice.valorTotalSemGd * multiplier);

    return {
      estimatedCostRs,
      details: {
        strategy: 'stub-multiplier',
        multiplier,
      },
    };
  }
}
