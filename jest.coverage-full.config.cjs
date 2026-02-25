const baseConfig = require('./jest.config.json');

const fullCoverageFiles = [
  ...baseConfig.collectCoverageFrom,
  'src/modules/alerts/alerts.controller.ts',
  'src/modules/dashboards/dashboards.controller.ts',
  'src/modules/health/health.controller.ts',
  'src/modules/metrics/metrics.controller.ts',
  'src/modules/tariff-readiness/tariff-readiness.controller.ts',
];

const { coverageThreshold, ...rest } = baseConfig;

module.exports = {
  ...rest,
  collectCoverageFrom: [...new Set(fullCoverageFiles)],
  coverageDirectory: './coverage-full',
};
