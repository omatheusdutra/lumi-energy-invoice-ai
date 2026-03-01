'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TooltipInfo } from '@/components/ui/tooltip';

export interface InvoiceFilterValues {
  numero_cliente?: string;
  mes_referencia?: string;
  periodo_inicio?: string;
  periodo_fim?: string;
}

interface InvoicesFiltersProps {
  defaultValues: InvoiceFilterValues;
  onSubmit: (filters: InvoiceFilterValues) => void;
  onClear: () => void;
  onReactiveChange?: (
    filters: Pick<InvoiceFilterValues, 'numero_cliente' | 'mes_referencia'>,
  ) => void;
  disabled?: boolean;
  debounceMs?: number;
}

export function InvoicesFilters({
  defaultValues,
  onSubmit,
  onClear,
  onReactiveChange,
  disabled = false,
  debounceMs = 450,
}: InvoicesFiltersProps) {
  const [values, setValues] = useState<InvoiceFilterValues>(defaultValues);

  useEffect(() => {
    // Keep form state synchronized with URL-derived filters from parent.
    setValues(defaultValues);
  }, [defaultValues]);

  useEffect(() => {
    if (!onReactiveChange || disabled) {
      return;
    }

    const timer = setTimeout(() => {
      onReactiveChange({
        numero_cliente: values.numero_cliente,
        mes_referencia: values.mes_referencia,
      });
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [debounceMs, disabled, onReactiveChange, values.mes_referencia, values.numero_cliente]);

  const updateField = useCallback((field: keyof InvoiceFilterValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  return (
    <form
      className="grid gap-4 md:grid-cols-12"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(values);
      }}
    >
      <Field
        label="Número do cliente"
        htmlFor="numero_cliente"
        tooltip="Use o número da UC para filtrar as faturas de um cliente específico."
        className="md:col-span-3"
      >
        <Input
          id="numero_cliente"
          aria-label="Filtro por número de cliente"
          placeholder="3001116735"
          disabled={disabled}
          value={values.numero_cliente ?? ''}
          onChange={(event) => updateField('numero_cliente', event.target.value)}
        />
      </Field>

      <Field
        label="Mês referência (MMM/YYYY, ex.: SET/2024)"
        htmlFor="mes_referencia"
        tooltip="Formato aceito: JAN/2024, FEV/2024 ... DEZ/2024."
        className="md:col-span-3"
      >
        <Input
          id="mes_referencia"
          aria-label="Filtro por mês de referência"
          placeholder="SET/2024"
          disabled={disabled}
          value={values.mes_referencia ?? ''}
          onChange={(event) => updateField('mes_referencia', event.target.value.toUpperCase())}
        />
      </Field>

      <Field
        label="Período início (YYYY-MM)"
        htmlFor="periodo_inicio"
        tooltip="Define o início da janela temporal para busca."
        className="md:col-span-3"
      >
        <Input
          id="periodo_inicio"
          aria-label="Filtro por período inicial"
          placeholder="2024-01"
          disabled={disabled}
          value={values.periodo_inicio ?? ''}
          onChange={(event) => updateField('periodo_inicio', event.target.value)}
        />
      </Field>

      <Field
        label="Período fim (YYYY-MM)"
        htmlFor="periodo_fim"
        tooltip="Define o fim da janela temporal para busca."
        className="md:col-span-3"
      >
        <Input
          id="periodo_fim"
          aria-label="Filtro por período final"
          placeholder="2024-12"
          disabled={disabled}
          value={values.periodo_fim ?? ''}
          onChange={(event) => updateField('periodo_fim', event.target.value)}
        />
      </Field>

      <div className="flex flex-wrap gap-2 md:col-span-12">
        <Button type="submit" className="min-w-32" disabled={disabled}>
          <Search className="mr-2 h-4 w-4" aria-hidden="true" />
          {disabled ? 'Atualizando...' : 'Buscar'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
          onClick={() => {
            setValues({});
            onClear();
          }}
          className="min-w-28"
        >
          Limpar
        </Button>
      </div>
    </form>
  );
}

function Field({
  children,
  label,
  tooltip,
  htmlFor,
  className,
}: {
  children: ReactNode;
  label: string;
  tooltip?: string;
  htmlFor: string;
  className?: string;
}) {
  return (
    <div className={className ? `${className} space-y-1` : 'space-y-1'}>
      <label
        htmlFor={htmlFor}
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        <span>{label}</span>
        {tooltip ? <TooltipInfo content={tooltip} side="top" /> : null}
      </label>
      {children}
    </div>
  );
}
