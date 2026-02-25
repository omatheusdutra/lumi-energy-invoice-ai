import { Controller, Get, Header } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PROMETHEUS_CONTENT_TYPE } from '../../common/metrics/metrics.registry';
import { MetricsService } from './metrics.service';

@Controller()
@ApiTags('Metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('metrics')
  @Header('Content-Type', PROMETHEUS_CONTENT_TYPE)
  @ApiOperation({ summary: 'Exposicao de metricas Prometheus' })
  @ApiOkResponse({ description: 'Metricas text/plain em formato Prometheus' })
  getMetrics(): string {
    return this.metricsService.render();
  }
}
