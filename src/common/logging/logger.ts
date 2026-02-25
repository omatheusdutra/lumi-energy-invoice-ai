import { env } from '../config/env';
import { createAppLogger } from './pino.config';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface StructuredLog {
  level: LogLevel;
  type: string;
  [key: string]: unknown;
}

const appLogger = createAppLogger();
const shouldEmitAppLogs = env.NODE_ENV !== 'test' || process.env.TEST_LOGGING_ENABLED === 'true';

export function log(payload: StructuredLog): void {
  if (!shouldEmitAppLogs) {
    return;
  }

  switch (payload.level) {
    case 'debug':
      appLogger.debug(payload);
      return;
    case 'warn':
      appLogger.warn(payload);
      return;
    case 'error':
      appLogger.error(payload);
      return;
    case 'info':
    default:
      appLogger.info(payload);
  }
}
