'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatKwh } from '@/lib/format';

export interface MonthlyTrendPoint {
  mes_referencia: string;
  consumo_kwh: number;
  energia_compensada_kwh: number;
  valor_total_sem_gd: number;
  economia_gd: number;
}

interface MonthlyTrendsChartProps {
  data: MonthlyTrendPoint[];
}

export function MonthlyTrendsChart({ data }: MonthlyTrendsChartProps) {
  return (
    <section
      className="grid gap-4 lg:grid-cols-2"
      aria-label="Gráficos mensais de energia e financeiro"
    >
      <Card>
        <CardHeader>
          <CardTitle>Série mensal de energia</CardTitle>
          <CardDescription>
            Consumo total versus energia compensada ao longo do período.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(145, 158, 171, 0.24)" />
              <XAxis dataKey="mes_referencia" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(value) => `${value}`} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number, name: string) => [formatKwh(value), name]}
                contentStyle={{ borderRadius: '0.75rem', borderColor: 'rgba(145, 158, 171, 0.3)' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="consumo_kwh"
                name="Consumo"
                stroke="#0ea5e9"
                strokeWidth={2.4}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="energia_compensada_kwh"
                name="Compensada"
                stroke="#1d4ed8"
                strokeWidth={2.4}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Série mensal financeira</CardTitle>
          <CardDescription>
            Comparativo entre valor total sem GD e economia mensal de GD.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(145, 158, 171, 0.24)" />
              <XAxis dataKey="mes_referencia" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
                contentStyle={{ borderRadius: '0.75rem', borderColor: 'rgba(145, 158, 171, 0.3)' }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="valor_total_sem_gd"
                name="Valor sem GD"
                stroke="#f59e0b"
                fill="url(#valueGradient)"
                strokeWidth={2.2}
              />
              <Line
                type="monotone"
                dataKey="economia_gd"
                name="Economia GD"
                stroke="#06b6d4"
                strokeWidth={2.2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </section>
  );
}
