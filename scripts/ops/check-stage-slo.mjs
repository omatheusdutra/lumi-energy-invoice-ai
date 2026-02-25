const baseUrl = (process.env.BASE_URL ?? '').trim().replace(/\/$/, '');
if (!baseUrl) {
  process.stderr.write('[slo] BASE_URL is required\n');
  process.exit(1);
}

const thresholds = {
  llm_extract: Number(process.env.SLO_MAX_ERROR_RATE_LLM_EXTRACT ?? '0.05'),
  db_persist: Number(process.env.SLO_MAX_ERROR_RATE_DB_PERSIST ?? '0.02'),
};

const minSamples = Number(process.env.SLO_MIN_STAGE_SAMPLES ?? '1');

function parseLabels(labelsSegment) {
  const labels = {};
  for (const pair of labelsSegment.split(',')) {
    const [rawKey, rawValue] = pair.split('=');
    if (!rawKey || !rawValue) {
      continue;
    }
    labels[rawKey.trim()] = rawValue.trim().replace(/^"|"$/g, '');
  }
  return labels;
}

function parseStageTotals(metricsText) {
  const stageTotals = {};
  const lines = metricsText.split('\n');

  for (const line of lines) {
    const match = line.match(/^invoice_processing_stage_total\{(.+)\}\s+([0-9eE+.-]+)$/);
    if (!match) {
      continue;
    }
    const labels = parseLabels(match[1]);
    const stage = labels.stage;
    const result = labels.result;
    const value = Number(match[2]);
    if (!stage || !result || !Number.isFinite(value)) {
      continue;
    }

    const current = stageTotals[stage] ?? { success: 0, error: 0 };
    if (result === 'success') {
      current.success = value;
    }
    if (result === 'error') {
      current.error = value;
    }
    stageTotals[stage] = current;
  }

  return stageTotals;
}

async function main() {
  const response = await fetch(`${baseUrl}/metrics`);
  if (!response.ok) {
    throw new Error(`failed to fetch metrics: status ${response.status}`);
  }

  const metricsText = await response.text();
  const totals = parseStageTotals(metricsText);

  let hasViolation = false;

  for (const [stage, threshold] of Object.entries(thresholds)) {
    const stageData = totals[stage] ?? { success: 0, error: 0 };
    const total = stageData.success + stageData.error;

    if (total < minSamples) {
      process.stdout.write(`[slo] stage=${stage} skipped (samples=${total}, min=${minSamples})\n`);
      continue;
    }

    const errorRate = total > 0 ? stageData.error / total : 0;
    process.stdout.write(
      `[slo] stage=${stage} success=${stageData.success} error=${stageData.error} error_rate=${errorRate.toFixed(4)} threshold=${threshold.toFixed(4)}\n`,
    );

    if (errorRate > threshold) {
      hasViolation = true;
      process.stderr.write(
        `::error::[slo] violation for stage=${stage}, error_rate=${errorRate.toFixed(4)} > threshold=${threshold.toFixed(4)}\n`,
      );
    }
  }

  if (hasViolation) {
    process.exit(1);
  }
}

main().catch((error) => {
  process.stderr.write(`[slo] failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
