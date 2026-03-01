const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 2,
});

const decimalFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatKwh(value: number): string {
  return `${decimalFormatter.format(value)} kWh`;
}

export function formatPercent(value: number): string {
  return `${decimalFormatter.format(value)}%`;
}

export function monthToDateLabel(monthRef: string): string {
  return monthRef.replace('/', ' / ');
}
