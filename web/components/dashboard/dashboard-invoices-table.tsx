'use client';

import { Fragment, memo, useMemo, useState } from 'react';
import { Eye, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/invoices/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipInfo } from '@/components/ui/tooltip';
import type { ListInvoicesResponse } from '@/lib/api/schemas';
import { formatCurrency, formatKwh, formatPercent } from '@/lib/format';

interface DashboardInvoicesTableProps {
  response: ListInvoicesResponse;
  onPageChange: (nextPage: number) => void;
  isFetching: boolean;
}

function DetailCell({
  label,
  value,
  className,
  valueClassName,
}: {
  label: string;
  value: string;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-sky-100/80 bg-sky-50/45 px-3 py-2 ${className ?? ''}`}
    >
      <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-semibold text-slate-900 ${valueClassName ?? ''}`}>{value}</p>
    </div>
  );
}

function DashboardInvoicesTableComponent({
  response,
  onPageChange,
  isFetching,
}: DashboardInvoicesTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const pageCoverage = useMemo(() => {
    const consumed = response.data.reduce((acc, item) => acc + item.consumoKwh, 0);
    const compensated = response.data.reduce((acc, item) => acc + item.energiaCompensadaKwh, 0);
    if (consumed <= 0) {
      return 0;
    }
    return (compensated / consumed) * 100;
  }, [response.data]);

  return (
    <Card className="rounded-2xl border border-sky-100/80 bg-white/95 shadow-soft">
      <CardHeader>
        <CardTitle className="text-[1.4rem]">Biblioteca de faturas</CardTitle>
        <CardDescription>
          Base detalhada para auditoria operacional e comparação energética/financeira por fatura.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-600">{response.total} fatura(s) encontrada(s)</p>
          <Tooltip content="Percentual de compensação nas faturas exibidas nesta página.">
            <span className="inline-flex items-center rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              Cobertura da página: {formatPercent(pageCoverage)}
            </span>
          </Tooltip>
        </div>

        <Table className="min-w-[1400px]" aria-label="Tabela detalhada de faturas">
          <TableHeader>
            <TableRow>
              <TableHead>Nº Cliente</TableHead>
              <TableHead>Mês referência</TableHead>
              <TableHead>Energia Elétrica</TableHead>
              <TableHead>SCEEE s/ICMS</TableHead>
              <TableHead>Compensada GD I</TableHead>
              <TableHead className="text-right">Contrib. Ilum</TableHead>
              <TableHead className="text-right">Consumo (kWh)</TableHead>
              <TableHead className="text-right">Compensada (kWh)</TableHead>
              <TableHead className="text-right">Valor sem GD</TableHead>
              <TableHead className="text-right">Economia GD</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {response.data.map((invoice) => {
              const compensationPercent =
                invoice.consumoKwh > 0
                  ? (invoice.energiaCompensadaKwh / invoice.consumoKwh) * 100
                  : 0;
              const isExpanded = expandedId === invoice.id;

              return (
                <Fragment key={invoice.id}>
                  <TableRow>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">
                          {invoice.numeroCliente}
                        </span>
                        <span className="break-all text-xs text-slate-500">
                          {invoice.sourceFilename}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>{invoice.mesReferencia}</TableCell>

                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-medium">{formatKwh(invoice.energiaEletricaKwh)}</p>
                        <p className="text-xs text-slate-500">
                          {formatCurrency(invoice.energiaEletricaRs)}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-medium">{formatKwh(invoice.energiaSceeeKwh)}</p>
                        <p className="text-xs text-slate-500">
                          {formatCurrency(invoice.energiaSceeeRs)}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-medium">{formatKwh(invoice.energiaCompensadaGdiKwh)}</p>
                        <p className="text-xs text-slate-500">
                          {formatCurrency(invoice.energiaCompensadaGdiRs)}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(invoice.contribIlumRs)}
                    </TableCell>

                    <TableCell className="text-right tabular-nums">
                      {formatKwh(invoice.consumoKwh)}
                    </TableCell>

                    <TableCell className="text-right tabular-nums">
                      <div className="inline-flex flex-col items-end">
                        <span>{formatKwh(invoice.energiaCompensadaKwh)}</span>
                        <span className="text-xs text-slate-500">
                          {formatPercent(compensationPercent)}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(invoice.valorTotalSemGd)}
                    </TableCell>

                    <TableCell className="text-right tabular-nums font-semibold text-sky-700">
                      {formatCurrency(invoice.economiaGdRs)}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            setExpandedId((current) => (current === invoice.id ? null : invoice.id))
                          }
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                          {isExpanded ? 'Ocultar' : 'Detalhes'}
                        </Button>
                        <Tooltip content="Endpoint de reprocessamento não disponibilizado neste backend.">
                          <span>
                            <Button type="button" size="sm" variant="ghost" disabled>
                              <RotateCcw className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                              Reprocessar
                            </Button>
                          </span>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>

                  {isExpanded ? (
                    <TableRow className="bg-sky-50/40">
                      <TableCell colSpan={11}>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-12">
                          <DetailCell
                            className="xl:col-span-3"
                            label="ID da fatura"
                            value={invoice.id}
                            valueClassName="break-all leading-5"
                          />
                          <DetailCell
                            className="xl:col-span-4"
                            label="Hash SHA-256"
                            value={invoice.hashSha256}
                            valueClassName="break-all font-mono text-[0.82rem] leading-5"
                          />
                          <DetailCell
                            className="xl:col-span-2"
                            label="Data de criação"
                            value={new Date(invoice.createdAt).toLocaleString('pt-BR')}
                            valueClassName="whitespace-nowrap"
                          />
                          <DetailCell
                            className="xl:col-span-3"
                            label="Cliente/mês"
                            value={`${invoice.numeroCliente} · ${invoice.mesReferencia}`}
                            valueClassName="whitespace-nowrap"
                          />
                          <DetailCell
                            className="md:col-span-2 xl:col-span-12"
                            label="Chave de deduplicação"
                            value={invoice.dedupCompositeKey}
                            valueClassName="break-all font-mono text-[0.82rem] leading-5"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>

        <Pagination
          page={response.page}
          totalPages={response.totalPages}
          onPageChange={onPageChange}
          disabled={isFetching}
        />
      </CardContent>
    </Card>
  );
}

export const DashboardInvoicesTable = memo(DashboardInvoicesTableComponent);
