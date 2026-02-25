import { Injectable } from '@nestjs/common';
import { renderPrometheusMetrics } from '../../common/metrics/metrics.registry';

@Injectable()
export class MetricsService {
  render(): string {
    return renderPrometheusMetrics();
  }
}
