import { parseMoney } from '../../../src/common/utils/money';

describe('money utils', () => {
  it('parses and rounds money strings', () => {
    expect(parseMoney('1.999,995')).toBe(2000);
    expect(parseMoney('10,10')).toBe(10.1);
  });
});
