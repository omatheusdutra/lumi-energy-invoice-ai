import { env } from '../config/env';

export const throttlerConfig = [
  {
    ttl: env.RATE_LIMIT_TTL,
    limit: env.RATE_LIMIT_LIMIT,
  },
];
