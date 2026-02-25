import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { throttlerConfig } from './common/security/throttler.config';
import { LoggerModule } from 'nestjs-pino';
import { DashboardsModule } from './modules/dashboards/dashboards.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { HealthModule } from './modules/health/health.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { TariffReadinessModule } from './modules/tariff-readiness/tariff-readiness.module';
import { PrismaModule } from './prisma/prisma.module';
import { pinoLoggerModuleConfig } from './common/logging/pino.config';
import { HttpLoggingInterceptor } from './common/logging/http-logging.interceptor';
import { HttpExceptionFilter } from './common/http/http-exception.filter';
import { StartupBannerService } from './common/banner/startup-banner.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot(pinoLoggerModuleConfig),
    ThrottlerModule.forRoot(throttlerConfig),
    PrismaModule,
    HealthModule,
    MetricsModule,
    TariffReadinessModule,
    DashboardsModule,
    InvoicesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    HttpLoggingInterceptor,
    HttpExceptionFilter,
    StartupBannerService,
  ],
})
export class AppModule {}
