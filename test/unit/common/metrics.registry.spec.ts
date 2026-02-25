import {
  recordHttpRequest,
  recordInvoiceStageError,
  recordInvoiceStageSuccess,
  renderPrometheusMetrics,
  resetPrometheusMetricsForTests,
} from '../../../src/common/metrics/metrics.registry';

describe('metrics registry', () => {
  beforeEach(() => {
    resetPrometheusMetricsForTests();
  });

  it('renders stage counters and histogram in prometheus format', () => {
    recordInvoiceStageSuccess('upload', 120);
    recordInvoiceStageError('llm_extract', 2500, 'bad_gateway');
    recordInvoiceStageSuccess('db_persist', 80);

    const output = renderPrometheusMetrics();

    expect(output).toContain('# HELP invoice_processing_stage_total');
    expect(output).toContain('invoice_processing_stage_total{stage="upload",result="success"} 1');
    expect(output).toContain(
      'invoice_processing_stage_total{stage="llm_extract",result="error"} 1',
    );
    expect(output).toContain(
      'invoice_processing_stage_errors_total{stage="llm_extract",error_type="bad_gateway"} 1',
    );
    expect(output).toContain(
      'invoice_processing_stage_duration_seconds_count{stage="db_persist"} 1',
    );
  });

  it('renders http request metrics by method, route and status', () => {
    recordHttpRequest('GET', '/health/liveness', 200, 12);
    recordHttpRequest('POST', '/invoices/upload', 422, 35);

    const output = renderPrometheusMetrics();

    expect(output).toContain('# HELP http_server_requests_total');
    expect(output).toContain(
      'http_server_requests_total{method="GET",route="/health/liveness",status_code="200"} 1',
    );
    expect(output).toContain(
      'http_server_requests_total{method="POST",route="/invoices/upload",status_code="422"} 1',
    );
    expect(output).toContain(
      'http_server_request_duration_seconds_count{method="GET",route="/health/liveness",status_code="200"} 1',
    );
  });
});
