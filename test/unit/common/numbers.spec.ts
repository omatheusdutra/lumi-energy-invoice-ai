import { parseLocaleNumber, roundToTwo } from '../../../src/common/utils/numbers';

describe('numbers utils', () => {
  it('parses pt-BR number strings', () => {
    expect(parseLocaleNumber('1.234,56')).toBeCloseTo(1234.56);
    expect(parseLocaleNumber('123')).toBe(123);
    expect(parseLocaleNumber('R$ 2.000,99')).toBeCloseTo(2000.99);
  });

  it('handles null/undefined/empty and invalid values safely', () => {
    expect(parseLocaleNumber(null)).toBe(0);
    expect(parseLocaleNumber(undefined)).toBe(0);
    expect(parseLocaleNumber('')).toBe(0);
    expect(parseLocaleNumber('abc')).toBe(0);
    expect(parseLocaleNumber('-,')).toBe(0);
    expect(parseLocaleNumber('--')).toBe(0);
    expect(parseLocaleNumber(Number.NaN)).toBe(0);
    expect(parseLocaleNumber(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it('accepts numeric input and keeps finite values', () => {
    expect(parseLocaleNumber(12.34)).toBe(12.34);
  });

  it('rounds to two decimals', () => {
    expect(roundToTwo(10.129)).toBe(10.13);
    expect(roundToTwo(10.121)).toBe(10.12);
  });
});
