import { describe, expect, it } from 'vitest';
import { invoiceSchema, listInvoicesResponseSchema } from '@/lib/api/schemas';

describe('API schemas', () => {
  it('validates invoice payload', () => {
    const payload = {
      id: 'f80e1afc-0727-4e1e-8ffd-f9000b0f9ae4',
      numeroCliente: '3001116735',
      mesReferencia: 'SET/2024',
      mesReferenciaDate: '2024-09-01T00:00:00.000Z',
      energiaEletricaKwh: 120,
      energiaEletricaRs: 88.7,
      energiaSceeeKwh: 30,
      energiaSceeeRs: 22.1,
      energiaCompensadaGdiKwh: 45,
      energiaCompensadaGdiRs: 30,
      contribIlumRs: 7.5,
      consumoKwh: 150,
      energiaCompensadaKwh: 45,
      valorTotalSemGd: 118.3,
      economiaGdRs: 30,
      sourceFilename: 'invoice.pdf',
      hashSha256: 'abc',
      dedupCompositeKey: 'abc::3001116735::SET/2024',
      createdAt: '2026-02-25T00:00:00.000Z',
    };

    expect(invoiceSchema.parse(payload)).toEqual(payload);
  });

  it('rejects extra properties in strict schemas', () => {
    const payload = {
      data: [],
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 1,
      extra: 'not-allowed',
    };

    expect(() => listInvoicesResponseSchema.parse(payload)).toThrow();
  });
});
