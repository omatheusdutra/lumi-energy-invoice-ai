'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Route } from 'next';
import { useQueryClient } from '@tanstack/react-query';
import { CircleDollarSign, FileStack, Sparkles, Zap } from 'lucide-react';
import { z } from 'zod';
import { InvoicesFilters, type InvoiceFilterValues } from '@/components/invoices/invoices-filters';
import { InvoicesTable } from '@/components/invoices/invoices-table';
import { Pagination } from '@/components/invoices/pagination';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InlineAlert } from '@/components/ui/inline-alert';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipInfo } from '@/components/ui/tooltip';
import { RenderProfiler } from '@/components/common/render-profiler';
import { createInvoicesQueryKey, useInvoicesQuery } from '@/hooks/use-invoices-query';
import { fetchInvoices } from '@/lib/api/client';
import { formatCurrency, formatKwh, formatPercent } from '@/lib/format';
import { invoiceFiltersSchema, type InvoiceFilters } from '@/lib/api/query-schemas';

const searchSchema = z
  .object({
    numero_cliente: z.string().optional(),
    mes_referencia: z.string().optional(),
    periodo_inicio: z.string().optional(),
    periodo_fim: z.string().optional(),
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict();

const monthReferencePattern = /^(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\/\d{4}$/i;

export default function InvoicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const shouldFocusResultsRef = useRef(false);
  const resultsRegionRef = useRef<HTMLDivElement | null>(null);
  const [slowRequestDetected, setSlowRequestDetected] = useState(false);

  const parsedSearch = useMemo(() => {
    const raw = Object.fromEntries(searchParams.entries());
    const safe = searchSchema.safeParse(raw);
    return safe.success ? safe.data : {};
  }, [searchParams]);

  const activeFilters = useMemo<InvoiceFilters>(() => {
    const parsed = invoiceFiltersSchema.safeParse(parsedSearch);

    if (parsed.success) {
      return parsed.data;
    }

    return invoiceFiltersSchema.parse({ page: 1, pageSize: 20 });
  }, [parsedSearch]);

  const query = useInvoicesQuery(activeFilters);

  const syncUrl = useCallback(
    (next: InvoiceFilters) => {
      const params = new URLSearchParams();

      if (next.numero_cliente) params.set('numero_cliente', next.numero_cliente);
      if (next.mes_referencia) params.set('mes_referencia', next.mes_referencia);
      if (next.periodo_inicio) params.set('periodo_inicio', next.periodo_inicio);
      if (next.periodo_fim) params.set('periodo_fim', next.periodo_fim);
      params.set('page', String(next.page));
      params.set('pageSize', String(next.pageSize));

      const nextUrl = `/invoices?${params.toString()}`;
      const currentUrl = `/invoices${searchParams.size > 0 ? `?${searchParams.toString()}` : ''}`;

      if (nextUrl !== currentUrl) {
        // URL is the single source of truth for filters and pagination state.
        router.replace(nextUrl as Route, { scroll: false });
      }
    },
    [router, searchParams],
  );

  const updateFilters = useCallback(
    (values: InvoiceFilterValues) => {
      const normalized = {
        numero_cliente: normalizeOptional(values.numero_cliente),
        mes_referencia: normalizeOptional(values.mes_referencia),
        periodo_inicio: normalizeOptional(values.periodo_inicio),
        periodo_fim: normalizeOptional(values.periodo_fim),
      };

      const next = invoiceFiltersSchema.parse({
        ...activeFilters,
        ...normalized,
        page: 1,
      });

      shouldFocusResultsRef.current = true;
      syncUrl(next);
    },
    [activeFilters, syncUrl],
  );

  const clearFilters = useCallback(() => {
    const next = invoiceFiltersSchema.parse({ page: 1, pageSize: activeFilters.pageSize });
    shouldFocusResultsRef.current = true;
    syncUrl(next);
  }, [activeFilters.pageSize, syncUrl]);

  const changePage = useCallback(
    (page: number) => {
      const next = invoiceFiltersSchema.parse({ ...activeFilters, page });
      shouldFocusResultsRef.current = true;
      syncUrl(next);
    },
    [activeFilters, syncUrl],
  );

  const handleReactiveChange = useCallback(
    (values: Pick<InvoiceFilterValues, 'numero_cliente' | 'mes_referencia'>) => {
      const normalizedClient = normalizeOptional(values.numero_cliente);
      const monthCandidate = normalizeOptional(values.mes_referencia)?.toUpperCase();
      const normalizedMonth =
        monthCandidate && monthReferencePattern.test(monthCandidate) ? monthCandidate : undefined;

      if (
        normalizedClient === activeFilters.numero_cliente &&
        normalizedMonth === activeFilters.mes_referencia
      ) {
        return;
      }

      const next = invoiceFiltersSchema.parse({
        ...activeFilters,
        numero_cliente: normalizedClient,
        mes_referencia: normalizedMonth,
        page: 1,
      });

      // Reactive changes should not steal keyboard focus from active filter input.
      syncUrl(next);
    },
    [activeFilters, syncUrl],
  );

  const showInitialLoading = query.isPending && !query.data;

  useEffect(() => {
    if (!query.isFetching) {
      setSlowRequestDetected(false);
      return;
    }

    const timer = setTimeout(() => {
      setSlowRequestDetected(true);
    }, 8_000);

    return () => clearTimeout(timer);
  }, [query.isFetching]);

  useEffect(() => {
    if (!query.data || query.data.page >= query.data.totalPages) {
      return;
    }

    const nextPageFilters = invoiceFiltersSchema.parse({
      ...activeFilters,
      page: query.data.page + 1,
    });

    void queryClient.prefetchQuery({
      queryKey: createInvoicesQueryKey(nextPageFilters),
      queryFn: ({ signal }) => fetchInvoices(nextPageFilters, { signal }),
      staleTime: 45_000,
    });
  }, [activeFilters, query.data, queryClient]);

  useEffect(() => {
    if (!shouldFocusResultsRef.current) {
      return;
    }

    if (query.isFetching) {
      return;
    }

    const target = resultsRegionRef.current;
    if (target) {
      target.focus();
    }

    shouldFocusResultsRef.current = false;
  }, [query.isFetching, query.dataUpdatedAt, query.isError]);

  const pageSummary = useMemo(() => {
    const items = query.data?.data ?? [];
    const consumo = items.reduce((acc, item) => acc + item.consumoKwh, 0);
    const compensada = items.reduce((acc, item) => acc + item.energiaCompensadaKwh, 0);
    const economia = items.reduce((acc, item) => acc + item.economiaGdRs, 0);
    const valorSemGd = items.reduce((acc, item) => acc + item.valorTotalSemGd, 0);
    const cobertura = consumo > 0 ? (compensada / consumo) * 100 : 0;

    return {
      consumo,
      compensada,
      economia,
      valorSemGd,
      cobertura,
      totalRegistros: query.data?.total ?? 0,
    };
  }, [query.data]);

  return (
    <RenderProfiler id="InvoicesPage">
      <div className="space-y-6">
        <header className="space-y-2">
          <h2 className="font-[var(--font-heading)] text-3xl font-semibold tracking-tight">
            Faturas Processadas
          </h2>
          <p className="text-sm text-muted-foreground">
            Consulte faturas salvas, aplique filtros e acompanhe indicadores de consumo e economia.
          </p>
        </header>

        <Card className="border border-slate-200/80 bg-white/95 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.45)]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-[#0a2340]">
              <Sparkles className="h-5 w-5 text-sky-700" aria-hidden="true" />
              Visão de faturamento
            </CardTitle>
            <CardDescription className="text-sm text-slate-600">
              Cada fatura consolidada alimenta os painéis de energia e economia. Use os filtros para
              recortes operacionais por cliente, mês e período.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 space-y-0 md:grid-cols-3">
            <InfoItem
              title="Origem dos dados"
              description="Faturas processadas via upload de PDF multimodal e validadas no backend."
              tooltip="Os dados exibidos são persistidos no backend após validação da extração."
            />
            <InfoItem
              title="Comparabilidade"
              description="Cruze cliente e período para avaliar tendência de consumo e compensação."
              tooltip="A comparação usa os filtros ativos de cliente, mês e período."
            />
            <InfoItem
              title="Ação rápida"
              description="A tabela detalha base para decisões de crédito, economia GD e priorização."
              tooltip="Use a tabela para identificar picos de consumo e ganhos de compensação."
            />
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 bg-white/90 shadow-soft">
          <CardHeader>
            <CardTitle>Filtros de consulta</CardTitle>
            <CardDescription>
              Número do cliente, mês de referência e período para análises comparativas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InvoicesFilters
              defaultValues={activeFilters}
              onSubmit={updateFilters}
              onClear={clearFilters}
              onReactiveChange={handleReactiveChange}
              disabled={query.isFetching}
            />
          </CardContent>
        </Card>

        <section
          ref={resultsRegionRef}
          tabIndex={-1}
          aria-live="polite"
          aria-busy={query.isFetching}
          className="space-y-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {showInitialLoading ? (
            <Card>
              <CardContent className="space-y-3 pt-6">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ) : null}

          {query.isFetching && query.data ? (
            <InlineAlert
              title="Atualizando resultados"
              description="Carregando dados mais recentes..."
            />
          ) : null}

          {slowRequestDetected ? (
            <InlineAlert
              variant="danger"
              title="A consulta está demorando mais que o esperado"
              description="Verifique se a API está ativa em localhost:3000 e se o NEXT_PUBLIC_API_BASE_URL aponta para ela."
            />
          ) : null}

          {query.isError ? (
            <InlineAlert
              variant="danger"
              title="Falha ao carregar faturas"
              description={query.error instanceof Error ? query.error.message : 'Erro inesperado'}
            />
          ) : null}

          {query.data && query.data.data.length === 0 ? (
            <InlineAlert
              title="Nenhuma fatura encontrada"
              description="Ajuste os filtros ou envie novos PDFs em Upload."
            />
          ) : null}

          {query.data && query.data.data.length > 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryTile
                  icon={<FileStack className="h-5 w-5" aria-hidden="true" />}
                  label="Registros"
                  value={String(pageSummary.totalRegistros)}
                  hint="Total encontrado com os filtros ativos"
                  tooltip="Quantidade total de registros retornados para os filtros aplicados."
                />
                <SummaryTile
                  icon={<Zap className="h-5 w-5" aria-hidden="true" />}
                  label="Consumo (página)"
                  value={formatKwh(pageSummary.consumo)}
                  hint={`Cobertura: ${formatPercent(pageSummary.cobertura)}`}
                  tooltip="Soma do consumo dos registros exibidos na página atual."
                />
                <SummaryTile
                  icon={<FileStack className="h-5 w-5" aria-hidden="true" />}
                  label="Compensada (página)"
                  value={formatKwh(pageSummary.compensada)}
                  hint={`Valor sem GD: ${formatCurrency(pageSummary.valorSemGd)}`}
                  tooltip="Soma da energia compensada dos registros exibidos na página."
                />
                <SummaryTile
                  icon={<CircleDollarSign className="h-5 w-5" aria-hidden="true" />}
                  label="Economia GD (página)"
                  value={formatCurrency(pageSummary.economia)}
                  hint="Soma de economia dos registros exibidos"
                  tooltip="Total de economia GD considerando apenas os itens visíveis na página."
                />
              </div>

              <Card className="border border-slate-200/80 bg-white/90">
                <CardContent className="space-y-4 pt-6">
                  <InvoicesTable response={query.data} />
                  <Pagination
                    page={query.data.page}
                    totalPages={query.data.totalPages}
                    onPageChange={changePage}
                    disabled={query.isFetching}
                  />
                </CardContent>
              </Card>
            </>
          ) : null}
        </section>
      </div>
    </RenderProfiler>
  );
}

function normalizeOptional(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : undefined;
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
  hint: string;
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
