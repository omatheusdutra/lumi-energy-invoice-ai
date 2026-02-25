import { z } from 'zod';
import { APP_DEFAULTS } from './constants';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_NAME: z.string().min(1).default(APP_DEFAULTS.APP_NAME),
  PORT: z.coerce.number().int().positive().default(APP_DEFAULTS.PORT),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default(APP_DEFAULTS.LOG_LEVEL),
  LOG_FORMAT: z.enum(['json', 'pretty']).optional(),
  DATABASE_URL: z
    .string()
    .min(1)
    .default('postgresql://postgres:postgres@localhost:5432/lumi?schema=public'),
  OPENAI_API_KEY: z.string().min(1).default('test-key'),
  OPENAI_BASE_URL: z.string().trim().optional(),
  OPENAI_MODEL: z.string().min(1).default(APP_DEFAULTS.OPENAI_MODEL),
  OPENAI_TIMEOUT_MS: z.coerce.number().int().positive().default(APP_DEFAULTS.OPENAI_TIMEOUT_MS),
  OPENAI_MAX_RETRIES: z.coerce
    .number()
    .int()
    .min(0)
    .max(5)
    .default(APP_DEFAULTS.OPENAI_MAX_RETRIES),
  LLM_CIRCUIT_BREAKER_ENABLED: z.coerce.boolean().default(APP_DEFAULTS.LLM_CIRCUIT_BREAKER_ENABLED),
  LLM_CIRCUIT_BREAKER_FAILURE_THRESHOLD: z.coerce
    .number()
    .int()
    .min(1)
    .default(APP_DEFAULTS.LLM_CIRCUIT_BREAKER_FAILURE_THRESHOLD),
  LLM_CIRCUIT_BREAKER_COOLDOWN_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(APP_DEFAULTS.LLM_CIRCUIT_BREAKER_COOLDOWN_MS),
  UPLOAD_MAX_MB: z.coerce.number().int().min(1).max(25).default(APP_DEFAULTS.UPLOAD_MAX_MB),
  JSON_BODY_LIMIT_MB: z.coerce
    .number()
    .int()
    .min(1)
    .max(10)
    .default(APP_DEFAULTS.JSON_BODY_LIMIT_MB),
  URLENCODED_BODY_LIMIT_MB: z.coerce
    .number()
    .int()
    .min(1)
    .max(10)
    .default(APP_DEFAULTS.URLENCODED_BODY_LIMIT_MB),
  CORS_ORIGIN: z.string().default(APP_DEFAULTS.CORS_ORIGIN),
  RATE_LIMIT_TTL: z.coerce.number().int().positive().default(APP_DEFAULTS.RATE_LIMIT_TTL),
  RATE_LIMIT_LIMIT: z.coerce.number().int().positive().default(APP_DEFAULTS.RATE_LIMIT_LIMIT),
  TRUST_PROXY: z.coerce.boolean().default(APP_DEFAULTS.TRUST_PROXY),
  HEALTHCHECK_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(APP_DEFAULTS.HEALTHCHECK_TIMEOUT_MS),
  MAX_PAGE_SIZE: z.coerce.number().int().min(10).max(500).default(APP_DEFAULTS.MAX_PAGE_SIZE),
  FEATURE_DATA_QUALITY_ENABLED: z.coerce
    .boolean()
    .default(APP_DEFAULTS.FEATURE_DATA_QUALITY_ENABLED),
  FEATURE_ALERTS_ENABLED: z.coerce.boolean().default(APP_DEFAULTS.FEATURE_ALERTS_ENABLED),
  FEATURE_TARIFF_READINESS_ENABLED: z.coerce
    .boolean()
    .default(APP_DEFAULTS.FEATURE_TARIFF_READINESS_ENABLED),
  FEATURE_BENCHMARK_ENABLED: z.coerce.boolean().default(APP_DEFAULTS.FEATURE_BENCHMARK_ENABLED),
  ALERT_SPIKE_PERCENT_THRESHOLD: z.coerce
    .number()
    .min(5)
    .max(300)
    .default(APP_DEFAULTS.ALERT_SPIKE_PERCENT_THRESHOLD),
  ALERT_ZSCORE_THRESHOLD: z.coerce
    .number()
    .min(1)
    .max(10)
    .default(APP_DEFAULTS.ALERT_ZSCORE_THRESHOLD),
  ALERT_BASELINE_MIN_MONTHS: z.coerce
    .number()
    .int()
    .min(2)
    .max(12)
    .default(APP_DEFAULTS.ALERT_BASELINE_MIN_MONTHS),
  KPI_TOP_N_DEFAULT: z.coerce.number().int().min(1).max(50).default(APP_DEFAULTS.KPI_TOP_N_DEFAULT),
  RAW_LLM_AUDIT_TTL_DAYS: z.coerce
    .number()
    .int()
    .min(1)
    .max(3650)
    .default(APP_DEFAULTS.RAW_LLM_AUDIT_TTL_DAYS),
});

export type AppEnv = z.infer<typeof envSchema>;
