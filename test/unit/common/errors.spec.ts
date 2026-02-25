import { toErrorMessage } from '../../../src/common/utils/errors';

describe('errors utils', () => {
  it('returns error.message for Error instances', () => {
    expect(toErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('returns fallback for non-error values', () => {
    expect(toErrorMessage('bad', 'fallback')).toBe('fallback');
    expect(toErrorMessage(undefined)).toBe('Unknown error');
  });
});
