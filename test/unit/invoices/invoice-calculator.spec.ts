import { calculateDerivedValues } from '../../../src/modules/invoices/mappers/invoice-calculator';

describe('invoice-calculator', () => {
  it('should calculate derived values based on extracted values', () => {
    const derived = calculateDerivedValues({
      numeroCliente: '123456',
      mesReferencia: 'SET/2024',
      mesReferenciaDate: new Date('2024-09-01T00:00:00.000Z'),
      energiaEletricaKwh: 100,
      energiaEletricaRs: 50,
      energiaSceeeKwh: 20,
      energiaSceeeRs: 10,
      energiaCompensadaGdiKwh: 30,
      energiaCompensadaGdiRs: 12.5,
      contribIlumRs: 5,
    });

    expect(derived).toEqual({
      consumoKwh: 120,
      energiaCompensadaKwh: 30,
      valorTotalSemGd: 65,
      economiaGdRs: 12.5,
    });
  });
});
