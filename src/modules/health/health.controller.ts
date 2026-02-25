import { Controller, Get, Req } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RequestWithId } from '../../common/logging/request-id.middleware';
import { HealthService } from './health.service';

@Controller()
@ApiTags('Health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Informacoes basicas da API e endpoints de operacao' })
  @ApiOkResponse({ description: 'Metadados da API retornados com sucesso' })
  root(@Req() req: RequestWithId) {
    return this.healthService.getApiInfo(req.requestId);
  }

  @Get('health/liveness')
  @ApiOperation({ summary: 'Healthcheck de liveness da aplicacao' })
  @ApiOkResponse({ description: 'Aplicacao viva' })
  liveness(@Req() req: RequestWithId) {
    return this.healthService.getLiveness(req.requestId);
  }

  @Get('health/readiness')
  @ApiOperation({ summary: 'Healthcheck de readiness (dependencias criticas)' })
  @ApiOkResponse({ description: 'Servico pronto para receber trafego' })
  @ApiServiceUnavailableResponse({ description: 'Servico nao pronto (dependencia indisponivel)' })
  readiness(@Req() req: RequestWithId) {
    return this.healthService.getReadiness(req.requestId);
  }
}
