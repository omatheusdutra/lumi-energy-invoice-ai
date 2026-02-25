const MONTHS: Record<string, number> = {
  JAN: 0,
  FEV: 1,
  MAR: 2,
  ABR: 3,
  MAI: 4,
  JUN: 5,
  JUL: 6,
  AGO: 7,
  SET: 8,
  OUT: 9,
  NOV: 10,
  DEZ: 11,
};

export function normalizeMesReferencia(value: string): string {
  const normalized = value.trim().toUpperCase();
  const match = normalized.match(/^(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\/(\d{4})$/);

  if (!match) {
    throw new Error('Invalid month reference. Use MMM/YYYY, for example SET/2024');
  }

  return `${match[1]}/${match[2]}`;
}

export function mesReferenciaToDate(mesReferencia: string): Date {
  const normalized = normalizeMesReferencia(mesReferencia);
  const [month, year] = normalized.split('/');
  if (!month || !year) {
    throw new Error('Invalid month reference');
  }

  const monthIndex = MONTHS[month as keyof typeof MONTHS];

  if (monthIndex === undefined) {
    throw new Error('Invalid month reference');
  }

  return new Date(Date.UTC(Number(year), monthIndex, 1));
}

export function parsePeriodoInicio(value?: string): Date | undefined {
  if (!value) {
    return undefined;
  }

  const match = value.trim().match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    throw new Error('Invalid periodo_inicio. Use YYYY-MM');
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  return new Date(Date.UTC(year, month - 1, 1));
}

export function parsePeriodoFim(value?: string): Date | undefined {
  if (!value) {
    return undefined;
  }

  const match = value.trim().match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    throw new Error('Invalid periodo_fim. Use YYYY-MM');
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  return new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
}
