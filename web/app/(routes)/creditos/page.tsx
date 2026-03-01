'use client';

import type { ReactNode } from 'react';
import {
  Activity,
  CircleDollarSign,
  Coins,
  FileStack,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InlineAlert } from '@/components/ui/inline-alert';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipInfo } from '@/components/ui/tooltip';
import { useDashboardQueries } from '@/hooks/use-dashboard-queries';
import { useInvoicesSummaryQuery } from '@/hooks/use-invoices-summary-query';
import { formatCurrency, formatKwh, formatPercent } from '@/lib/format';

function asTone(value: number): 'success' | 'warning' | 'danger' {
  if (value >= 70) {
    return 'success';
  }
  if (value >= 45) {
    return 'warning';
  }
  return 'danger';
}

export default function CreditosPage() {
  const { energyQuery, financialQuery, kpiQuery } = useDashboardQueries({});
  const invoicesSummaryQuery = useInvoicesSummaryQuery({});

  const loading =
    energyQuery.isLoading ||
    financialQuery.isLoading ||
    kpiQuery.isLoading ||
    invoicesSummaryQuery.isLoading;

  const hasError =
    energyQuery.isError ||
    financialQuery.isError ||
    kpiQuery.isError ||
    invoicesSummaryQuery.isError;

  if (loading) {
    return (
      <section className="space-y-4" aria-label="Carregando créditos">
        <Skeleton className="h-40" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`credits-kpi-${index}`} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      </section>
    );
  }

  if (hasError) {
    return (
      <InlineAlert
        variant="danger"
        title="Falha ao carregar créditos"
        description="Não foi possível consultar os indicadores de energia compensada e economia GD."
      />
    );
  }

  const energiaCompensada = energyQuery.data?.energia_compensada_kwh_total ?? 0;
  const consumoTotal = energyQuery.data?.consumo_kwh_total ?? 0;
  const economiaTotal = financialQuery.data?.economia_gd_total ?? 0;
  const valorSemGdTotal = financialQuery.data?.valor_total_sem_gd_total ?? 0;
  const totalFaturas = invoicesSummaryQuery.data?.total ?? 0;

  const compensacaoPercentual = consumoTotal > 0 ? (energiaCompensada / consumoTotal) * 100 : 0;
  const economiaPorKwh = energiaCompensada > 0 ? economiaTotal / energiaCompensada : 0;
  const kwhPorReal = kpiQuery.data?.kwh_por_real ?? 0;
  const tendencia6Meses = kpiQuery.data?.tendencia_6_meses_percent ?? 0;
  const economiaPercentual = kpiQuery.data?.economia_percentual ?? 0;
  const coverageTone = asTone(compensacaoPercentual);

  return (
    <section className="space-y-5" aria-label="Painel de créditos de energia">
      <Card className="border border-slate-200/80 bg-white/95 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.45)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-[var(--font-heading)] text-[1.56rem] font-semibold tracking-tight text-[#062a53] md:text-[1.75rem]">
            <Sparkles className="h-5 w-5 text-sky-700" aria-hidden="true" />
            Créditos de energia
          </CardTitle>
          <CardDescription className="text-sm text-slate-600">
            Acompanhe quanto foi compensado, o retorno financeiro acumulado e a eficiência da GD no
            período monitorado.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 space-y-0 md:grid-cols-3">
          <InfoItem
            title="Cobertura energética"
            description="Relação entre energia compensada e consumo total das faturas processadas."
            tooltip="Quanto maior o índice, mais consumo foi coberto por energia compensada."
          />
          <InfoItem
            title="Impacto financeiro"
            description="Economia consolidada sobre o valor que seria pago sem geração distribuída."
            tooltip="Mostra o quanto a GD reduziu o custo projetado da conta."
          />
          <InfoItem
            title="Atualização contínua"
            description="Os indicadores são recalculados automaticamente após novos uploads."
            tooltip="Após um upload bem-sucedido, o front invalida cache e recarrega os painéis."
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          icon={<FileStack className="h-5 w-5" aria-hidden="true" />}
          label="Créditos de energia"
          value={formatKwh(energiaCompensada)}
          hint={`Faturas no escopo: ${totalFaturas}`}
          tooltip="Soma da energia compensada (kWh) para os filtros atuais."
        />
        <MetricTile
          icon={<TrendingUp className="h-5 w-5" aria-hidden="true" />}
          label="Economia acumulada"
          value={formatCurrency(economiaTotal)}
          hint="Impacto financeiro da compensação GD"
          tooltip="Economia total (R$) gerada pela energia compensada."
        />
        <MetricTile
          icon={<Zap className="h-5 w-5" aria-hidden="true" />}
          label="Cobertura média"
          value={formatPercent(compensacaoPercentual)}
          hint={`Consumo monitorado: ${formatKwh(consumoTotal)}`}
          tone={coverageTone}
          tooltip="Percentual de consumo atendido por energia compensada."
        />
        <MetricTile
          icon={<Coins className="h-5 w-5" aria-hidden="true" />}
          label="Economia por kWh"
          value={formatCurrency(economiaPorKwh)}
          hint="Retorno médio por energia compensada"
          tooltip="Relação entre economia total e energia compensada total."
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card className="border border-slate-200/80 bg-white/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-slate-900">
              <Activity className="h-4.5 w-4.5 text-sky-700" aria-hidden="true" />
              Eficiência de compensação
            </CardTitle>
            <CardDescription>
              Índice de cobertura dos créditos sobre o consumo total no período analisado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50/65 p-4">
              <div className="mb-2 flex items-end justify-between gap-3">
                <p className="text-sm font-medium text-slate-600">Compensação do consumo</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {formatPercent(compensacaoPercentual)}
                </p>
              </div>
              <Progress value={compensacaoPercentual} className="h-2.5" />
              <p className="mt-2 text-xs text-slate-500">
                {formatKwh(energiaCompensada)} de {formatKwh(consumoTotal)} cobertos por GD.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <MiniMetric
                label="kWh por real"
                value={kwhPorReal > 0 ? formatKwh(kwhPorReal) : '--'}
                tooltip="Eficiência energética por unidade monetária."
              />
              <MiniMetric
                label="Economia %"
                value={formatPercent(economiaPercentual)}
                tooltip="Economia percentual sobre o valor sem GD."
              />
              <MiniMetric
                label="Tendência 6 meses"
                value={formatPercent(tendencia6Meses)}
                tooltip="Variação percentual projetada com base nos últimos 6 meses."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 bg-white/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-slate-900">
              <CircleDollarSign className="h-4.5 w-4.5 text-sky-700" aria-hidden="true" />
              Resumo financeiro
            </CardTitle>
            <CardDescription>
              Consolidado financeiro das faturas com e sem compensação de energia.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <FinanceRow
              label="Valor total sem GD"
              value={formatCurrency(valorSemGdTotal)}
              tooltip="Valor projetado sem compensação de energia."
            />
            <FinanceRow
              label="Economia GD"
              value={formatCurrency(economiaTotal)}
              emphasis="positive"
              tooltip="Economia consolidada aplicada pela geração distribuída."
            />
            <FinanceRow
              label="Retorno por energia"
              value={formatCurrency(economiaPorKwh)}
              tooltip="Economia média gerada por kWh compensado."
            />
            <FinanceRow
              label="Faturas processadas"
              value={String(totalFaturas)}
              tooltip="Total de faturas consideradas no período."
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function MetricTile({
  icon,
  label,
  value,
  hint,
  tone = 'neutral',
  tooltip,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
  tooltip?: string;
}) {
  const toneClass =
    tone === 'success'
      ? 'text-sky-700'
      : tone === 'warning'
        ? 'text-amber-700'
        : tone === 'danger'
          ? 'text-rose-700'
          : 'text-slate-900';

  return (
    <Card className="border border-slate-200/80 bg-white/90 shadow-[0_8px_20px_-16px_rgba(15,23,42,0.35)]">
      <CardContent className="space-y-2">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-sky-700">
          {icon}
        </div>
        <div className="flex items-center gap-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          {tooltip ? <TooltipInfo content={tooltip} side="top" /> : null}
        </div>
        <p className={`text-2xl font-semibold tracking-tight ${toneClass}`}>{value}</p>
        <p className="text-xs text-slate-500">{hint}</p>
      </CardContent>
    </Card>
  );
}

function InfoItem({
  title,
  description,
  tooltip,
}: {
  title: string;
  description: string;
  tooltip?: string;
}) {
  return (
    <div className="rounded-xl border border-sky-100 bg-sky-50/40 p-4">
      <div className="flex items-center gap-1">
        <p className="text-sm font-semibold text-[#0a2340]">{title}</p>
        {tooltip ? <TooltipInfo content={tooltip} side="top" /> : null}
      </div>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
    </div>
  );
}

function MiniMetric({ label, value, tooltip }: { label: string; value: string; tooltip?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/80 p-3">
      <div className="flex items-center gap-1">
        <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>
        {tooltip ? <TooltipInfo content={tooltip} side="top" /> : null}
      </div>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function FinanceRow({
  label,
  value,
  emphasis = 'default',
  tooltip,
}: {
  label: string;
  value: string;
  emphasis?: 'default' | 'positive';
  tooltip?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/65 px-3 py-2">
      <span className="flex items-center gap-1 text-sm text-slate-600">
        {label}
        {tooltip ? <TooltipInfo content={tooltip} side="top" /> : null}
      </span>
      <span
        className={`text-sm font-semibold ${emphasis === 'positive' ? 'text-sky-700' : 'text-slate-900'}`}
      >
        {value}
      </span>
    </div>
  );
}
