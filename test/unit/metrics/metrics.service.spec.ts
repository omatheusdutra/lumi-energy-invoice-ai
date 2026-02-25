describe('MetricsService', () => {
  it('renders prometheus metrics from registry', async () => {
    jest.resetModules();
    jest.doMock('../../../src/common/metrics/metrics.registry', () => ({
      renderPrometheusMetrics: jest.fn(() => 'prometheus-metrics-output'),
    }));

    const { MetricsService } = await import('../../../src/modules/metrics/metrics.service');
    const service = new MetricsService();

    expect(service.render()).toBe('prometheus-metrics-output');
  });
});
