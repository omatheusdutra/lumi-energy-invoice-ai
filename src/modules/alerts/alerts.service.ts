import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Alert, AlertSeverity, AlertType, Invoice, Prisma } from '@prisma/client';
import { env } from '../../common/config/env';
import { normalizeMesReferencia } from '../../common/utils/dates';
import { roundToTwo } from '../../common/utils/numbers';
import { ListAlertsQueryDto } from './dto/list-alerts-query.dto';
import { AlertsRepository } from './alerts.repository';

@Injectable()
export class AlertsService {
  constructor(private readonly alertsRepository: AlertsRepository) {}

  ensureEnabled(): void {
    if (!env.FEATURE_ALERTS_ENABLED) {
      throw new NotFoundException('Feature alerts is disabled');
    }
  }

  async evaluateAndPersist(invoice: Invoice): Promise<Alert[]> {
    if (!env.FEATURE_ALERTS_ENABLED) {
      return [];
    }

    const baselineMonths = env.ALERT_BASELINE_MIN_MONTHS;
    const history = await this.alertsRepository.findHistoricalInvoices(
      invoice.numeroCliente,
      invoice.mesReferenciaDate,
      baselineMonths,
    );

    if (history.length < baselineMonths) {
      return [];
    }

    const consumoSeries = history.map((item) => item.consumoKwh);
    const gastoSeries = history.map((item) => item.valorTotalSemGd);

    const alerts: Alert[] = [];

    const consumoAlert = await this.detectAlert(
      invoice,
      AlertType.CONSUMO_SPIKE,
      invoice.consumoKwh,
      consumoSeries,
      'Consumo subiu',
    );
    if (consumoAlert) {
      alerts.push(consumoAlert);
    }

    const gastoAlert = await this.detectAlert(
      invoice,
      AlertType.GASTO_FORA_PADRAO,
      invoice.valorTotalSemGd,
      gastoSeries,
      'Gasto projetado fora do padrao',
    );
    if (gastoAlert) {
      alerts.push(gastoAlert);
    }

    return alerts;
  }

  async listAlerts(query: ListAlertsQueryDto): Promise<{
    data: Alert[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  }> {
    this.ensureEnabled();
    if (query.pageSize > env.MAX_PAGE_SIZE) {
      throw new BadRequestException(`pageSize must be <= ${env.MAX_PAGE_SIZE}`);
    }

    let mesReferencia: string | undefined;
    try {
      mesReferencia = query.mes_referencia
        ? normalizeMesReferencia(query.mes_referencia)
        : undefined;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid filters';
      throw new BadRequestException(message);
    }

    const { data, total } = await this.alertsRepository.list(
      {
        numeroCliente: query.numero_cliente?.trim(),
        mesReferencia,
      },
      {
        page: query.page,
        pageSize: query.pageSize,
      },
    );

    return {
      data,
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize) || 1,
    };
  }

  private async detectAlert(
    invoice: Invoice,
    alertType: AlertType,
    currentValue: number,
    series: number[],
    label: string,
  ): Promise<Alert | null> {
    const mean = this.mean(series);
    const stdDev = this.stdDev(series, mean);
    if (mean <= 0) {
      return null;
    }

    const deltaPercent = roundToTwo(((currentValue - mean) / mean) * 100);
    const zScore = stdDev > 0 ? (currentValue - mean) / stdDev : 0;

    const thresholdPercent = env.ALERT_SPIKE_PERCENT_THRESHOLD;
    const thresholdZ = env.ALERT_ZSCORE_THRESHOLD;

    if (deltaPercent < thresholdPercent && zScore < thresholdZ) {
      return null;
    }

    const severity =
      deltaPercent >= thresholdPercent * 1.7 || zScore >= thresholdZ * 1.5
        ? AlertSeverity.CRITICAL
        : AlertSeverity.WARNING;

    const message = `${label} ${deltaPercent.toFixed(2)}% em ${invoice.mesReferencia} vs media recente`;

    return this.alertsRepository.upsertAlert({
      numeroCliente: invoice.numeroCliente,
      mesReferencia: invoice.mesReferencia,
      alertType,
      severity,
      message,
      metricValue: roundToTwo(currentValue),
      baselineValue: roundToTwo(mean),
      deltaPercent,
      metadata: {
        zScore: roundToTwo(zScore),
        baselineWindowMonths: series.length,
      } as Prisma.InputJsonValue,
    });
  }

  private mean(values: number[]): number {
    return values.reduce((acc, value) => acc + value, 0) / values.length;
  }

  private stdDev(values: number[], mean: number): number {
    const variance = values.reduce((acc, value) => acc + (value - mean) ** 2, 0) / values.length;
    return Math.sqrt(variance);
  }
}
