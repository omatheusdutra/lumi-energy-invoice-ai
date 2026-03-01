import { describe, expect, it, vi } from 'vitest';
import { buildDashboardDto } from '@/lib/dashboard/dashboard-dto';

describe('buildDashboardDto', () => {
  it('maps API payloads to the strict dashboard DTO', () => {
    const dto = buildDashboardDto({
      energy: {
        consumo_kwh_total: 506,
        energia_compensada_kwh_total: 456,
        series: [
          {
            mes_referencia: 'JAN/2024',
            consumo_kwh: 240,
            energia_compensada_kwh: 190,
          },
          {
            mes_referencia: 'FEV/2024',
            consumo_kwh: 266,
            energia_compensada_kwh: 266,
          },
        ],
      },
      financial: {
        valor_total_sem_gd_total: 329.6,
        economia_gd_total: 222.22,
        series: [
          {
            mes_referencia: 'JAN/2024',
            valor_total_sem_gd: 150.2,
            economia_gd: 90.12,
          },
          {
            mes_referencia: 'FEV/2024',
            valor_total_sem_gd: 179.4,
            economia_gd: 132.1,
          },
        ],
      },
      filters: {
        numero_cliente: '3001116735',
      },
      updatedAt: Date.parse('2026-02-28T03:00:00.000Z'),
    });

    expect(dto.kpis).toHaveLength(4);
    expect(dto.kpis[0].label).toContain('Consumo');
    expect(dto.kpis[2].unit).toBe('R$');
    expect(dto.kpis[3].value).toBeCloseTo(222.22);
    expect(dto.meta.rangeStart).toBe('JAN/2024');
    expect(dto.meta.rangeEnd).toBe('FEV/2024');
    expect(dto.meta.filters.numero_cliente).toBe('3001116735');
  });

  it('returns null trend when there is no previous month', () => {
    const dto = buildDashboardDto({
      energy: {
        consumo_kwh_total: 100,
        energia_compensada_kwh_total: 40,
        series: [
          {
            mes_referencia: 'MAR/2024',
            consumo_kwh: 100,
            energia_compensada_kwh: 40,
          },
        ],
      },
      financial: {
        valor_total_sem_gd_total: 80,
        economia_gd_total: 20,
        series: [
          {
            mes_referencia: 'MAR/2024',
            valor_total_sem_gd: 80,
            economia_gd: 20,
          },
        ],
      },
      filters: {},
      updatedAt: Date.parse('2026-02-28T03:00:00.000Z'),
    });

    expect(dto.kpis.every((item) => item.trendPercent === null)).toBe(true);
    expect(dto.series_energy[0].monthLabel).toBe('MAR / 2024');
  });

  it('falls back to now when updatedAt is invalid and keeps invalid month refs at the end', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-28T12:00:00.000Z'));

    const dto = buildDashboardDto({
      energy: {
        consumo_kwh_total: 220,
        energia_compensada_kwh_total: 70,
        series: [
          {
            mes_referencia: '/2040',
            consumo_kwh: 110,
            energia_compensada_kwh: 20,
          },
          {
            mes_referencia: 'JAN/2024',
            consumo_kwh: 110,
            energia_compensada_kwh: 50,
          },
        ],
      },
      financial: {
        valor_total_sem_gd_total: 150,
        economia_gd_total: 30,
        series: [
          {
            mes_referencia: 'JAN/2024',
            valor_total_sem_gd: 80,
            economia_gd: 20,
          },
          {
            mes_referencia: '/2040',
            valor_total_sem_gd: 70,
            economia_gd: 10,
          },
        ],
      },
      filters: {},
      updatedAt: Number.NaN,
    });

    expect(dto.meta.rangeStart).toBe('JAN/2024');
    expect(dto.meta.rangeEnd).toBe('/2040');
    expect(dto.meta.updatedAt).toBe('2026-02-28T12:00:00.000Z');

    vi.useRealTimers();
  });

  it('supports empty series and returns null trend across all KPI cards', () => {
    const dto = buildDashboardDto({
      energy: {
        consumo_kwh_total: 0,
        energia_compensada_kwh_total: 0,
        series: [],
      },
      financial: {
        valor_total_sem_gd_total: 0,
        economia_gd_total: 0,
        series: [],
      },
      filters: {},
      updatedAt: Date.parse('2026-02-28T03:00:00.000Z'),
    });

    expect(dto.kpis.every((item) => item.trendPercent === null)).toBe(true);
    expect(dto.series_energy).toEqual([]);
    expect(dto.series_finance).toEqual([]);
    expect(dto.meta.rangeStart).toBeUndefined();
    expect(dto.meta.rangeEnd).toBeUndefined();
  });

  it('returns null trend when previous month value is zero', () => {
    const dto = buildDashboardDto({
      energy: {
        consumo_kwh_total: 30,
        energia_compensada_kwh_total: 10,
        series: [
          { mes_referencia: 'JAN/2024', consumo_kwh: 0, energia_compensada_kwh: 0 },
          { mes_referencia: 'FEV/2024', consumo_kwh: 30, energia_compensada_kwh: 10 },
        ],
      },
      financial: {
        valor_total_sem_gd_total: 20,
        economia_gd_total: 5,
        series: [
          { mes_referencia: 'JAN/2024', valor_total_sem_gd: 0, economia_gd: 0 },
          { mes_referencia: 'FEV/2024', valor_total_sem_gd: 20, economia_gd: 5 },
        ],
      },
      filters: {},
      updatedAt: Date.parse('2026-02-28T03:00:00.000Z'),
    });

    expect(dto.kpis.every((item) => item.trendPercent === null)).toBe(true);
  });

  it('treats month refs without year token as invalid for sorting', () => {
    const dto = buildDashboardDto({
      energy: {
        consumo_kwh_total: 20,
        energia_compensada_kwh_total: 10,
        series: [
          { mes_referencia: 'JAN', consumo_kwh: 10, energia_compensada_kwh: 5 },
          { mes_referencia: 'FEV/2024', consumo_kwh: 10, energia_compensada_kwh: 5 },
        ],
      },
      financial: {
        valor_total_sem_gd_total: 20,
        economia_gd_total: 4,
        series: [
          { mes_referencia: 'FEV/2024', valor_total_sem_gd: 10, economia_gd: 2 },
          { mes_referencia: 'JAN', valor_total_sem_gd: 10, economia_gd: 2 },
        ],
      },
      filters: {},
      updatedAt: Date.parse('2026-02-28T03:00:00.000Z'),
    });

    expect(dto.meta.rangeStart).toBe('FEV/2024');
    expect(dto.meta.rangeEnd).toBe('JAN');
  });
});
