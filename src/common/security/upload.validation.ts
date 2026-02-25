export function isPdfMimeType(mimetype: string): boolean {
  return ['application/pdf', 'application/x-pdf'].includes(mimetype);
}

export function validateUploadSize(maxMb: number, bytes: number): boolean {
  return bytes <= maxMb * 1024 * 1024;
}
