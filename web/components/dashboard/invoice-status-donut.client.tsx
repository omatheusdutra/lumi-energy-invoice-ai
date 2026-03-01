'use client';

import { memo, useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { InvoiceStatusSlice } from '@/lib/dashboard/models';

interface InvoiceStatusDonutProps {
  data: InvoiceStatusSlice[];
}

function InvoiceStatusDonutComponent({ data }: InvoiceStatusDonutProps) {
  const total = useMemo(() => data.reduce((acc, item) => acc + item.value, 0), [data]);

  return (
    <Card className="border border-border/80 bg-white/90 shadow-soft">
      <CardHeader>
        <CardTitle>Status de faturas</CardTitle>
        <CardDescription>Monitoramento do pipeline de processamento de faturas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 overflow-hidden">
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={68}
                outerRadius={104}
                dataKey="value"
                nameKey="label"
                stroke="#ffffff"
                strokeWidth={2}
                paddingAngle={2}
                animationDuration={600}
              >
                {data.map((item) => (
                  <Cell key={item.key} fill={item.color} />
                ))}
              </Pie>
              <Tooltip />
              <text
                x="50%"
                y="48%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-slate-700 text-sm font-semibold"
              >
                Total
              </text>
              <text
                x="50%"
                y="56%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-slate-900 text-2xl font-bold"
              >
                {total}
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <ul className="grid gap-2 sm:grid-cols-2" aria-label="Legenda de status das faturas">
          {data.map((item) => (
            <li
              key={item.key}
              className="flex items-center justify-between rounded-md border border-border p-2"
            >
              <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                {item.label}
              </span>
              <span className="text-sm font-semibold text-slate-900">{item.value}</span>
            </li>
          ))}
        </ul>

        <div className="sr-only">
          <table>
            <caption>Status de faturas</caption>
            <thead>
              <tr>
                <th>Status</th>
                <th>Quantidade</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.key}>
                  <td>{row.label}</td>
                  <td>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export const InvoiceStatusDonut = memo(InvoiceStatusDonutComponent);
