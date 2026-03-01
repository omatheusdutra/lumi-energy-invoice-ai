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
import { Bolt, Leaf } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TooltipInfo } from '@/components/ui/tooltip';
import type { DashboardDTO } from '@/lib/dashboard/dashboard-dto';
import { formatKwh } from '@/lib/format';

interface EnergyChartClientProps {
  data: DashboardDTO['series_energy'];
}

function EnergyChartClientComponent({ data }: EnergyChartClientProps) {
  return (
    <Card className="rounded-2xl border border-sky-100/80 bg-white/90 shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bolt className="h-5 w-5 text-sky-600" aria-hidden="true" />
          Resultados de Energia (kWh)
        </CardTitle>
        <CardDescription>
          Comparativo mensal entre consumo e energia compensada, conforme o escopo obrigatório do
          teste.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1 rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1">
            <Leaf className="h-3.5 w-3.5 text-sky-600" aria-hidden="true" />
            Impacto operacional: economia e compensação sem extrapolar métricas
          </span>
          <TooltipInfo
            content="Consumo (kWh) = Energia Elétrica (kWh) + Energia SCEEE s/ICMS (kWh). Energia Compensada (kWh) = Energia compensada GD I (kWh)."
            side="top"
          />
        </div>

        <div className="h-[310px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 6, left: 4 }}>
              <defs>
                <linearGradient id="energyConsumptionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.75} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
              <XAxis dataKey="monthLabel" tick={{ fill: '#475569', fontSize: 12 }} />
              <YAxis
                tick={{ fill: '#475569', fontSize: 12 }}
                tickFormatter={(value) => `${value}`}
                width={58}
              />
              <RechartsTooltip
                formatter={(value: number) => formatKwh(value)}
                labelFormatter={(label) => `Mês: ${label}`}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #bfdbfe',
                  background: 'rgba(255,255,255,0.95)',
                }}
              />
              <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 10 }} />
              <Bar
                name="Consumo de Energia Elétrica"
                dataKey="consumoKwh"
                fill="url(#energyConsumptionGradient)"
                radius={[8, 8, 0, 0]}
                maxBarSize={32}
              />
              <Line
                name="Energia Compensada"
                type="monotone"
                dataKey="energiaCompensadaKwh"
                stroke="#1d4ed8"
                strokeWidth={3}
                dot={{ fill: '#1d4ed8', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="sr-only">
          <p>Tabela de acessibilidade do gráfico de energia</p>
          <table>
            <thead>
              <tr>
                <th>Mês</th>
                <th>Consumo</th>
                <th>Compensada</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.monthRef}>
                  <td>{item.monthLabel}</td>
                  <td>{formatKwh(item.consumoKwh)}</td>
                  <td>{formatKwh(item.energiaCompensadaKwh)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export const EnergyChartClient = memo(EnergyChartClientComponent);
