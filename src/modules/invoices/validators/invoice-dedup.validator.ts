export function buildInvoiceDedupCompositeKey(
  hashSha256: string,
  numeroCliente: string,
  mesReferencia: string,
): string {
  return `${hashSha256}::${numeroCliente}::${mesReferencia}`;
}
