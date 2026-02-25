import { assertPdfFileSignature } from '../../../src/common/security/file-signature';

describe('file signature', () => {
  it('accepts valid PDF header', () => {
    expect(() => assertPdfFileSignature(Buffer.from('%PDF-1.4', 'utf8'))).not.toThrow();
  });

  it('rejects buffer shorter than signature length', () => {
    expect(() => assertPdfFileSignature(Buffer.from('%PD', 'utf8'))).toThrow();
  });

  it('rejects invalid file header', () => {
    expect(() => assertPdfFileSignature(Buffer.from('plain text', 'utf8'))).toThrow();
  });
});
