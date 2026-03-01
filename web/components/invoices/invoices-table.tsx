import { memo, useMemo } from 'react';
import { type ListInvoicesResponse } from '@/lib/api/schemas';
import { formatCurrency, formatKwh, formatPercent } from '@/lib/format';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';

interface InvoicesTableProps {
  response: ListInvoicesResponse;
}

function InvoicesTableComponent({ response }: InvoicesTableProps) {
  const sortedInvoices = useMemo(() => {
    return [...response.data].sort((a, b) => {
      if (b.economiaGdRs !== a.economiaGdRs) {
        return b.economiaGdRs - a.economiaGdRs;
      }
      return b.consumoKwh - a.consumoKwh;
    });
  }, [response.data]);

  const pageCoverage = useMemo(() => {
    const consumed = response.data.reduce((acc, item) => acc + item.consumoKwh, 0);
    const compensated = response.data.reduce((acc, item) => acc + item.energiaCompensadaKwh, 0);
    if (consumed <= 0) {
      return 0;
    }

    return (compensated / consumed) * 100;
  }, [response.data]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2" aria-live="polite">
        <p className="text-sm text-muted-foreground">{response.total} registro(s) encontrado(s)</p>
        <div className="flex flex-wrap items-center gap-2">
          <Tooltip content="Percentual de energia compensada sobre o consumo das faturas exibidas na página.">
            <Badge variant="neutral">Cobertura da página: {formatPercent(pageCoverage)}</Badge>
          </Tooltip>
          <Tooltip content="A tabela está ordenada por Economia GD (maior para menor).">
            <Badge variant="success">Ordenação visual: maior Economia GD</Badge>
          </Tooltip>
        </div>
      </div>

      <Table aria-label="Tabela de faturas de energia" className="min-w-[980px]">
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Mês</TableHead>
            <TableHead className="text-right">Consumo</TableHead>
            <TableHead className="text-right">Compensada</TableHead>
            <TableHead className="text-right">Compensação %</TableHead>
            <TableHead className="text-right">Valor sem GD</TableHead>
            <TableHead className="text-right">Economia GD</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedInvoices.map((invoice) => {
            const compensationPercent =
              invoice.consumoKwh > 0
                ? (invoice.energiaCompensadaKwh / invoice.consumoKwh) * 100
                : 0;
            const compensationVariant =
              compensationPercent >= 70
                ? 'success'
                : compensationPercent >= 45
                  ? 'warning'
                  : 'danger';

            return (
              <TableRow key={invoice.id}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-slate-900">{invoice.numeroCliente}</span>
                    <span className="text-xs text-muted-foreground">{invoice.sourceFilename}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="neutral">{invoice.mesReferencia}</Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatKwh(invoice.consumoKwh)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatKwh(invoice.energiaCompensadaKwh)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <div className="inline-flex justify-end">
                    <Tooltip content="Relação entre energia compensada e consumo desta fatura.">
                      <Badge variant={compensationVariant}>
                        {formatPercent(compensationPercent)}
                      </Badge>
                    </Tooltip>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(invoice.valorTotalSemGd)}
                </TableCell>
                <TableCell className="text-right tabular-nums font-semibold text-success">
                  {formatCurrency(invoice.economiaGdRs)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export const InvoicesTable = memo(InvoicesTableComponent);
