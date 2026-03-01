import { Banknote, BarChartHorizontal, PiggyBank, ReceiptText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercent } from '@/lib/format';
import type { FinancialSummaryItem } from '@/lib/dashboard/models';

interface FinancialSummaryPanelProps {
  items: FinancialSummaryItem[];
}

const iconByMetric: Record<FinancialSummaryItem['id'], LucideIcon> = {
  valueWithoutGd: ReceiptText,
  gdSavings: PiggyBank,
  averageTicket: Banknote,
  compensationRatio: BarChartHorizontal,
};

export function FinancialSummaryPanel({ items }: FinancialSummaryPanelProps) {
  return (
    <Card className="h-full border border-border/80 bg-white/90 shadow-soft">
      <CardHeader>
        <CardTitle>Resumo financeiro</CardTitle>
        <CardDescription>Indicadores de custo e retorno para tomada de decisão.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {items.map((item) => {
          const Icon = iconByMetric[item.id];
          const displayValue =
            item.type === 'currency'
              ? formatCurrency(item.value)
              : item.type === 'percent'
                ? formatPercent(item.value)
                : String(item.value);

          return (
            <article
              key={item.id}
              className="rounded-xl border border-slate-200 bg-white p-0 transition hover:border-sky-300"
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {item.label}
                </p>
                <Icon className="h-4 w-4 text-sky-700" aria-hidden="true" />
              </div>
              <div className="px-3 py-3">
                <p className="inline-flex rounded-md bg-sky-800 px-2.5 py-1 text-lg font-semibold text-white">
                  {displayValue}
                </p>
                <p className="mt-2 text-xs text-slate-500">{item.description}</p>
              </div>
            </article>
          );
        })}
      </CardContent>
    </Card>
  );
}
