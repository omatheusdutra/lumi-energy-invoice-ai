import { DatabaseZap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface EmptyStateProps {
  onReset: () => void;
}

export function EmptyState({ onReset }: EmptyStateProps) {
  return (
    <Card className="rounded-2xl border border-dashed border-sky-200 bg-white/80 text-center shadow-soft">
      <CardHeader className="items-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-sky-700">
          <DatabaseZap className="h-6 w-6" aria-hidden="true" />
        </div>
        <CardTitle className="text-2xl">Sem dados para os filtros selecionados</CardTitle>
        <CardDescription className="max-w-2xl">
          Ajuste número do cliente, mês de referência ou período. O painel exibe apenas os
          indicadores oficiais do teste: energia (kWh) e financeiro (R$).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" variant="secondary" onClick={onReset}>
          Limpar filtros
        </Button>
      </CardContent>
    </Card>
  );
}
