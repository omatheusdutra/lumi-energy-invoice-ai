import { createHash } from 'crypto';

export function sha256(input: Buffer | string): string {
  return createHash('sha256').update(input).digest('hex');
}
