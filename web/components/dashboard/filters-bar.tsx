'use client';

import { memo } from 'react';
import { CalendarClock, Filter, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TooltipInfo } from '@/components/ui/tooltip';

export interface DashboardFilterDraft {
  numero_cliente: string;
  mes_referencia: string;
  periodo_inicio: string;
  periodo_fim: string;
}

interface FiltersBarProps {
  value: DashboardFilterDraft;
  onChange: (field: keyof DashboardFilterDraft, value: string) => void;
  onApply: () => void;
  onClear: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdatedLabel: string;
}

function Label({ htmlFor, text, tooltip }: { htmlFor: string; text: string; tooltip: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="inline-flex h-5 items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500"
    >
      <span>{text}</span>
      <TooltipInfo content={tooltip} side="top" ariaLabel={`Ajuda sobre ${text}`} />
    </label>
  );
}

function FiltersBarComponent({
  value,
  onChange,
  onApply,
  onClear,
  onRefresh,
  isRefreshing,
  lastUpdatedLabel,
}: FiltersBarProps) {
  return (
    <Card className="rounded-2xl border border-sky-100/80 bg-white/90 shadow-soft">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-[1.45rem]">
              <Filter className="h-5 w-5 text-sky-600" aria-hidden="true" />
              Visão consolidada das faturas processadas
            </CardTitle>
            <CardDescription className="mt-1 text-[0.95rem]">
              Painel de energia e finanças com foco em eficiência e impacto econômico positivo.
            </CardDescription>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50/70 px-3 py-1.5 text-xs font-medium text-sky-700">
            <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
            Última atualização: {lastUpdatedLabel}
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="dashboard-numero-cliente"
              text="Número do cliente"
              tooltip="Filtra por unidade consumidora específica."
            />
            <Input
              id="dashboard-numero-cliente"
              value={value.numero_cliente}
              onChange={(event) => onChange('numero_cliente', event.target.value)}
              placeholder="3001116735"
              aria-label="Filtro por número do cliente"
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="dashboard-mes-referencia"
              text="Mês referência"
              tooltip="Formato MMM/YYYY. Exemplo: SET/2024."
            />
            <Input
              id="dashboard-mes-referencia"
              value={value.mes_referencia}
              onChange={(event) => onChange('mes_referencia', event.target.value.toUpperCase())}
              placeholder="SET/2024"
              aria-label="Filtro por mês de referência"
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="dashboard-periodo-inicio"
              text="Período início"
              tooltip="Início da janela temporal no formato YYYY-MM."
            />
            <Input
              id="dashboard-periodo-inicio"
              value={value.periodo_inicio}
              onChange={(event) => onChange('periodo_inicio', event.target.value)}
              placeholder="2024-01"
              aria-label="Filtro por período inicial"
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="dashboard-periodo-fim"
              text="Período fim"
              tooltip="Fim da janela temporal no formato YYYY-MM."
            />
            <Input
              id="dashboard-periodo-fim"
              value={value.periodo_fim}
              onChange={(event) => onChange('periodo_fim', event.target.value)}
              placeholder="2024-12"
              aria-label="Filtro por período final"
              className="h-11"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={onApply}>
            Aplicar filtros
          </Button>
          <Button type="button" variant="secondary" onClick={onClear}>
            Limpar
          </Button>
          <Button type="button" variant="ghost" onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar dados
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export const FiltersBar = memo(FiltersBarComponent);
