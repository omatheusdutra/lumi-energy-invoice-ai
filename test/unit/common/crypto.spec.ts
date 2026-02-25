import { createHash } from 'crypto';
import { sha256 } from '../../../src/common/utils/crypto';

describe('crypto utils', () => {
  it('generates sha256 for string input', () => {
    const expected = createHash('sha256').update('abc').digest('hex');
    expect(sha256('abc')).toBe(expected);
  });

  it('generates sha256 for buffer input', () => {
    const input = Buffer.from('buffer-value', 'utf8');
    const expected = createHash('sha256').update(input).digest('hex');
    expect(sha256(input)).toBe(expected);
  });
});
