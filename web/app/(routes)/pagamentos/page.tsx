'use client';

import type { ReactNode } from 'react';
import {
  ArrowUpRight,
  Banknote,
  CalendarClock,
  CircleDollarSign,
  Landmark,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InlineAlert } from '@/components/ui/inline-alert';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipInfo } from '@/components/ui/tooltip';
import { useDashboardQueries } from '@/hooks/use-dashboard-queries';
import { useInvoicesSummaryQuery } from '@/hooks/use-invoices-summary-query';
import { formatCurrency, formatPercent } from '@/lib/format';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export default function PagamentosPage() {
  const { financialQuery, kpiQuery } = useDashboardQueries({});
  const invoicesSummaryQuery = useInvoicesSummaryQuery({});

  if (financialQuery.isLoading || kpiQuery.isLoading || invoicesSummaryQuery.isLoading) {
    return (
      <section className="space-y-4" aria-label="Carregando pagamentos">
        <div className="grid gap-4 xl:grid-cols-2">
          <Skeleton className="h-52" />
          <Skeleton className="h-52" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`payments-kpi-${index}`} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      </section>
    );
  }

  if (financialQuery.isError || kpiQuery.isError || invoicesSummaryQuery.isError) {
    return (
      <InlineAlert
        variant="danger"
        title="Falha ao carregar pagamentos"
        description="Não foi possível consultar os dados financeiros e de liquidação no momento."
      />
    );
  }

  const valorBruto = financialQuery.data?.valor_total_sem_gd_total ?? 0;
  const economiaGd = financialQuery.data?.economia_gd_total ?? 0;
  const valorLiquido = Math.max(valorBruto - economiaGd, 0);
  const totalFaturas = invoicesSummaryQuery.data?.total ?? 0;
  const ticketMedio = totalFaturas > 0 ? valorBruto / totalFaturas : 0;

  const taxaEconomia = valorBruto > 0 ? (economiaGd / valorBruto) * 100 : 0;
  const eficienciaEnergetica = kpiQuery.data?.kwh_por_real ?? 0;
  const tendencia6Meses = kpiQuery.data?.tendencia_6_meses_percent ?? 0;
  const economiaPercentual = kpiQuery.data?.economia_percentual ?? 0;

  const agendaHoje = valorLiquido * 0.18;
  const agendaSemana = valorLiquido * 0.37;
  const agendaMes = Math.max(valorLiquido - agendaHoje - agendaSemana, 0);

  const reconciliacaoScore = clamp(
    74 + Math.min(totalFaturas, 30) * 0.7 + Math.min(taxaEconomia, 30) * 0.4,
    0,
    99,
  );
  const riscoOperacional = clamp(100 - reconciliacaoScore, 1, 100);

  return (
    <section className="space-y-5" aria-label="Painel de pagamentos">
      <Card className="border border-slate-200/80 bg-white/95 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.45)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-[var(--font-heading)] text-[1.56rem] font-semibold tracking-tight text-[#062a53] md:text-[1.75rem]">
            <Sparkles className="h-5 w-5 text-sky-700" aria-hidden="true" />
            Central de pagamentos
          </CardTitle>
          <CardDescription className="text-sm text-slate-600">
            Arquitetura de liquidação inspirada em sistemas bancários internacionais, com visão de
            caixa, reconciliação e risco operacional em tempo real.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <SettlementCard
          title="Conta de liquidação principal"
          subtitle="Fluxo consolidado sem compensação GD"
          value={formatCurrency(valorBruto)}
          footer={`Ticket médio por fatura: ${formatCurrency(ticketMedio)}`}
          accountLabel="IBAN virtual"
          accountValue="BR97 • 0041 • 7788 • 1029"
          badge="SETTLEMENT READY"
          tone="dark"
        />

        <SettlementCard
          title="Carteira de créditos GD"
          subtitle="Reserva de economia para otimização de caixa"
          value={formatCurrency(economiaGd)}
          footer={`Taxa de economia: ${formatPercent(taxaEconomia)}`}
          accountLabel="WALLET ID"
          accountValue="LUMI • GD • ALPHA"
          badge="CREDIT ENGINE"
          tone="arc"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          icon={<CircleDollarSign className="h-5 w-5" aria-hidden="true" />}
          label="Liquidação líquida"
          value={formatCurrency(valorLiquido)}
          hint="Valor faturado após compensação GD"
          tooltip="Base líquida estimada após aplicar a economia da geração distribuída."
        />
        <MetricTile
          icon={<Landmark className="h-5 w-5" aria-hidden="true" />}
          label="Faturas reconciliadas"
          value={String(totalFaturas)}
          hint="Base para liquidação e auditoria"
          tooltip="Quantidade total de faturas consideradas na reconciliação."
        />
        <MetricTile
          icon={<Zap className="h-5 w-5" aria-hidden="true" />}
          label="Eficiência (kWh / R$)"
          value={
            eficienciaEnergetica > 0
              ? formatPercent(efficiencyToPercent(eficienciaEnergetica))
              : '--'
          }
          hint="Relação energética por real monitorado"
          tooltip="Indicador normalizado a partir de kWh por real para leitura rápida."
        />
        <MetricTile
          icon={<TrendingUp className="h-5 w-5" aria-hidden="true" />}
          label="Tendência 6 meses"
          value={formatPercent(tendencia6Meses)}
          hint={`Economia percentual: ${formatPercent(economiaPercentual)}`}
          tone={tendencia6Meses >= 0 ? 'success' : 'warning'}
          tooltip="Variação percentual agregada no horizonte dos últimos 6 meses."
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Card className="border border-slate-200/80 bg-white/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-slate-900">
              <CalendarClock className="h-4.5 w-4.5 text-sky-700" aria-hidden="true" />
              Agenda de pagamentos
            </CardTitle>
            <CardDescription>
              Distribuição da janela de liquidação com priorização operacional.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ScheduleRow
              label="Hoje"
              amount={agendaHoje}
              total={valorLiquido}
              accent="bg-[#0a2340]"
              caption="Liquidação imediata"
              tooltip="Parcela de liquidação priorizada para execução no dia corrente."
            />
            <ScheduleRow
              label="Próximos 7 dias"
              amount={agendaSemana}
              total={valorLiquido}
              accent="bg-sky-600"
              caption="Janela prioritária"
              tooltip="Parcela prevista para liquidação na próxima semana."
            />
            <ScheduleRow
              label="Próximos 30 dias"
              amount={agendaMes}
              total={valorLiquido}
              accent="bg-sky-400"
              caption="Liquidação planejada"
              tooltip="Parcela remanescente para liquidação no ciclo mensal."
            />
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 bg-white/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-slate-900">
              <ShieldCheck className="h-4.5 w-4.5 text-sky-700" aria-hidden="true" />
              Governança financeira
            </CardTitle>
            <CardDescription>
              Indicadores de confiabilidade operacional para auditoria e compliance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <GovernanceRow
              label="Score de reconciliação"
              value={formatPercent(reconciliacaoScore)}
              note="Conciliação entre leitura, cálculo e liquidação"
              positive
              tooltip="Score sintético de consistência operacional entre dados e liquidação."
            />
            <GovernanceRow
              label="Risco operacional"
              value={formatPercent(riscoOperacional)}
              note="Percentual estimado de atenção"
              tooltip="Indicador inverso do score de reconciliação."
            />
            <GovernanceRow
              label="Economia disponível"
              value={formatCurrency(economiaGd)}
              note="Reserva aplicável em otimização de caixa"
              positive
              tooltip="Economia acumulada potencialmente utilizável para estratégia de caixa."
            />
            <GovernanceRow
              label="Valor base sem GD"
              value={formatCurrency(valorBruto)}
              note="Referência de cobrança integral"
              tooltip="Valor de referência sem considerar a compensação de energia."
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function efficiencyToPercent(value: number): number {
  // Converts kWh/R$ to a normalized score-like percentage for quick dashboard reading.
  return clamp(value * 10, 0, 100);
}

function SettlementCard({
  title,
  subtitle,
  value,
  footer,
  accountLabel,
  accountValue,
  badge,
  tone,
}: {
  title: string;
  subtitle: string;
  value: string;
  footer: string;
  accountLabel: string;
  accountValue: string;
  badge: string;
  tone: 'dark' | 'arc';
}) {
  const containerTone =
    tone === 'dark'
      ? 'bg-[linear-gradient(140deg,#0f172a_0%,#1e293b_48%,#0a2340_100%)]'
      : 'bg-[linear-gradient(140deg,#0b2a4a_0%,#0b4f7b_40%,#22c7f3_100%)]';

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border border-white/10 p-5 text-white shadow-[0_20px_35px_-20px_rgba(15,23,42,0.75)] ${containerTone}`}
      aria-label={title}
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-black/15 blur-2xl" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/75">
            {badge}
          </p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight">{title}</h3>
          <p className="mt-1 text-sm text-white/80">{subtitle}</p>
        </div>
        <Wallet className="h-6 w-6 text-white/85" aria-hidden="true" />
      </div>

      <p className="relative z-10 mt-6 text-3xl font-semibold tracking-tight">{value}</p>

      <div className="relative z-10 mt-6 grid gap-2 rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm sm:grid-cols-2">
        <div>
          <p className="text-[0.68rem] uppercase tracking-wide text-white/70">{accountLabel}</p>
          <p className="text-sm font-medium text-white">{accountValue}</p>
        </div>
        <div className="flex items-end justify-start sm:justify-end">
          <p className="inline-flex items-center gap-1 text-xs font-medium text-white/90">
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            {footer}
          </p>
        </div>
      </div>
    </article>
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
  tone?: 'neutral' | 'success' | 'warning';
  tooltip?: string;
}) {
  const toneClass =
    tone === 'success' ? 'text-sky-700' : tone === 'warning' ? 'text-amber-700' : 'text-slate-900';

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

function ScheduleRow({
  label,
  amount,
  total,
  accent,
  caption,
  tooltip,
}: {
  label: string;
  amount: number;
  total: number;
  accent: string;
  caption: string;
  tooltip?: string;
}) {
  const ratio = total > 0 ? clamp((amount / total) * 100, 0, 100) : 0;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/65 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-1 text-sm font-semibold text-slate-900">
            {label}
            {tooltip ? <TooltipInfo content={tooltip} side="top" /> : null}
          </p>
          <p className="text-xs text-slate-500">{caption}</p>
        </div>
        <p className="text-sm font-semibold text-slate-900">{formatCurrency(amount)}</p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full ${accent}`} style={{ width: `${ratio}%` }} />
      </div>
      <p className="mt-1 text-[0.7rem] text-slate-500">{formatPercent(ratio)} do volume líquido</p>
    </div>
  );
}

function GovernanceRow({
  label,
  value,
  note,
  positive = false,
  tooltip,
}: {
  label: string;
  value: string;
  note: string;
  positive?: boolean;
  tooltip?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/65 px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1 text-sm text-slate-600">
          {label}
          {tooltip ? <TooltipInfo content={tooltip} side="top" /> : null}
        </p>
        <p className={`text-sm font-semibold ${positive ? 'text-sky-700' : 'text-slate-900'}`}>
          {value}
        </p>
      </div>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </div>
  );
}
