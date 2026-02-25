import 'dotenv/config';
import { envSchema } from './env.schema';

const parsedEnv = envSchema.parse(process.env);
const logFormat = parsedEnv.LOG_FORMAT ?? (parsedEnv.NODE_ENV === 'production' ? 'json' : 'pretty');
const resolvedEnv = { ...parsedEnv, LOG_FORMAT: logFormat };

if (resolvedEnv.NODE_ENV === 'production') {
  if (resolvedEnv.OPENAI_API_KEY === 'test-key') {
    throw new Error('OPENAI_API_KEY must be explicitly configured in production');
  }

  if (resolvedEnv.DATABASE_URL.includes('localhost')) {
    throw new Error('DATABASE_URL must not target localhost in production');
  }
}

export const env = resolvedEnv;
export type AppEnv = typeof env;
