'use client';

import { memo } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { HandCoins, Landmark } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TooltipInfo } from '@/components/ui/tooltip';
import type { DashboardDTO } from '@/lib/dashboard/dashboard-dto';
import { formatCurrency } from '@/lib/format';

interface FinanceChartClientProps {
  data: DashboardDTO['series_finance'];
}

function FinanceChartClientComponent({ data }: FinanceChartClientProps) {
  return (
    <Card className="rounded-2xl border border-sky-100/80 bg-white/90 shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Landmark className="h-5 w-5 text-sky-600" aria-hidden="true" />
          Resultados Financeiros (R$)
        </CardTitle>
        <CardDescription>
          Comparativo mensal entre valor total sem GD e economia GD para apoiar decisões de impacto
          financeiro.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1 rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1">
            <HandCoins className="h-3.5 w-3.5 text-sky-600" aria-hidden="true" />
            Economia GD como proxy de benefício econômico direto
          </span>
          <TooltipInfo
            content="Valor Total sem GD (R$) = Energia Elétrica (R$) + Energia SCEEE s/ICMS (R$) + Contrib Ilum Pública (R$). Economia GD (R$) = Energia compensada GD I (R$)."
            side="top"
          />
        </div>

        <div className="h-[310px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 6, left: 6 }}>
              <defs>
                <linearGradient id="financialValueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.78} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
              <XAxis dataKey="monthLabel" tick={{ fill: '#475569', fontSize: 12 }} />
              <YAxis
                tickFormatter={(value) => `${value}`}
                tick={{ fill: '#475569', fontSize: 12 }}
                width={58}
              />
              <RechartsTooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => `Mês: ${label}`}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #bfdbfe',
                  background: 'rgba(255,255,255,0.95)',
                }}
              />
              <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 10 }} />
              <Bar
                name="Valor Total sem GD"
                dataKey="valorTotalSemGd"
                fill="url(#financialValueGradient)"
                radius={[8, 8, 0, 0]}
                maxBarSize={32}
              />
              <Line
                name="Economia GD"
                dataKey="economiaGd"
                type="monotone"
                stroke="#0f766e"
                strokeWidth={3}
                dot={{ fill: '#0f766e', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="sr-only">
          <p>Tabela de acessibilidade do gráfico financeiro</p>
          <table>
            <thead>
              <tr>
                <th>Mês</th>
                <th>Valor total sem GD</th>
                <th>Economia GD</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.monthRef}>
                  <td>{item.monthLabel}</td>
                  <td>{formatCurrency(item.valorTotalSemGd)}</td>
                  <td>{formatCurrency(item.economiaGd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export const FinanceChartClient = memo(FinanceChartClientComponent);
