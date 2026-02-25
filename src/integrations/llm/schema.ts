import { z } from 'zod';

export const CLIENT_NUMBER_FIELD = 'N\u00BA DO CLIENTE';
export const REFERENCE_MONTH_FIELD = 'M\u00EAs de refer\u00EAncia';
export const ELECTRIC_ENERGY_FIELD = 'Energia El\u00E9trica';
export const SCEEE_ENERGY_FIELD = 'Energia SCEEE s/ICMS';
export const GD_COMPENSATED_ENERGY_FIELD = 'Energia compensada GD I';
export const PUBLIC_LIGHTING_FIELD = 'Contrib Ilum Publica Municipal';

const nullableValue = z.union([z.string(), z.number(), z.null()]);

const energiaSchema = z
  .object({
    quantidade_kwh: nullableValue,
    valor_rs: nullableValue,
  })
  .strict();

export const extractedInvoiceSchema = z
  .object({
    [CLIENT_NUMBER_FIELD]: z.union([z.string(), z.null()]),
    [REFERENCE_MONTH_FIELD]: z.union([z.string(), z.null()]),
    [ELECTRIC_ENERGY_FIELD]: energiaSchema,
    [SCEEE_ENERGY_FIELD]: energiaSchema,
    [GD_COMPENSATED_ENERGY_FIELD]: energiaSchema,
    [PUBLIC_LIGHTING_FIELD]: z
      .object({
        valor_rs: nullableValue,
      })
      .strict(),
  })
  .strict();

export type ExtractedInvoiceJson = z.infer<typeof extractedInvoiceSchema>;

export const INVOICE_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    CLIENT_NUMBER_FIELD,
    REFERENCE_MONTH_FIELD,
    ELECTRIC_ENERGY_FIELD,
    SCEEE_ENERGY_FIELD,
    GD_COMPENSATED_ENERGY_FIELD,
    PUBLIC_LIGHTING_FIELD,
  ],
  properties: {
    [CLIENT_NUMBER_FIELD]: { type: ['string', 'null'] },
    [REFERENCE_MONTH_FIELD]: { type: ['string', 'null'] },
    [ELECTRIC_ENERGY_FIELD]: {
      type: 'object',
      additionalProperties: false,
      required: ['quantidade_kwh', 'valor_rs'],
      properties: {
        quantidade_kwh: { type: ['string', 'number', 'null'] },
        valor_rs: { type: ['string', 'number', 'null'] },
      },
    },
    [SCEEE_ENERGY_FIELD]: {
      type: 'object',
      additionalProperties: false,
      required: ['quantidade_kwh', 'valor_rs'],
      properties: {
        quantidade_kwh: { type: ['string', 'number', 'null'] },
        valor_rs: { type: ['string', 'number', 'null'] },
      },
    },
    [GD_COMPENSATED_ENERGY_FIELD]: {
      type: 'object',
      additionalProperties: false,
      required: ['quantidade_kwh', 'valor_rs'],
      properties: {
        quantidade_kwh: { type: ['string', 'number', 'null'] },
        valor_rs: { type: ['string', 'number', 'null'] },
      },
    },
    [PUBLIC_LIGHTING_FIELD]: {
      type: 'object',
      additionalProperties: false,
      required: ['valor_rs'],
      properties: {
        valor_rs: { type: ['string', 'number', 'null'] },
      },
    },
  },
} as const;
