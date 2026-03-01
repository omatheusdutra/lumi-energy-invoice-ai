import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  NEXT_PUBLIC_APP_NAME: z.string().default('Lumi Portal'),
  NEXT_PUBLIC_ENABLE_EXPERIMENTAL_DASHBOARD: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  NEXT_PUBLIC_ENABLE_RENDER_PROFILING: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_ENABLE_EXPERIMENTAL_DASHBOARD: process.env.NEXT_PUBLIC_ENABLE_EXPERIMENTAL_DASHBOARD,
  NEXT_PUBLIC_ENABLE_RENDER_PROFILING: process.env.NEXT_PUBLIC_ENABLE_RENDER_PROFILING,
});

if (!parsed.success) {
  throw new Error(`Invalid web env configuration: ${parsed.error.message}`);
}

export const webEnv = parsed.data;
