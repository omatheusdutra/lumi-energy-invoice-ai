import { Injectable } from '@nestjs/common';
import { Invoice, Prisma, ProcessingStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InvoiceCreateInput, InvoiceFilters, Pagination } from './invoice.types';

@Injectable()
export class InvoicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByHash(hashSha256: string): Promise<Invoice | null> {
    return this.prisma.invoice.findUnique({ where: { hashSha256 } });
  }

  async findByDedupCompositeKey(dedupCompositeKey: string): Promise<Invoice | null> {
    return this.prisma.invoice.findUnique({ where: { dedupCompositeKey } });
  }

  async findById(id: string): Promise<Invoice | null> {
    return this.prisma.invoice.findUnique({ where: { id } });
  }

  async create(data: InvoiceCreateInput): Promise<Invoice> {
    return this.prisma.invoice.create({ data });
  }

  async createWithProcessing(data: InvoiceCreateInput, processingId: string): Promise<Invoice> {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({ data });

      await tx.invoiceProcessing.update({
        where: { id: processingId },
        data: {
          status: ProcessingStatus.STORED,
          invoice: {
            connect: { id: invoice.id },
          },
          errorReason: null,
        },
      });

      return invoice;
    });
  }

  async list(
    filters: InvoiceFilters,
    pagination: Pagination,
  ): Promise<{ data: Invoice[]; total: number }> {
    const where = this.buildWhere(filters);
    const skip = (pagination.page - 1) * pagination.pageSize;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pagination.pageSize,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { data, total };
  }

  async findRecentByClientBeforeDate(
    numeroCliente: string,
    beforeDate: Date,
    months: number,
  ): Promise<Invoice[]> {
    return this.prisma.invoice.findMany({
      where: {
        numeroCliente,
        mesReferenciaDate: {
          lt: beforeDate,
        },
      },
      orderBy: {
        mesReferenciaDate: 'desc',
      },
      take: months,
    });
  }

  async aggregateEnergy(filters: InvoiceFilters): Promise<{
    consumoKwhTotal: number;
    energiaCompensadaKwhTotal: number;
    series: Array<{ mesReferencia: string; consumoKwh: number; energiaCompensadaKwh: number }>;
  }> {
    const where = this.buildWhere(filters);

    const [totals, grouped] = await this.prisma.$transaction([
      this.prisma.invoice.aggregate({
        where,
        _sum: {
          consumoKwh: true,
          energiaCompensadaKwh: true,
        },
      }),
      this.prisma.invoice.groupBy({
        where,
        by: ['mesReferencia', 'mesReferenciaDate'],
        _sum: {
          consumoKwh: true,
          energiaCompensadaKwh: true,
        },
        orderBy: {
          mesReferenciaDate: 'asc',
        },
      }),
    ]);

    return {
      consumoKwhTotal: totals._sum.consumoKwh ?? 0,
      energiaCompensadaKwhTotal: totals._sum.energiaCompensadaKwh ?? 0,
      series: grouped.map((item) => ({
        mesReferencia: item.mesReferencia,
        consumoKwh: item._sum?.consumoKwh ?? 0,
        energiaCompensadaKwh: item._sum?.energiaCompensadaKwh ?? 0,
      })),
    };
  }

  async aggregateFinancial(filters: InvoiceFilters): Promise<{
    valorTotalSemGdTotal: number;
    economiaGdTotal: number;
    series: Array<{ mesReferencia: string; valorTotalSemGd: number; economiaGd: number }>;
  }> {
    const where = this.buildWhere(filters);

    const [totals, grouped] = await this.prisma.$transaction([
      this.prisma.invoice.aggregate({
        where,
        _sum: {
          valorTotalSemGd: true,
          economiaGdRs: true,
        },
      }),
      this.prisma.invoice.groupBy({
        where,
        by: ['mesReferencia', 'mesReferenciaDate'],
        _sum: {
          valorTotalSemGd: true,
          economiaGdRs: true,
        },
        orderBy: {
          mesReferenciaDate: 'asc',
        },
      }),
    ]);

    return {
      valorTotalSemGdTotal: totals._sum.valorTotalSemGd ?? 0,
      economiaGdTotal: totals._sum.economiaGdRs ?? 0,
      series: grouped.map((item) => ({
        mesReferencia: item.mesReferencia,
        valorTotalSemGd: item._sum?.valorTotalSemGd ?? 0,
        economiaGd: item._sum?.economiaGdRs ?? 0,
      })),
    };
  }

  async aggregateBenchmark(filters: InvoiceFilters): Promise<{
    consumoKwhTotal: number;
    valorTotalSemGdTotal: number;
    economiaGdTotal: number;
    monthlySeries: Array<{
      mesReferencia: string;
      mesReferenciaDate: Date;
      consumoKwh: number;
      valorTotalSemGd: number;
      economiaGd: number;
    }>;
  }> {
    const where = this.buildWhere(filters);

    const [totals, grouped] = await this.prisma.$transaction([
      this.prisma.invoice.aggregate({
        where,
        _sum: {
          consumoKwh: true,
          valorTotalSemGd: true,
          economiaGdRs: true,
        },
      }),
      this.prisma.invoice.groupBy({
        where,
        by: ['mesReferencia', 'mesReferenciaDate'],
        _sum: {
          consumoKwh: true,
          valorTotalSemGd: true,
          economiaGdRs: true,
        },
        orderBy: {
          mesReferenciaDate: 'asc',
        },
      }),
    ]);

    return {
      consumoKwhTotal: totals._sum.consumoKwh ?? 0,
      valorTotalSemGdTotal: totals._sum.valorTotalSemGd ?? 0,
      economiaGdTotal: totals._sum.economiaGdRs ?? 0,
      monthlySeries: grouped.map((item) => ({
        mesReferencia: item.mesReferencia,
        mesReferenciaDate: item.mesReferenciaDate,
        consumoKwh: item._sum?.consumoKwh ?? 0,
        valorTotalSemGd: item._sum?.valorTotalSemGd ?? 0,
        economiaGd: item._sum?.economiaGdRs ?? 0,
      })),
    };
  }

  async getClientRanking(
    filters: InvoiceFilters,
    topN: number,
  ): Promise<
    Array<{
      numeroCliente: string;
      consumoKwh: number;
      valorTotalSemGd: number;
      economiaGd: number;
    }>
  > {
    const where = this.buildWhere(filters);

    const grouped = await this.prisma.invoice.groupBy({
      where,
      by: ['numeroCliente'],
      _sum: {
        consumoKwh: true,
        valorTotalSemGd: true,
        economiaGdRs: true,
      },
      orderBy: {
        _sum: {
          economiaGdRs: 'desc',
        },
      },
      take: topN,
    });

    return grouped.map((item) => ({
      numeroCliente: item.numeroCliente,
      consumoKwh: item._sum?.consumoKwh ?? 0,
      valorTotalSemGd: item._sum?.valorTotalSemGd ?? 0,
      economiaGd: item._sum?.economiaGdRs ?? 0,
    }));
  }

  private buildWhere(filters: InvoiceFilters): Prisma.InvoiceWhereInput {
    const where: Prisma.InvoiceWhereInput = {};

    if (filters.numeroCliente) {
      where.numeroCliente = filters.numeroCliente;
    }

    if (filters.mesReferencia) {
      where.mesReferencia = filters.mesReferencia;
    }

    if (filters.periodoInicio || filters.periodoFim) {
      const mesReferenciaDateFilter: Prisma.DateTimeFilter = {};
      if (filters.periodoInicio) {
        mesReferenciaDateFilter.gte = filters.periodoInicio;
      }
      if (filters.periodoFim) {
        mesReferenciaDateFilter.lte = filters.periodoFim;
      }
      where.mesReferenciaDate = mesReferenciaDateFilter;
    }

    return where;
  }
}
