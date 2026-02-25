import {
  CLIENT_NUMBER_FIELD,
  ELECTRIC_ENERGY_FIELD,
  GD_COMPENSATED_ENERGY_FIELD,
  PUBLIC_LIGHTING_FIELD,
  REFERENCE_MONTH_FIELD,
  SCEEE_ENERGY_FIELD,
} from '../../../src/integrations/llm/prompt';
import { mapExtractedInvoiceToDomain } from '../../../src/modules/invoices/mappers/llm-to-domain.mapper';

describe('llm-to-domain mapper', () => {
  it('maps mandatory fields into domain structure', () => {
    const mapped = mapExtractedInvoiceToDomain({
      [CLIENT_NUMBER_FIELD]: '3001116735',
      [REFERENCE_MONTH_FIELD]: 'SET/2024',
      [ELECTRIC_ENERGY_FIELD]: { quantidade_kwh: '100', valor_rs: '50,00' },
      [SCEEE_ENERGY_FIELD]: { quantidade_kwh: '20', valor_rs: '10,00' },
      [GD_COMPENSATED_ENERGY_FIELD]: { quantidade_kwh: '30', valor_rs: '15,00' },
      [PUBLIC_LIGHTING_FIELD]: { valor_rs: '5,00' },
    });

    expect(mapped.numeroCliente).toBe('3001116735');
    expect(mapped.mesReferencia).toBe('SET/2024');
    expect(mapped.energiaEletricaKwh).toBe(100);
  });

  it('rejects negative numeric values from LLM payload', () => {
    expect(() =>
      mapExtractedInvoiceToDomain({
        [CLIENT_NUMBER_FIELD]: '3001116735',
        [REFERENCE_MONTH_FIELD]: 'SET/2024',
        [ELECTRIC_ENERGY_FIELD]: { quantidade_kwh: '-100', valor_rs: '50,00' },
        [SCEEE_ENERGY_FIELD]: { quantidade_kwh: '20', valor_rs: '10,00' },
        [GD_COMPENSATED_ENERGY_FIELD]: { quantidade_kwh: '30', valor_rs: '15,00' },
        [PUBLIC_LIGHTING_FIELD]: { valor_rs: '5,00' },
      }),
    ).toThrow('invalid negative numeric values');
  });

  it('normalizes negative GD compensation values to positive domain values', () => {
    const mapped = mapExtractedInvoiceToDomain({
      [CLIENT_NUMBER_FIELD]: '3001116735',
      [REFERENCE_MONTH_FIELD]: 'SET/2024',
      [ELECTRIC_ENERGY_FIELD]: { quantidade_kwh: '100', valor_rs: '50,00' },
      [SCEEE_ENERGY_FIELD]: { quantidade_kwh: '20', valor_rs: '10,00' },
      [GD_COMPENSATED_ENERGY_FIELD]: { quantidade_kwh: '-30', valor_rs: '-15,00' },
      [PUBLIC_LIGHTING_FIELD]: { valor_rs: '5,00' },
    });

    expect(mapped.energiaCompensadaGdiKwh).toBe(30);
    expect(mapped.energiaCompensadaGdiRs).toBe(15);
  });

  it('rejects payload when required fields are missing', () => {
    expect(() =>
      mapExtractedInvoiceToDomain({
        [CLIENT_NUMBER_FIELD]: null,
        [REFERENCE_MONTH_FIELD]: 'SET/2024',
        [ELECTRIC_ENERGY_FIELD]: { quantidade_kwh: '100', valor_rs: '50,00' },
        [SCEEE_ENERGY_FIELD]: { quantidade_kwh: '20', valor_rs: '10,00' },
        [GD_COMPENSATED_ENERGY_FIELD]: { quantidade_kwh: '30', valor_rs: '15,00' },
        [PUBLIC_LIGHTING_FIELD]: { valor_rs: '5,00' },
      }),
    ).toThrow('incomplete required fields');
  });

  it('rejects payload when month format is invalid', () => {
    expect(() =>
      mapExtractedInvoiceToDomain({
        [CLIENT_NUMBER_FIELD]: '3001116735',
        [REFERENCE_MONTH_FIELD]: '2024-09',
        [ELECTRIC_ENERGY_FIELD]: { quantidade_kwh: '100', valor_rs: '50,00' },
        [SCEEE_ENERGY_FIELD]: { quantidade_kwh: '20', valor_rs: '10,00' },
        [GD_COMPENSATED_ENERGY_FIELD]: { quantidade_kwh: '30', valor_rs: '15,00' },
        [PUBLIC_LIGHTING_FIELD]: { valor_rs: '5,00' },
      }),
    ).toThrow('invalid month reference format');
  });
});
