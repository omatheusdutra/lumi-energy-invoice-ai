import { Injectable } from '@nestjs/common';
import {
  type Alert,
  type AlertSeverity,
  type AlertType,
  type Invoice,
  type Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AlertsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findHistoricalInvoices(
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

  async upsertAlert(data: {
    numeroCliente: string;
    mesReferencia: string;
    alertType: AlertType;
    severity: AlertSeverity;
    message: string;
    metricValue?: number;
    baselineValue?: number;
    deltaPercent?: number;
    metadata?: Prisma.InputJsonValue;
  }): Promise<Alert> {
    return this.prisma.alert.upsert({
      where: {
        numeroCliente_mesReferencia_alertType: {
          numeroCliente: data.numeroCliente,
          mesReferencia: data.mesReferencia,
          alertType: data.alertType,
        },
      },
      create: {
        numeroCliente: data.numeroCliente,
        mesReferencia: data.mesReferencia,
        alertType: data.alertType,
        severity: data.severity,
        message: data.message,
        metricValue: data.metricValue,
        baselineValue: data.baselineValue,
        deltaPercent: data.deltaPercent,
        metadata: data.metadata,
      },
      update: {
        severity: data.severity,
        message: data.message,
        metricValue: data.metricValue,
        baselineValue: data.baselineValue,
        deltaPercent: data.deltaPercent,
        metadata: data.metadata,
        isResolved: false,
      },
    });
  }

  async list(
    filters: { numeroCliente?: string; mesReferencia?: string },
    pagination: { page: number; pageSize: number },
  ): Promise<{ data: Alert[]; total: number }> {
    const where = {
      ...(filters.numeroCliente ? { numeroCliente: filters.numeroCliente } : {}),
      ...(filters.mesReferencia ? { mesReferencia: filters.mesReferencia } : {}),
    };

    const skip = (pagination.page - 1) * pagination.pageSize;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.alert.findMany({
        where,
        skip,
        take: pagination.pageSize,
        orderBy: [{ mesReferencia: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.alert.count({ where }),
    ]);

    return { data, total };
  }
}
