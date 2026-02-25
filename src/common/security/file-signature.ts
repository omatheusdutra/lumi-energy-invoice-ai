export function assertPdfFileSignature(buffer: Buffer): void {
  if (buffer.length < 5) {
    throw new Error('Invalid PDF file');
  }

  const signature = buffer.subarray(0, 5).toString('utf8');
  if (signature !== '%PDF-') {
    throw new Error('Invalid PDF file');
  }
}
