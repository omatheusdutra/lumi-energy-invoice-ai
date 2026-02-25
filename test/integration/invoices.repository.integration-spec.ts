import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { mesReferenciaToDate } from '../../src/common/utils/dates';
import { InvoiceCreateInput } from '../../src/modules/invoices/invoice.types';
import { InvoicesRepository } from '../../src/modules/invoices/invoices.repository';
import { PrismaService } from '../../src/prisma/prisma.service';

process.env.DATABASE_URL ??=
  'postgresql://postgres:postgres@localhost:5432/lumi?schema=public&connect_timeout=3';
jest.setTimeout(20000);

describe('InvoicesRepository (integration)', () => {
  let prisma: PrismaService;
  let repository: InvoicesRepository;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    repository = new InvoicesRepository(prisma);
  });

  beforeEach(async () => {
    await prisma.tariffSimulation.deleteMany();
    await prisma.invoiceProcessing.deleteMany();
    await prisma.alert.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.tariffPlan.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('enforces dedup by hash and composite key and supports lookups', async () => {
    const base = buildInvoiceInput({
      numeroCliente: '3001116735',
      mesReferencia: 'SET/2024',
      hashSha256: `hash-${randomUUID()}`,
    });

    const created = await repository.create(base);

    const byHash = await repository.findByHash(base.hashSha256);
    expect(byHash?.id).toBe(created.id);

    const byComposite = await repository.findByDedupCompositeKey(base.dedupCompositeKey);
    expect(byComposite?.id).toBe(created.id);

    await expect(
      repository.create({
        ...buildInvoiceInput({
          numeroCliente: '3001116735',
          mesReferencia: 'OUT/2024',
          hashSha256: base.hashSha256,
        }),
        dedupCompositeKey: `other::${randomUUID()}`,
      }),
    ).rejects.toMatchObject({
      code: 'P2002',
    } satisfies Partial<Prisma.PrismaClientKnownRequestError>);

    await expect(
      repository.create({
        ...buildInvoiceInput({
          numeroCliente: '3001116735',
          mesReferencia: 'OUT/2024',
          hashSha256: `hash-${randomUUID()}`,
        }),
        dedupCompositeKey: base.dedupCompositeKey,
      }),
    ).rejects.toMatchObject({
      code: 'P2002',
    } satisfies Partial<Prisma.PrismaClientKnownRequestError>);
  });

  it('aggregates energy and financial totals with client/month filters', async () => {
    await repository.create(
      buildInvoiceInput({
        numeroCliente: '3001116735',
        mesReferencia: 'SET/2024',
        energiaEletricaKwh: 100,
        energiaSceeeKwh: 20,
        energiaCompensadaGdiKwh: 30,
        energiaEletricaRs: 50,
        energiaSceeeRs: 10,
        contribIlumRs: 5,
        energiaCompensadaGdiRs: 15,
      }),
    );
    await repository.create(
      buildInvoiceInput({
        numeroCliente: '3001116735',
        mesReferencia: 'OUT/2024',
        energiaEletricaKwh: 80,
        energiaSceeeKwh: 10,
        energiaCompensadaGdiKwh: 12,
        energiaEletricaRs: 40,
        energiaSceeeRs: 8,
        contribIlumRs: 4,
        energiaCompensadaGdiRs: 10,
      }),
    );
    await repository.create(
      buildInvoiceInput({
        numeroCliente: '3001422762',
        mesReferencia: 'OUT/2024',
        energiaEletricaKwh: 70,
        energiaSceeeKwh: 5,
        energiaCompensadaGdiKwh: 8,
        energiaEletricaRs: 35,
        energiaSceeeRs: 4,
        contribIlumRs: 2,
        energiaCompensadaGdiRs: 6,
      }),
    );

    const energyClientA = await repository.aggregateEnergy({ numeroCliente: '3001116735' });
    expect(energyClientA.consumoKwhTotal).toBe(210);
    expect(energyClientA.energiaCompensadaKwhTotal).toBe(42);
    expect(energyClientA.series).toEqual([
      { mesReferencia: 'SET/2024', consumoKwh: 120, energiaCompensadaKwh: 30 },
      { mesReferencia: 'OUT/2024', consumoKwh: 90, energiaCompensadaKwh: 12 },
    ]);

    const financialOut = await repository.aggregateFinancial({ mesReferencia: 'OUT/2024' });
    expect(financialOut.valorTotalSemGdTotal).toBe(93);
    expect(financialOut.economiaGdTotal).toBe(16);
    expect(financialOut.series).toEqual([
      { mesReferencia: 'OUT/2024', valorTotalSemGd: 93, economiaGd: 16 },
    ]);
  });
});

function buildInvoiceInput(input: {
  numeroCliente: string;
  mesReferencia: string;
  hashSha256?: string;
  energiaEletricaKwh?: number;
  energiaEletricaRs?: number;
  energiaSceeeKwh?: number;
  energiaSceeeRs?: number;
  energiaCompensadaGdiKwh?: number;
  energiaCompensadaGdiRs?: number;
  contribIlumRs?: number;
}): InvoiceCreateInput {
  const energiaEletricaKwh = input.energiaEletricaKwh ?? 100;
  const energiaEletricaRs = input.energiaEletricaRs ?? 50;
  const energiaSceeeKwh = input.energiaSceeeKwh ?? 20;
  const energiaSceeeRs = input.energiaSceeeRs ?? 10;
  const energiaCompensadaGdiKwh = input.energiaCompensadaGdiKwh ?? 30;
  const energiaCompensadaGdiRs = input.energiaCompensadaGdiRs ?? 15;
  const contribIlumRs = input.contribIlumRs ?? 5;
  const hashSha256 = input.hashSha256 ?? `hash-${randomUUID()}`;

  return {
    numeroCliente: input.numeroCliente,
    mesReferencia: input.mesReferencia,
    mesReferenciaDate: mesReferenciaToDate(input.mesReferencia),
    energiaEletricaKwh,
    energiaEletricaRs,
    energiaSceeeKwh,
    energiaSceeeRs,
    energiaCompensadaGdiKwh,
    energiaCompensadaGdiRs,
    contribIlumRs,
    consumoKwh: energiaEletricaKwh + energiaSceeeKwh,
    energiaCompensadaKwh: energiaCompensadaGdiKwh,
    valorTotalSemGd: energiaEletricaRs + energiaSceeeRs + contribIlumRs,
    economiaGdRs: energiaCompensadaGdiRs,
    sourceFilename: `${input.numeroCliente}-${input.mesReferencia}.pdf`,
    hashSha256,
    dedupCompositeKey: `${hashSha256}::${input.numeroCliente}::${input.mesReferencia}`,
  };
}
