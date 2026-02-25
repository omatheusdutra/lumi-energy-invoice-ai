export const PROMETHEUS_CONTENT_TYPE = 'text/plain; version=0.0.4; charset=utf-8';

export type InvoiceProcessingStage = 'upload' | 'llm_extract' | 'db_persist';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD' | 'OTHER';

type Labels = Record<string, string>;

interface RenderableMetric {
  render(): string;
  reset(): void;
}

class CounterMetric implements RenderableMetric {
  private readonly series = new Map<string, number>();

  constructor(
    private readonly name: string,
    private readonly help: string,
    private readonly labelNames: string[],
  ) {}

  init(labels: Labels): void {
    const key = this.seriesKey(labels);
    if (!this.series.has(key)) {
      this.series.set(key, 0);
    }
  }

  inc(labels: Labels, value = 1): void {
    const key = this.seriesKey(labels);
    const current = this.series.get(key) ?? 0;
    this.series.set(key, current + value);
  }

  render(): string {
    const lines: string[] = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} counter`];

    const ordered = [...this.series.entries()].sort(([left], [right]) => left.localeCompare(right));
    for (const [key, value] of ordered) {
      const labels = key.length > 0 ? `{${key}}` : '';
      lines.push(`${this.name}${labels} ${value}`);
    }

    return lines.join('\n');
  }

  reset(): void {
    this.series.clear();
  }

  private seriesKey(labels: Labels): string {
    return this.serializeLabels(labels, this.labelNames);
  }

  private serializeLabels(labels: Labels, labelNames: string[]): string {
    return labelNames
      .map((labelName) => `${labelName}="${escapeLabelValue(labels[labelName] ?? '')}"`)
      .join(',');
  }
}

class HistogramMetric implements RenderableMetric {
  private readonly series = new Map<
    string,
    { bucketCounts: number[]; sum: number; count: number }
  >();

  constructor(
    private readonly name: string,
    private readonly help: string,
    private readonly labelNames: string[],
    private readonly buckets: number[],
  ) {}

  init(labels: Labels): void {
    const key = this.seriesKey(labels);
    if (!this.series.has(key)) {
      this.series.set(key, {
        bucketCounts: this.buckets.map(() => 0),
        sum: 0,
        count: 0,
      });
    }
  }

  observe(labels: Labels, value: number): void {
    const key = this.seriesKey(labels);
    const current = this.series.get(key) ?? {
      bucketCounts: this.buckets.map(() => 0),
      sum: 0,
      count: 0,
    };

    for (let index = 0; index < this.buckets.length; index += 1) {
      const bucket = this.buckets[index];
      if (bucket !== undefined && value <= bucket) {
        const previousCount = current.bucketCounts[index] ?? 0;
        current.bucketCounts[index] = previousCount + 1;
      }
    }

    current.sum += value;
    current.count += 1;

    this.series.set(key, current);
  }

  render(): string {
    const lines: string[] = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} histogram`];

    const ordered = [...this.series.entries()].sort(([left], [right]) => left.localeCompare(right));

    for (const [labelsKey, values] of ordered) {
      for (let index = 0; index < this.buckets.length; index += 1) {
        const bucket = this.buckets[index];
        const count = values.bucketCounts[index] ?? 0;
        lines.push(`${this.name}_bucket{${labelsKey},le="${bucketToString(bucket)}"} ${count}`);
      }

      lines.push(`${this.name}_bucket{${labelsKey},le="+Inf"} ${values.count}`);
      lines.push(`${this.name}_sum{${labelsKey}} ${values.sum}`);
      lines.push(`${this.name}_count{${labelsKey}} ${values.count}`);
    }

    return lines.join('\n');
  }

  reset(): void {
    this.series.clear();
  }

  private seriesKey(labels: Labels): string {
    return this.serializeLabels(labels, this.labelNames);
  }

  private serializeLabels(labels: Labels, labelNames: string[]): string {
    return labelNames
      .map((labelName) => `${labelName}="${escapeLabelValue(labels[labelName] ?? '')}"`)
      .join(',');
  }
}

class MetricsRegistry {
  private readonly stageTotal = new CounterMetric(
    'invoice_processing_stage_total',
    'Total de execucoes por etapa do pipeline de faturas',
    ['stage', 'result'],
  );

  private readonly stageErrors = new CounterMetric(
    'invoice_processing_stage_errors_total',
    'Total de erros por etapa do pipeline de faturas',
    ['stage', 'error_type'],
  );

  private readonly stageDuration = new HistogramMetric(
    'invoice_processing_stage_duration_seconds',
    'Latencia por etapa do pipeline de faturas em segundos',
    ['stage'],
    [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 20],
  );

  private readonly httpRequestsTotal = new CounterMetric(
    'http_server_requests_total',
    'Total de requests HTTP por metodo, rota e status',
    ['method', 'route', 'status_code'],
  );

  private readonly httpRequestDuration = new HistogramMetric(
    'http_server_request_duration_seconds',
    'Latencia de requests HTTP por metodo, rota e status em segundos',
    ['method', 'route', 'status_code'],
    [0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
  );

  private readonly allMetrics: RenderableMetric[] = [
    this.stageTotal,
    this.stageErrors,
    this.stageDuration,
    this.httpRequestsTotal,
    this.httpRequestDuration,
  ];

  constructor() {
    this.initDefaultSeries();
  }

  recordStageSuccess(stage: InvoiceProcessingStage, durationMs: number): void {
    this.stageTotal.inc({ stage, result: 'success' });
    this.stageDuration.observe({ stage }, millisToSeconds(durationMs));
  }

  recordStageError(stage: InvoiceProcessingStage, durationMs: number, errorType: string): void {
    this.stageTotal.inc({ stage, result: 'error' });
    this.stageErrors.inc({ stage, error_type: errorType });
    this.stageDuration.observe({ stage }, millisToSeconds(durationMs));
  }

  recordHttpRequest(
    method: HttpMethod,
    route: string,
    statusCode: number,
    durationMs: number,
  ): void {
    const normalizedRoute = route.trim().length > 0 ? route : 'unknown';
    const labels = {
      method,
      route: normalizedRoute,
      status_code: `${statusCode}`,
    };
    this.httpRequestsTotal.inc(labels);
    this.httpRequestDuration.observe(labels, millisToSeconds(durationMs));
  }

  render(): string {
    return `${this.allMetrics.map((metric) => metric.render()).join('\n\n')}\n`;
  }

  reset(): void {
    for (const metric of this.allMetrics) {
      metric.reset();
    }
    this.initDefaultSeries();
  }

  private initDefaultSeries(): void {
    const stages: InvoiceProcessingStage[] = ['upload', 'llm_extract', 'db_persist'];

    for (const stage of stages) {
      this.stageTotal.init({ stage, result: 'success' });
      this.stageTotal.init({ stage, result: 'error' });
      this.stageDuration.init({ stage });
    }

    const methods: HttpMethod[] = [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
      'HEAD',
      'OTHER',
    ];
    for (const method of methods) {
      this.httpRequestsTotal.init({ method, route: 'unknown', status_code: '200' });
      this.httpRequestDuration.init({ method, route: 'unknown', status_code: '200' });
    }
  }
}

function escapeLabelValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"');
}

function bucketToString(bucket: number | undefined): string {
  if (bucket === undefined) {
    return '0';
  }
  return Number.isInteger(bucket) ? `${bucket}` : bucket.toString();
}

function millisToSeconds(valueInMs: number): number {
  return Math.max(valueInMs, 0) / 1000;
}

const metricsRegistry = new MetricsRegistry();

export function recordInvoiceStageSuccess(stage: InvoiceProcessingStage, durationMs: number): void {
  metricsRegistry.recordStageSuccess(stage, durationMs);
}

export function recordInvoiceStageError(
  stage: InvoiceProcessingStage,
  durationMs: number,
  errorType: string,
): void {
  metricsRegistry.recordStageError(stage, durationMs, errorType);
}

export function recordHttpRequest(
  method: HttpMethod,
  route: string,
  statusCode: number,
  durationMs: number,
): void {
  metricsRegistry.recordHttpRequest(method, route, statusCode, durationMs);
}

export function renderPrometheusMetrics(): string {
  return metricsRegistry.render();
}

export function resetPrometheusMetricsForTests(): void {
  metricsRegistry.reset();
}
