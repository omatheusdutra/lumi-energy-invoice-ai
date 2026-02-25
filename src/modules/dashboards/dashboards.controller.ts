import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { DashboardQueryDto } from '../invoices/dto/dashboard-query.dto';
import { KpiQueryDto } from '../invoices/dto/kpi-query.dto';
import { DashboardsService } from './dashboards.service';

@Controller('dashboard')
@ApiTags('Dashboards')
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Get('energia')
  @ApiOperation({ summary: 'Dashboard de energia (totais e serie temporal)' })
  @ApiOkResponse({ description: 'Agregados de energia calculados com sucesso' })
  @ApiBadRequestResponse({ description: 'Parametros de filtro invalidos' })
  async energyDashboard(@Query() query: DashboardQueryDto) {
    return this.dashboardsService.getEnergyDashboard(query);
  }

  @Get('financeiro')
  @ApiOperation({ summary: 'Dashboard financeiro (totais e serie temporal)' })
  @ApiOkResponse({ description: 'Agregados financeiros calculados com sucesso' })
  @ApiBadRequestResponse({ description: 'Parametros de filtro invalidos' })
  async financialDashboard(@Query() query: DashboardQueryDto) {
    return this.dashboardsService.getFinancialDashboard(query);
  }

  @Get('kpis')
  @ApiOperation({ summary: 'Dashboard de KPIs e benchmarking' })
  @ApiOkResponse({ description: 'KPIs retornados com sucesso' })
  @ApiBadRequestResponse({ description: 'Parametros de filtro invalidos' })
  @ApiNotFoundResponse({ description: 'Feature benchmark desabilitada' })
  async kpisDashboard(@Query() query: KpiQueryDto) {
    return this.dashboardsService.getKpisDashboard(query);
  }
}
