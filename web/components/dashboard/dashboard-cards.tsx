import { Bolt, BatteryCharging, PiggyBank, Wallet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatKwh, formatPercent } from '@/lib/format';

interface DashboardCardsProps {
  consumoTotal: number;
  energiaCompensadaTotal: number;
  valorSemGdTotal: number;
  economiaGdTotal: number;
  economiaPercentual?: number;
}

export function DashboardCards({
  consumoTotal,
  energiaCompensadaTotal,
  valorSemGdTotal,
  economiaGdTotal,
  economiaPercentual,
}: DashboardCardsProps) {
  const cards = [
    {
      title: 'Consumo Total',
      value: formatKwh(consumoTotal),
      icon: Bolt,
      subtitle: 'Soma de energia eletrica e SCEEE',
    },
    {
      title: 'Energia Compensada',
      value: formatKwh(energiaCompensadaTotal),
      icon: BatteryCharging,
      subtitle: 'Total compensado via GD',
    },
    {
      title: 'Valor Total sem GD',
      value: formatCurrency(valorSemGdTotal),
      icon: Wallet,
      subtitle: 'Custo sem abatimento de GD',
    },
    {
      title: 'Economia GD',
      value: formatCurrency(economiaGdTotal),
      icon: PiggyBank,
      subtitle:
        economiaPercentual !== undefined
          ? `Economia relativa: ${formatPercent(economiaPercentual)}`
          : 'Impacto financeiro da GD',
    },
  ];

  return (
    <section
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
      aria-label="Resumo executivo do dashboard"
    >
      {cards.map(({ title, value, icon: Icon, subtitle }) => (
        <Card key={title}>
          <CardHeader className="mb-2 flex-row items-start justify-between space-y-0">
            <div>
              <CardDescription>{title}</CardDescription>
              <CardTitle className="text-2xl font-bold tracking-tight">{value}</CardTitle>
            </div>
            <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
