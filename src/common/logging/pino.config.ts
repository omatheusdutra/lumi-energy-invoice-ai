import { randomUUID } from 'crypto';
import pino, { type LoggerOptions, type TransportSingleOptions } from 'pino';
import type { Params } from 'nestjs-pino';
import { env } from '../config/env';

type RequestWithOptionalId = {
  id?: unknown;
  headers?: Record<string, string | string[] | undefined>;
};

type ResponseWithHeaderSetter = {
  setHeader: (name: string, value: string) => void;
};

function resolveTransport(): TransportSingleOptions | undefined {
  if (env.LOG_FORMAT !== 'pretty') {
    return undefined;
  }

  return {
    target: 'pino-pretty',
    options: {
      colorize: process.stdout.isTTY,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      singleLine: true,
    },
  };
}

function parseRequestIdHeader(req: RequestWithOptionalId): string | undefined {
  const value = req.headers?.['x-request-id'];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function generateRequestId(req: RequestWithOptionalId, res: ResponseWithHeaderSetter): string {
  const headerRequestId = parseRequestIdHeader(req)?.trim();
  const existingId =
    typeof req.id === 'string' || typeof req.id === 'number' ? String(req.id) : undefined;
  const requestId =
    headerRequestId && headerRequestId.length > 0
      ? headerRequestId
      : existingId && existingId.length > 0
        ? existingId
        : randomUUID();
  req.id = requestId;
  res.setHeader('x-request-id', requestId);
  return requestId;
}

function baseLoggerOptions(): LoggerOptions {
  const level =
    env.NODE_ENV === 'test' && process.env.TEST_LOGGING_ENABLED !== 'true'
      ? 'silent'
      : env.LOG_LEVEL;

  return {
    level,
    transport: resolveTransport(),
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
    },
    base: env.LOG_FORMAT === 'pretty' ? undefined : { service: env.APP_NAME },
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
      censor: '[Redacted]',
    },
  };
}

export function createAppLogger(): pino.Logger {
  return pino(baseLoggerOptions());
}

export const pinoLoggerModuleConfig: Params = {
  pinoHttp: {
    ...baseLoggerOptions(),
    autoLogging: false,
    genReqId: generateRequestId,
    customProps: (req) => {
      const requestId = (req as RequestWithOptionalId).id;
      return typeof requestId === 'string' || typeof requestId === 'number'
        ? { requestId: String(requestId) }
        : {};
    },
  },
};
