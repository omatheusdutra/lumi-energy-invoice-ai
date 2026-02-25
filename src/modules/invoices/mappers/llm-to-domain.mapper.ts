import { UnprocessableEntityException } from '@nestjs/common';
import { normalizeMesReferencia, mesReferenciaToDate } from '../../../common/utils/dates';
import { parseMoney } from '../../../common/utils/money';
import { parseLocaleNumber, roundToTwo } from '../../../common/utils/numbers';
import {
  CLIENT_NUMBER_FIELD,
  ELECTRIC_ENERGY_FIELD,
  type ExtractedInvoiceJson,
  GD_COMPENSATED_ENERGY_FIELD,
  PUBLIC_LIGHTING_FIELD,
  REFERENCE_MONTH_FIELD,
  SCEEE_ENERGY_FIELD,
} from '../../../integrations/llm/prompt';
import { ExtractedValues } from '../invoice.types';

export function mapExtractedInvoiceToDomain(data: ExtractedInvoiceJson): ExtractedValues {
  const numeroCliente = data[CLIENT_NUMBER_FIELD]?.trim();
  const mesReferenciaRaw = data[REFERENCE_MONTH_FIELD]?.trim();

  if (!numeroCliente || !mesReferenciaRaw) {
    throw new UnprocessableEntityException('LLM returned incomplete required fields');
  }

  let mesReferencia: string;
  try {
    mesReferencia = normalizeMesReferencia(mesReferenciaRaw);
  } catch {
    throw new UnprocessableEntityException('LLM returned invalid month reference format');
  }

  const energiaEletricaKwh = roundToTwo(
    parseLocaleNumber(data[ELECTRIC_ENERGY_FIELD].quantidade_kwh),
  );
  const energiaEletricaRs = parseMoney(data[ELECTRIC_ENERGY_FIELD].valor_rs);
  const energiaSceeeKwh = roundToTwo(parseLocaleNumber(data[SCEEE_ENERGY_FIELD].quantidade_kwh));
  const energiaSceeeRs = parseMoney(data[SCEEE_ENERGY_FIELD].valor_rs);
  const energiaCompensadaGdiKwhRaw = roundToTwo(
    parseLocaleNumber(data[GD_COMPENSATED_ENERGY_FIELD].quantidade_kwh),
  );
  const energiaCompensadaGdiRsRaw = parseMoney(data[GD_COMPENSATED_ENERGY_FIELD].valor_rs);
  // Algumas faturas apresentam a compensacao GD como credito negativo.
  // Normalizamos para modulo para manter o dominio consistente com "economia".
  const energiaCompensadaGdiKwh = roundToTwo(Math.abs(energiaCompensadaGdiKwhRaw));
  const energiaCompensadaGdiRs = roundToTwo(Math.abs(energiaCompensadaGdiRsRaw));
  const contribIlumRs = parseMoney(data[PUBLIC_LIGHTING_FIELD].valor_rs);
  const nonCompensationValues = [
    energiaEletricaKwh,
    energiaEletricaRs,
    energiaSceeeKwh,
    energiaSceeeRs,
    contribIlumRs,
  ];
  if (nonCompensationValues.some((value) => value < 0)) {
    throw new UnprocessableEntityException('LLM returned invalid negative numeric values');
  }

  return {
    numeroCliente,
    mesReferencia,
    mesReferenciaDate: mesReferenciaToDate(mesReferencia),
    energiaEletricaKwh,
    energiaEletricaRs,
    energiaSceeeKwh,
    energiaSceeeRs,
    energiaCompensadaGdiKwh,
    energiaCompensadaGdiRs,
    contribIlumRs,
  };
}
