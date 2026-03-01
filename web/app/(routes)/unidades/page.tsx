'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Building2,
  CalendarClock,
  CircleDollarSign,
  FileStack,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { InlineAlert } from '@/components/ui/inline-alert';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipInfo } from '@/components/ui/tooltip';
import { useUnitsQuery } from '@/hooks/use-units-query';
import { formatCurrency, formatKwh, formatPercent } from '@/lib/format';
import type { Invoice } from '@/lib/api/schemas';
import type { ReactNode } from 'react';

type UnitHealth = 'excellent' | 'good' | 'attention';

interface UnitAggregate {
  numeroCliente: string;
  invoicesCount: number;
  consumoTotal: number;
  compensadaTotal: number;
  economiaTotal: number;
  valorSemGdTotal: number;
  percentualCompensacao: number;
  ultimaReferencia: string;
  periodoResumo: string;
  ultimaAtualizacao: string;
  health: UnitHealth;
}

type UnitsSort =
  | 'economia_desc'
  | 'consumo_desc'
  | 'compensacao_desc'
  | 'faturas_desc'
  | 'cliente_asc';

const MONTH_ORDER: Record<string, number> = {
  JAN: 0,
  FEV: 1,
  MAR: 2,
  ABR: 3,
  MAI: 4,
  JUN: 5,
  JUL: 6,
  AGO: 7,
  SET: 8,
  OUT: 9,
  NOV: 10,
  DEZ: 11,
};

function toMonthIndex(monthRef: string): number {
  const [monthToken, yearToken] = monthRef.split('/');
  const month = monthToken?.trim().toUpperCase();
  const year = Number.parseInt(yearToken ?? '', 10);
  const monthIndex = month ? MONTH_ORDER[month] : undefined;

  if (!Number.isFinite(year) || monthIndex === undefined) {
    return Number.NEGATIVE_INFINITY;
  }

  return year * 100 + monthIndex;
}

function summarizeMonthRange(months: string[]): string {
  if (months.length === 0) {
    return 'Sem referência';
  }

  const sorted = [...months].sort((a, b) => toMonthIndex(a) - toMonthIndex(b));
  if (sorted.length === 1) {
    return sorted[0] ?? 'Sem referência';
  }

  const first = sorted[0] ?? '';
  const last = sorted[sorted.length - 1] ?? '';
  return `${first} até ${last}`;
}

function classifyHealth(percentualCompensacao: number): UnitHealth {
  if (percentualCompensacao >= 70) {
    return 'excellent';
  }
  if (percentualCompensacao >= 45) {
    return 'good';
  }
  return 'attention';
}

function sortUnits(units: UnitAggregate[], sortBy: UnitsSort): UnitAggregate[] {
  const sorted = [...units];

  sorted.sort((a, b) => {
    switch (sortBy) {
      case 'economia_desc':
        return b.economiaTotal - a.economiaTotal;
      case 'consumo_desc':
        return b.consumoTotal - a.consumoTotal;
      case 'compensacao_desc':
        return b.percentualCompensacao - a.percentualCompensacao;
      case 'faturas_desc':
        return b.invoicesCount - a.invoicesCount;
      case 'cliente_asc':
        return a.numeroCliente.localeCompare(b.numeroCliente);
      default:
        return 0;
    }
  });

  return sorted;
}

function buildUnits(invoices: Invoice[]): UnitAggregate[] {
  const grouped = new Map<string, Invoice[]>();

  for (const invoice of invoices) {
    const bucket = grouped.get(invoice.numeroCliente) ?? [];
    bucket.push(invoice);
    grouped.set(invoice.numeroCliente, bucket);
  }

  const units = Array.from(grouped.entries()).map(([numeroCliente, unitInvoices]) => {
    const consumoTotal = unitInvoices.reduce((acc, item) => acc + item.consumoKwh, 0);
    const compensadaTotal = unitInvoices.reduce((acc, item) => acc + item.energiaCompensadaKwh, 0);
    const economiaTotal = unitInvoices.reduce((acc, item) => acc + item.economiaGdRs, 0);
    const valorSemGdTotal = unitInvoices.reduce((acc, item) => acc + item.valorTotalSemGd, 0);
    const percentualCompensacao = consumoTotal > 0 ? (compensadaTotal / consumoTotal) * 100 : 0;

    const months = unitInvoices.map((item) => item.mesReferencia);
    const ultimaReferencia =
      [...months].sort((a, b) => toMonthIndex(b) - toMonthIndex(a))[0] ?? '--';
    const periodoResumo = summarizeMonthRange(months);

    const latestCreatedAt = unitInvoices
      .map((item) => Number.parseInt(new Date(item.createdAt).getTime().toFixed(0), 10))
      .sort((a, b) => b - a)[0];

    return {
      numeroCliente,
      invoicesCount: unitInvoices.length,
      consumoTotal,
      compensadaTotal,
      economiaTotal,
      valorSemGdTotal,
      percentualCompensacao,
      ultimaReferencia,
      periodoResumo,
      ultimaAtualizacao:
        latestCreatedAt && Number.isFinite(latestCreatedAt)
          ? new Intl.DateTimeFormat('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            }).format(latestCreatedAt)
          : '--',
      health: classifyHealth(percentualCompensacao),
    };
  });

  return units.sort((a, b) => {
    if (b.invoicesCount !== a.invoicesCount) {
      return b.invoicesCount - a.invoicesCount;
    }
    return a.numeroCliente.localeCompare(b.numeroCliente);
  });
}

export default function MinhasUnidadesPage() {
  const unitsQuery = useUnitsQuery();
  const [clientFilter, setClientFilter] = useState('');
  const [sortBy, setSortBy] = useState<UnitsSort>('economia_desc');

  const units = useMemo(() => buildUnits(unitsQuery.data ?? []), [unitsQuery.data]);
  const displayedUnits = useMemo(() => {
    const normalizedClientFilter = clientFilter.trim().replace(/\D/g, '');
    const filtered =
      normalizedClientFilter.length > 0
        ? units.filter((unit) => unit.numeroCliente.includes(normalizedClientFilter))
        : units;

    return sortUnits(filtered, sortBy);
  }, [units, clientFilter, sortBy]);

  const summary = useMemo(() => {
    const invoices = unitsQuery.data ?? [];
    const consumoTotal = invoices.reduce((acc, item) => acc + item.consumoKwh, 0);
    const compensadaTotal = invoices.reduce((acc, item) => acc + item.energiaCompensadaKwh, 0);
    const economiaTotal = invoices.reduce((acc, item) => acc + item.economiaGdRs, 0);
    const percentualCompensacao = consumoTotal > 0 ? (compensadaTotal / consumoTotal) * 100 : 0;

    return {
      totalUnidades: units.length,
      totalFaturas: invoices.length,
      consumoTotal,
      economiaTotal,
      percentualCompensacao,
    };
  }, [units, unitsQuery.data]);

  if (unitsQuery.isLoading) {
    return (
      <section className="space-y-5" aria-label="Carregando unidades">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`units-summary-${index}`} className="h-28" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={`unit-card-${index}`} className="h-72" />
          ))}
        </div>
      </section>
    );
  }

  if (unitsQuery.isError) {
    return (
      <InlineAlert
        variant="danger"
        title="Falha ao carregar unidades"
        description={
          unitsQuery.error instanceof Error
            ? unitsQuery.error.message
            : 'Não foi possível carregar as unidades a partir das faturas.'
        }
      />
    );
  }

  if (units.length === 0) {
    return (
      <Card className="border border-border/80 bg-white/90 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-sky-700" aria-hidden="true" />
            Unidades
          </CardTitle>
          <CardDescription>
            Ainda não há unidades mapeadas. Elas serão criadas automaticamente após os uploads.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500"
          >
            <Zap className="h-4 w-4" aria-hidden="true" />
            Enviar primeira fatura
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-5" aria-label="Painel de unidades">
      <Card className="border border-slate-200/80 bg-white/95 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.45)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-[var(--font-heading)] text-[1.56rem] font-semibold tracking-tight text-[#062a53] md:text-[1.75rem]">
            <Sparkles className="h-5 w-5 text-sky-700" aria-hidden="true" />
            Unidades Consumidoras
          </CardTitle>
          <CardDescription className="text-sm text-slate-600">
            Agrupamento das faturas pelo <strong>Nº do cliente</strong>. Cada card desta página
            mostra a saúde energética e financeira dessa unidade ao longo do período processado.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid items-stretch gap-3 space-y-0 md:auto-rows-fr md:grid-cols-3">
          <ExplainerItem
            title="Origem dos dados"
            description="As unidades são criadas automaticamente após o upload e processamento das faturas."
            tooltip="Cada unidade é derivada do Nº do cliente encontrado nas faturas processadas."
          />
          <ExplainerItem
            title="Visão operacional"
            description="Você acompanha consumo, energia compensada, economia GD e referência mais recente."
            tooltip="Consolida indicadores por unidade para facilitar priorização operacional."
          />
          <ExplainerItem
            title="Leitura rápida"
            description="O selo de eficiência indica o nível de compensação para priorizar ações."
            tooltip="Os selos usam a taxa de compensação para classificar eficiência da unidade."
          />
        </CardContent>
      </Card>

      <header className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryTile
          icon={<Building2 className="h-5 w-5" aria-hidden="true" />}
          label="Unidades ativas"
          value={String(summary.totalUnidades)}
          tooltip="Total de unidades únicas derivadas das faturas disponíveis."
        />
        <SummaryTile
          icon={<FileStack className="h-5 w-5" aria-hidden="true" />}
          label="Faturas mapeadas"
          value={String(summary.totalFaturas)}
          tooltip="Quantidade total de faturas que alimentam o mapa de unidades."
        />
        <SummaryTile
          icon={<Zap className="h-5 w-5" aria-hidden="true" />}
          label="Consumo agregado"
          value={formatKwh(summary.consumoTotal)}
          tooltip="Soma de consumo (kWh) considerando todas as unidades no escopo."
        />
        <SummaryTile
          icon={<CircleDollarSign className="h-5 w-5" aria-hidden="true" />}
          label="Economia GD"
          value={formatCurrency(summary.economiaTotal)}
          hint={`Compensação média: ${formatPercent(summary.percentualCompensacao)}`}
          tooltip="Economia acumulada com geração distribuída para o conjunto de unidades."
        />
      </header>

      <Card className="border border-slate-200/80 bg-white/90">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-900">Filtros e ordenação</CardTitle>
          <CardDescription>
            Refine as unidades por cliente e ordene pela métrica mais importante para sua análise.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,280px)_auto]">
            <div className="space-y-1">
              <label
                htmlFor="units-client-filter"
                className="flex items-center gap-1 text-[0.72rem] font-semibold uppercase tracking-wide text-slate-500"
              >
                Nº do cliente
                <TooltipInfo content="Filtra os cards exibidos pelo número do cliente da unidade." />
              </label>
              <Input
                id="units-client-filter"
                value={clientFilter}
                onChange={(event) => setClientFilter(event.currentTarget.value)}
                placeholder="Ex.: 3001116735"
                inputMode="numeric"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="units-sort-by"
                className="flex items-center gap-1 text-[0.72rem] font-semibold uppercase tracking-wide text-slate-500"
              >
                Ordenar por
                <TooltipInfo content="Define o critério de ordenação dos cards de unidade." />
              </label>
              <select
                id="units-sort-by"
                value={sortBy}
                onChange={(event) => setSortBy(event.currentTarget.value as UnitsSort)}
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="economia_desc">Maior economia GD</option>
                <option value="consumo_desc">Maior consumo</option>
                <option value="compensacao_desc">Maior índice de compensação</option>
                <option value="faturas_desc">Mais faturas</option>
                <option value="cliente_asc">Nº do cliente (A-Z)</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                variant="secondary"
                className="w-full md:w-auto"
                onClick={() => {
                  setClientFilter('');
                  setSortBy('economia_desc');
                }}
              >
                Limpar filtros
              </Button>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Mostrando <strong>{displayedUnits.length}</strong> de <strong>{units.length}</strong>{' '}
            unidades.
          </p>
        </CardContent>
      </Card>

      {displayedUnits.length === 0 ? (
        <InlineAlert
          title="Nenhuma unidade encontrada para o filtro atual"
          description="Ajuste o número do cliente ou limpe os filtros para visualizar todas as unidades."
          variant="info"
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {displayedUnits.map((unit) => (
            <article
              key={unit.numeroCliente}
              className="group relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-b from-white to-sky-50/45 p-5 shadow-[0_10px_30px_-20px_rgba(14,116,144,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-20px_rgba(14,116,144,0.55)]"
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-sky-200/40 blur-2xl" />

              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Unidade consumidora
                  </p>
                  <h3 className="mt-1 text-xl font-semibold tracking-tight text-[#0a2340]">
                    {unit.numeroCliente}
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1">
                  <Badge variant={healthVariant(unit.health)} className="border border-current/20">
                    {healthLabel(unit.health)}
                  </Badge>
                  <TooltipInfo
                    content="Classificação baseada no índice de compensação da unidade."
                    side="top"
                  />
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <UnitMetric label="Faturas" value={String(unit.invoicesCount)} />
                <UnitMetric label="Última referência" value={unit.ultimaReferencia} />
                <UnitMetric label="Consumo" value={formatKwh(unit.consumoTotal)} />
                <UnitMetric label="Compensada" value={formatKwh(unit.compensadaTotal)} />
              </div>

              <div className="mt-4 rounded-xl border border-sky-100 bg-white/75 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Janela temporal
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">{unit.periodoResumo}</p>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <InfoChip
                    icon={<ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />}
                    label="Economia"
                    value={formatCurrency(unit.economiaTotal)}
                  />
                  <InfoChip
                    icon={<CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />}
                    label="Atualizado"
                    value={unit.ultimaAtualizacao}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>Índice de compensação</span>
                <span className="font-semibold text-sky-700">
                  {formatPercent(unit.percentualCompensacao)}
                </span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-sky-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-700 transition-all"
                  style={{ width: `${Math.min(unit.percentualCompensacao, 100)}%` }}
                  aria-hidden="true"
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  hint,
  tooltip,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
  tooltip?: string;
}) {
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
        <p className="text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
        {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function UnitMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/85 p-3">
      <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function InfoChip({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs">
      <span className="text-sky-700">{icon}</span>
      <span className="text-slate-500">{label}:</span>
      <span className="font-semibold text-slate-800">{value}</span>
    </div>
  );
}

function ExplainerItem({
  title,
  description,
  tooltip,
}: {
  title: string;
  description: string;
  tooltip?: string;
}) {
  return (
    <div className="grid h-full min-h-[148px] grid-rows-[auto_1fr] rounded-xl border border-sky-100 bg-sky-50/40 p-4">
      <div className="flex min-h-[28px] items-start gap-1">
        <p className="text-sm font-semibold text-[#0a2340]">{title}</p>
        {tooltip ? <TooltipInfo content={tooltip} side="top" /> : null}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
    </div>
  );
}

function healthLabel(health: UnitHealth): string {
  if (health === 'excellent') {
    return 'Alta eficiência';
  }
  if (health === 'good') {
    return 'Boa eficiência';
  }
  return 'Atenção';
}

function healthVariant(health: UnitHealth): 'success' | 'warning' | 'danger' {
  if (health === 'excellent') {
    return 'success';
  }
  if (health === 'good') {
    return 'warning';
  }
  return 'danger';
}
