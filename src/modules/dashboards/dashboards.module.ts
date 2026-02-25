import { Module } from '@nestjs/common';
import { InvoicesModule } from '../invoices/invoices.module';
import { DashboardsController } from './dashboards.controller';
import { DashboardsService } from './dashboards.service';

@Module({
  imports: [InvoicesModule],
  controllers: [DashboardsController],
  providers: [DashboardsService],
})
export class DashboardsModule {}
