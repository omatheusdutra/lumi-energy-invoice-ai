import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { ListAlertsQueryDto } from './dto/list-alerts-query.dto';

@Controller('alerts')
@ApiTags('Alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @ApiOperation({ summary: 'Listagem paginada de alertas de anomalia por cliente/mes' })
  @ApiOkResponse({ description: 'Alertas retornados com sucesso' })
  @ApiBadRequestResponse({ description: 'Parametros de filtro/paginacao invalidos' })
  @ApiNotFoundResponse({ description: 'Feature de alertas desabilitada' })
  async listAlerts(@Query() query: ListAlertsQueryDto) {
    return this.alertsService.listAlerts(query);
  }
}
