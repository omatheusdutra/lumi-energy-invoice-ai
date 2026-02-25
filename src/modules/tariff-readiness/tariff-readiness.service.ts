import { Inject, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { env } from '../../common/config/env';
import { roundToTwo } from '../../common/utils/numbers';
import { SimulateTariffDto } from './dto/simulate-tariff.dto';
import {
  type TariffEstimatorProvider,
  TARIFF_ESTIMATOR_PROVIDER,
} from './providers/tariff-estimator.interface';
@Injectable()
export class TariffReadinessService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(TARIFF_ESTIMATOR_PROVIDER)
    private readonly estimator: TariffEstimatorProvider,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!env.FEATURE_TARIFF_READINESS_ENABLED) {
      return;
    }

    await this.prisma.tariffPlan.upsert({
      where: { name: 'Convencional' },
      update: {
        isActive: true,
        provider: 'internal-stub',
      },
      create: {
        name: 'Convencional',
        provider: 'internal-stub',
        metadata: { multiplier: 1 },
      },
    });

    await this.prisma.tariffPlan.upsert({
      where: { name: 'Branca Simulada' },
      update: {
        isActive: true,
        provider: 'internal-stub',
      },
      create: {
        name: 'Branca Simulada',
        provider: 'internal-stub',
        metadata: { multiplier: 0.92 },
      },
    });
  }

  ensureEnabled(): void {
    if (!env.FEATURE_TARIFF_READINESS_ENABLED) {
      throw new NotFoundException('Feature tariff-readiness is disabled');
    }
  }

  async listPlans() {
    this.ensureEnabled();

    return this.prisma.tariffPlan.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async simulate(input: SimulateTariffDto) {
    this.ensureEnabled();

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: input.invoice_id },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const plan = await this.prisma.tariffPlan.findUnique({
      where: { id: input.tariff_plan_id },
    });

    if (!plan || !plan.isActive) {
      throw new NotFoundException('Tariff plan not found');
    }

    const estimate = await this.estimator.estimate(invoice, plan);
    const baselineCostRs = roundToTwo(invoice.valorTotalSemGd);
    const savingsRs = roundToTwo(baselineCostRs - estimate.estimatedCostRs);
    const savingsPercent = baselineCostRs > 0 ? roundToTwo((savingsRs / baselineCostRs) * 100) : 0;

    const simulation = await this.prisma.tariffSimulation.create({
      data: {
        invoiceId: invoice.id,
        tariffPlanId: plan.id,
        baselineCostRs,
        estimatedCostRs: estimate.estimatedCostRs,
        savingsRs,
        savingsPercent,
        details: estimate.details as Prisma.InputJsonValue,
      },
    });

    return {
      simulation_id: simulation.id,
      invoice_id: invoice.id,
      tariff_plan: {
        id: plan.id,
        name: plan.name,
      },
      baseline_cost_rs: baselineCostRs,
      estimated_cost_rs: estimate.estimatedCostRs,
      savings_rs: savingsRs,
      savings_percent: savingsPercent,
      details: estimate.details,
    };
  }
}
