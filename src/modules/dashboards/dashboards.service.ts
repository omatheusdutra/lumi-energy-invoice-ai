import { Injectable } from '@nestjs/common';
import { InvoicesService } from '../invoices/invoices.service';
import { DashboardQueryDto } from '../invoices/dto/dashboard-query.dto';
import { KpiQueryDto } from '../invoices/dto/kpi-query.dto';
import { EnergiaDashboardResponse } from './dto/energia-dashboard.response';
import { FinanceiroDashboardResponse } from './dto/financeiro-dashboard.response';

@Injectable()
export class DashboardsService {
  constructor(private readonly invoicesService: InvoicesService) {}

  async getEnergyDashboard(query: DashboardQueryDto): Promise<EnergiaDashboardResponse> {
    return this.invoicesService.getEnergyDashboard(query);
  }

  async getFinancialDashboard(query: DashboardQueryDto): Promise<FinanceiroDashboardResponse> {
    return this.invoicesService.getFinancialDashboard(query);
  }

  async getKpisDashboard(query: KpiQueryDto) {
    return this.invoicesService.getKpisDashboard(query);
  }
}
