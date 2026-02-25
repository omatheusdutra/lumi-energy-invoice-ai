import { parseLocaleNumber, roundToTwo } from './numbers';

export function parseMoney(value: string | number | null | undefined): number {
  return roundToTwo(parseLocaleNumber(value));
}
