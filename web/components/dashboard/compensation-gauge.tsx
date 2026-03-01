import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatKwh, formatPercent } from '@/lib/format';

interface CompensationGaugeProps {
  consumedKwh: number;
  compensatedKwh: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function CompensationGauge({ consumedKwh, compensatedKwh }: CompensationGaugeProps) {
  const ratio = consumedKwh > 0 ? (compensatedKwh / consumedKwh) * 100 : 0;
  const percentage = clamp(ratio, 0, 100);

  const width = 240;
  const height = 140;
  const radius = 92;
  const centerX = width / 2;
  const centerY = height - 14;
  const circumference = Math.PI * radius;
  const dashOffset = circumference * (1 - percentage / 100);
  const tone =
    percentage >= 75 ? 'text-sky-600' : percentage >= 45 ? 'text-amber-600' : 'text-rose-600';

  const arcPath = `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`;

  return (
    <Card className="border border-border/80 bg-white/90 shadow-soft">
      <CardHeader>
        <CardTitle>Compensado vs Consumido</CardTitle>
        <CardDescription>Índice de compensação energética no período.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 overflow-hidden">
        <div
          className="mx-auto w-full max-w-[280px]"
          role="img"
          aria-label="Gauge de compensação de energia"
        >
          <svg viewBox={`0 0 ${width} ${height}`} className="h-[170px] w-full">
            <path
              d={arcPath}
              fill="none"
              stroke="rgba(148, 163, 184, 0.35)"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <path
              d={arcPath}
              fill="none"
              stroke={percentage >= 75 ? '#0ea5e9' : percentage >= 45 ? '#f59e0b' : '#ef4444'}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 700ms ease-out' }}
            />
            <text
              x={centerX}
              y={centerY - 14}
              textAnchor="middle"
              className="fill-slate-800 text-3xl font-bold"
            >
              {formatPercent(percentage)}
            </text>
            <text
              x={centerX}
              y={centerY + 4}
              textAnchor="middle"
              className="fill-slate-500 text-[11px] font-medium"
            >
              compensado do consumo
            </text>
          </svg>
        </div>

        <div className="grid gap-3 text-sm [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
          <Metric label="Energia consumida" value={formatKwh(consumedKwh)} />
          <Metric label="Energia compensada" value={formatKwh(compensatedKwh)} valueTone={tone} />
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, valueTone }: { label: string; value: string; valueTone?: string }) {
  return (
    <div className="min-w-0 rounded-md border border-border p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`text-base font-semibold text-slate-900 ${valueTone ?? ''}`}>{value}</p>
    </div>
  );
}
