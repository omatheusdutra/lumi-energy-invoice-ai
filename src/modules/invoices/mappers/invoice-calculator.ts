import { roundToTwo } from '../../../common/utils/numbers';
import { DerivedValues, ExtractedValues } from '../invoice.types';

export function calculateDerivedValues(input: ExtractedValues): DerivedValues {
  return {
    consumoKwh: roundToTwo(input.energiaEletricaKwh + input.energiaSceeeKwh),
    energiaCompensadaKwh: roundToTwo(input.energiaCompensadaGdiKwh),
    valorTotalSemGd: roundToTwo(
      input.energiaEletricaRs + input.energiaSceeeRs + input.contribIlumRs,
    ),
    economiaGdRs: roundToTwo(input.energiaCompensadaGdiRs),
  };
}
