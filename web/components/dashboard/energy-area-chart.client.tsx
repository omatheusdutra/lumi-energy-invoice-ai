'use client';

import { memo, useMemo } from 'react';
import type { ReactNode } from 'react';
import { CalendarClock, ChevronDown, Download, Filter } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatKwh } from '@/lib/format';
import type { MonthlyEnergyPoint } from '@/lib/dashboard/models';

interface EnergyAreaChartProps {
  data: MonthlyEnergyPoint[];
}

function EnergyAreaChartComponent({ data }: EnergyAreaChartProps) {
  const canAnimate = data.length <= 20;

  const accessibleRows = useMemo(
    () =>
      data.map((item) => ({
        mes: item.monthRef,
        gerada: Math.round(item.generatedKwh),
        consumida: Math.round(item.consumedKwh),
        compensada: Math.round(item.compensatedKwh),
      })),
    [data],
  );

  return (
    <Card className="border border-border/80 bg-white/90 shadow-soft">
      <CardHeader className="mb-2 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle>Geração x consumo x compensação</CardTitle>
          <CardDescription>Curva mensal de energia para análise operacional.</CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <HeaderChip icon={<Filter className="h-3.5 w-3.5" />} label="Usinas" />
          <HeaderChip
            icon={<span className="h-2 w-2 rounded-full bg-sky-600" aria-hidden="true" />}
            label="Energia Gerada"
            trailing={<ChevronDown className="h-3.5 w-3.5" />}
          />
          <HeaderChip icon={<CalendarClock className="h-3.5 w-3.5" />} label="Últimos 12 meses" />
          <HeaderChip icon={<Download className="h-3.5 w-3.5" />} label="Exportar" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="generatedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="consumedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.26} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.04} />
                </linearGradient>
                <linearGradient id="compensatedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.26} />
                  <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.32)" />
              <XAxis
                dataKey="monthRef"
                tickMargin={8}
                tick={{ fontSize: 12, fill: '#334155' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#334155' }}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                formatter={(value: number, name: string) => [formatKwh(value), name]}
                contentStyle={{
                  borderRadius: '0.75rem',
                  borderColor: 'rgba(148, 163, 184, 0.36)',
                  backgroundColor: '#ffffff',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="generatedKwh"
                name="Gerada"
                stroke="#38bdf8"
                fill="url(#generatedGradient)"
                strokeWidth={2.2}
                isAnimationActive={canAnimate}
              />
              <Area
                type="monotone"
                dataKey="consumedKwh"
                name="Consumida"
                stroke="#0ea5e9"
                fill="url(#consumedGradient)"
                strokeWidth={2.2}
                isAnimationActive={canAnimate}
              />
              <Area
                type="monotone"
                dataKey="compensatedKwh"
                name="Compensada"
                stroke="#1d4ed8"
                fill="url(#compensatedGradient)"
                strokeWidth={2.2}
                isAnimationActive={canAnimate}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="sr-only">
          <table>
            <caption>Dados mensais do gráfico de área</caption>
            <thead>
              <tr>
                <th>Mês</th>
                <th>Gerada</th>
                <th>Consumida</th>
                <th>Compensada</th>
              </tr>
            </thead>
            <tbody>
              {accessibleRows.map((row) => (
                <tr key={row.mes}>
                  <td>{row.mes}</td>
                  <td>{row.gerada}</td>
                  <td>{row.consumida}</td>
                  <td>{row.compensada}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export const EnergyAreaChart = memo(EnergyAreaChartComponent);

function HeaderChip({
  icon,
  label,
  trailing,
}: {
  icon: ReactNode;
  label: string;
  trailing?: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600">
      {icon}
      {label}
      {trailing}
    </span>
  );
}
