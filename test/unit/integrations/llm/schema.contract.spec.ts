import {
  CLIENT_NUMBER_FIELD,
  ELECTRIC_ENERGY_FIELD,
  GD_COMPENSATED_ENERGY_FIELD,
  INVOICE_JSON_SCHEMA,
  PUBLIC_LIGHTING_FIELD,
  REFERENCE_MONTH_FIELD,
  SCEEE_ENERGY_FIELD,
  extractedInvoiceSchema,
} from '../../../../src/integrations/llm/schema';

describe('LLM schema contract', () => {
  it('defines exactly the required field names from the edital', () => {
    const expectedFields = [
      CLIENT_NUMBER_FIELD,
      REFERENCE_MONTH_FIELD,
      ELECTRIC_ENERGY_FIELD,
      SCEEE_ENERGY_FIELD,
      GD_COMPENSATED_ENERGY_FIELD,
      PUBLIC_LIGHTING_FIELD,
    ];

    expect(INVOICE_JSON_SCHEMA.required).toEqual(expectedFields);
    expect(Object.keys(INVOICE_JSON_SCHEMA.properties)).toEqual(expectedFields);
  });

  it('rejects additional properties in strict schema', () => {
    const validPayload = {
      [CLIENT_NUMBER_FIELD]: '3001116735',
      [REFERENCE_MONTH_FIELD]: 'SET/2024',
      [ELECTRIC_ENERGY_FIELD]: {
        quantidade_kwh: '100',
        valor_rs: '50,00',
      },
      [SCEEE_ENERGY_FIELD]: {
        quantidade_kwh: '20',
        valor_rs: '10,00',
      },
      [GD_COMPENSATED_ENERGY_FIELD]: {
        quantidade_kwh: '30',
        valor_rs: '15,00',
      },
      [PUBLIC_LIGHTING_FIELD]: {
        valor_rs: '5,00',
      },
    };

    expect(() =>
      extractedInvoiceSchema.parse({
        ...validPayload,
        extra_field_not_allowed: 'boom',
      }),
    ).toThrow();
  });

  it('rejects additional properties inside nested objects', () => {
    expect(() =>
      extractedInvoiceSchema.parse({
        [CLIENT_NUMBER_FIELD]: '3001116735',
        [REFERENCE_MONTH_FIELD]: 'SET/2024',
        [ELECTRIC_ENERGY_FIELD]: {
          quantidade_kwh: '100',
          valor_rs: '50,00',
          extra_nested: 'boom',
        },
        [SCEEE_ENERGY_FIELD]: {
          quantidade_kwh: '20',
          valor_rs: '10,00',
        },
        [GD_COMPENSATED_ENERGY_FIELD]: {
          quantidade_kwh: '30',
          valor_rs: '15,00',
        },
        [PUBLIC_LIGHTING_FIELD]: {
          valor_rs: '5,00',
        },
      }),
    ).toThrow();
  });
});
