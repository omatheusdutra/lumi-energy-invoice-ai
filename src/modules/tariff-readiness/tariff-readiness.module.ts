import { Module } from '@nestjs/common';
import { TariffReadinessController } from './tariff-readiness.controller';
import { TariffReadinessService } from './tariff-readiness.service';
import { DefaultTariffEstimatorProvider } from './providers/default-tariff.provider';
import { TARIFF_ESTIMATOR_PROVIDER } from './providers/tariff-estimator.interface';

@Module({
  controllers: [TariffReadinessController],
  providers: [
    TariffReadinessService,
    {
      provide: TARIFF_ESTIMATOR_PROVIDER,
      useClass: DefaultTariffEstimatorProvider,
    },
  ],
})
export class TariffReadinessModule {}
