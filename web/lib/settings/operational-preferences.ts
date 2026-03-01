import { z } from 'zod';
import { dashboardFiltersSchema, type DashboardFilters } from '@/lib/api/query-schemas';

export const OPERATIONAL_PREFERENCES_STORAGE_KEY = 'lumi.operational.preferences.v1';

const periodRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
const clientRegex = /^\d{1,20}$/;

export const operationalPreferencesSchema = z
  .object({
    profileName: z.string().trim().min(2).max(48),
    defaultClientNumber: z.string().trim().regex(clientRegex).optional(),
    defaultPeriodStart: z.string().regex(periodRegex).optional(),
    defaultPeriodEnd: z.string().regex(periodRegex).optional(),
    autoRefreshEnabled: z.boolean(),
    autoRefreshIntervalSec: z.number().int().min(30).max(600),
    uploadPreviewHoldSec: z.number().int().min(3).max(30),
    autoApplyDashboardFilters: z.boolean(),
    highlightAnomalies: z.boolean(),
    compensationTargetPercent: z.number().min(20).max(100),
    consumptionSpikePercent: z.number().min(5).max(80),
    economyDropPercent: z.number().min(5).max(80),
    insightMode: z.enum(['balanced', 'aggressive', 'conservative']),
    updatedAtIso: z.string().datetime(),
  })
  .strict();

export type OperationalPreferences = z.infer<typeof operationalPreferencesSchema>;

export function createDefaultOperationalPreferences(): OperationalPreferences {
  return {
    profileName: 'Operação principal',
    defaultClientNumber: '3001116735',
    defaultPeriodStart: '2024-01',
    defaultPeriodEnd: '2024-12',
    autoRefreshEnabled: true,
    autoRefreshIntervalSec: 60,
    uploadPreviewHoldSec: 8,
    autoApplyDashboardFilters: true,
    highlightAnomalies: true,
    compensationTargetPercent: 65,
    consumptionSpikePercent: 18,
    economyDropPercent: 12,
    insightMode: 'balanced',
    updatedAtIso: new Date().toISOString(),
  };
}

function mergeWithDefaults(raw: unknown): OperationalPreferences {
  const defaults = createDefaultOperationalPreferences();
  const parsed = operationalPreferencesSchema.safeParse(raw);
  if (parsed.success) {
    return parsed.data;
  }

  if (typeof raw === 'object' && raw !== null) {
    const candidate = { ...defaults, ...raw };
    const merged = operationalPreferencesSchema.safeParse(candidate);
    if (merged.success) {
      return merged.data;
    }
  }

  return defaults;
}

export function loadOperationalPreferences(): OperationalPreferences {
  if (typeof window === 'undefined') {
    return createDefaultOperationalPreferences();
  }

  const stored = window.localStorage.getItem(OPERATIONAL_PREFERENCES_STORAGE_KEY);
  if (!stored) {
    return createDefaultOperationalPreferences();
  }

  try {
    const raw = JSON.parse(stored) as unknown;
    return mergeWithDefaults(raw);
  } catch {
    return createDefaultOperationalPreferences();
  }
}

export function saveOperationalPreferences(input: OperationalPreferences): OperationalPreferences {
  const normalized = operationalPreferencesSchema.parse({
    ...input,
    updatedAtIso: new Date().toISOString(),
  });

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(OPERATIONAL_PREFERENCES_STORAGE_KEY, JSON.stringify(normalized));
  }

  return normalized;
}

export function toDashboardDefaults(preferences: OperationalPreferences): DashboardFilters {
  return dashboardFiltersSchema.parse({
    numero_cliente: preferences.defaultClientNumber,
    periodo_inicio: preferences.defaultPeriodStart,
    periodo_fim: preferences.defaultPeriodEnd,
  });
}
