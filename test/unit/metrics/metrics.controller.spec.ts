import { MetricsController } from '../../../src/modules/metrics/metrics.controller';

describe('MetricsController', () => {
  it('returns metrics text from service', () => {
    const render = jest.fn(() => '# HELP metric');
    const controller = new MetricsController({ render } as any);

    const output = controller.getMetrics();

    expect(output).toBe('# HELP metric');
    expect(render).toHaveBeenCalledTimes(1);
  });
});
