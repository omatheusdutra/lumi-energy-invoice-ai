'use client';

import { memo, useMemo } from 'react';
import type { ReactNode } from 'react';
import { CalendarClock, Download } from 'lucide-react';
import {
  Bar,
  BarChart,
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

interface EnergyBalanceBarProps {
  data: MonthlyEnergyPoint[];
}

function EnergyBalanceBarComponent({ data }: EnergyBalanceBarProps) {
  const bars = useMemo(() => data.slice(-6), [data]);

  return (
    <Card className="border border-border/80 bg-white/90 shadow-soft">
      <CardHeader className="mb-2 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle>Balanço energético mensal</CardTitle>
          <CardDescription>Comparativo de energia gerada, consumida e compensada.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <HeaderChip icon={<CalendarClock className="h-3.5 w-3.5" />} label="Últimos 12 meses" />
          <HeaderChip icon={<Download className="h-3.5 w-3.5" />} label="Exportar" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bars} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.32)" />
              <XAxis dataKey="monthRef" tick={{ fontSize: 12, fill: '#334155' }} />
              <YAxis tick={{ fontSize: 12, fill: '#334155' }} />
              <Tooltip
                formatter={(value: number, name: string) => [formatKwh(value), name]}
                contentStyle={{
                  borderRadius: '0.75rem',
                  borderColor: 'rgba(148, 163, 184, 0.36)',
                  backgroundColor: '#ffffff',
                }}
              />
              <Legend />
              <Bar dataKey="generatedKwh" name="Gerada" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              <Bar dataKey="consumedKwh" name="Consumida" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              <Bar
                dataKey="compensatedKwh"
                name="Compensada"
                fill="#1d4ed8"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="sr-only">
          <table>
            <caption>Tabela acessível do balanço energético</caption>
            <thead>
              <tr>
                <th>Mês</th>
                <th>Gerada</th>
                <th>Consumida</th>
                <th>Compensada</th>
              </tr>
            </thead>
            <tbody>
              {bars.map((row) => (
                <tr key={row.monthRef}>
                  <td>{row.monthRef}</td>
                  <td>{Math.round(row.generatedKwh)}</td>
                  <td>{Math.round(row.consumedKwh)}</td>
                  <td>{Math.round(row.compensatedKwh)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export const EnergyBalanceBarChart = memo(EnergyBalanceBarComponent);

function HeaderChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600">
      {icon}
      {label}
    </span>
  );
}
