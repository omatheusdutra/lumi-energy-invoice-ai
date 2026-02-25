import { isPdfMimeType, validateUploadSize } from '../../../src/common/security/upload.validation';

describe('upload validation', () => {
  it('accepts only configured pdf mimetypes', () => {
    expect(isPdfMimeType('application/pdf')).toBe(true);
    expect(isPdfMimeType('application/x-pdf')).toBe(true);
    expect(isPdfMimeType('text/plain')).toBe(false);
  });

  it('validates upload size against max MB', () => {
    expect(validateUploadSize(10, 10 * 1024 * 1024)).toBe(true);
    expect(validateUploadSize(10, 10 * 1024 * 1024 + 1)).toBe(false);
  });
});
