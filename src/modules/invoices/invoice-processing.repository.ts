import { Injectable } from '@nestjs/common';
import { InvoiceProcessing, ProcessingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InvoiceProcessingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByHash(hashSha256: string): Promise<InvoiceProcessing | null> {
    return this.prisma.invoiceProcessing.findUnique({ where: { hashSha256 } });
  }

  async createReceived(hashSha256: string, sourceFilename: string): Promise<InvoiceProcessing> {
    return this.prisma.invoiceProcessing.create({
      data: {
        hashSha256,
        sourceFilename,
        status: ProcessingStatus.RECEIVED,
      },
    });
  }

  async updateStatus(
    id: string,
    status: ProcessingStatus,
    data?: Partial<
      Pick<
        Prisma.InvoiceProcessingUpdateInput,
        | 'rawLlmJson'
        | 'redactedLlmJson'
        | 'numeroCliente'
        | 'mesReferencia'
        | 'errorReason'
        | 'invoice'
      >
    > & { dedupCompositeKey?: string | null },
  ): Promise<InvoiceProcessing> {
    return this.prisma.invoiceProcessing.update({
      where: { id },
      data: {
        status,
        ...(data ?? {}),
      },
    });
  }

  async resetForReprocessing(id: string, sourceFilename: string): Promise<InvoiceProcessing> {
    return this.prisma.invoiceProcessing.update({
      where: { id },
      data: {
        sourceFilename,
        status: ProcessingStatus.RECEIVED,
        dedupCompositeKey: null,
        numeroCliente: null,
        mesReferencia: null,
        errorReason: null,
      },
    });
  }
}
