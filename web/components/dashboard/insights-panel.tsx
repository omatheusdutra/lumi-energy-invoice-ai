import { memo } from 'react';
import { ArrowDownRight, ArrowUpRight, BellRing, Gauge } from 'lucide-react';
import { type AlertsResponse, type KpiDashboard } from '@/lib/api/schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatPercent } from '@/lib/format';
import { sanitizeText } from '@/lib/security/sanitize';

interface InsightsPanelProps {
  alerts?: AlertsResponse;
  kpis?: KpiDashboard;
  fallbackTrendPercent: number;
  fallbackEstimatedEconomy: number;
}

function InsightsPanelComponent({
  alerts,
  kpis,
  fallbackTrendPercent,
  fallbackEstimatedEconomy,
}: InsightsPanelProps) {
  const trendPercent = kpis?.tendencia_6_meses_percent ?? fallbackTrendPercent;
  const economyPercent = kpis?.economia_percentual;
  const estimatedEconomy = fallbackEstimatedEconomy;
  const visibleAlerts = alerts?.data.slice(0, 4) ?? [];
  const hasAlerts = visibleAlerts.length > 0;

  return (
    <section
      className="grid gap-4 lg:grid-cols-[1.35fr_1fr]"
      aria-label="Insights e alertas operacionais"
    >
      <Card className="border border-border/80 bg-white/90 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-primary" aria-hidden="true" />
            Insights & Alerts
          </CardTitle>
          <CardDescription>
            Indicadores de anomalia e tendência de consumo do cliente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasAlerts ? (
            <ul className="space-y-3" aria-label="Lista de alertas">
              {visibleAlerts.map((alert) => (
                <li key={alert.id} className="rounded-md border border-border p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{sanitizeText(alert.message)}</p>
                    <Badge variant={alert.severity === 'CRITICAL' ? 'danger' : 'warning'}>
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cliente {alert.numeroCliente} - {alert.mesReferencia}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum alerta persistido disponível. Exibindo insights estimados pelo histórico local.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border border-border/80 bg-white/90 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" aria-hidden="true" />
            Tendências
          </CardTitle>
          <CardDescription>Resumo rápido do comportamento energético.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <Stat
            label="Tendência de consumo"
            value={formatPercent(trendPercent)}
            rising={trendPercent >= 0}
            tone={trendPercent >= 0 ? 'warning' : 'success'}
          />
          <Stat
            label="Economia percentual"
            value={economyPercent !== undefined ? formatPercent(economyPercent) : 'N/D'}
            rising={false}
            tone="success"
          />
          <Stat
            label="Impacto estimado"
            value={formatCurrency(estimatedEconomy)}
            rising={false}
            tone="success"
          />
        </CardContent>
      </Card>
    </section>
  );
}

function Stat({
  label,
  value,
  rising,
  tone,
}: {
  label: string;
  value: string;
  rising: boolean;
  tone: 'success' | 'warning';
}) {
  const Icon = rising ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border p-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-base font-semibold">{value}</p>
      </div>
      <Icon
        className={`h-5 w-5 ${tone === 'success' ? 'text-success' : 'text-warning'}`}
        aria-hidden="true"
      />
    </div>
  );
}

export const InsightsPanel = memo(InsightsPanelComponent);
