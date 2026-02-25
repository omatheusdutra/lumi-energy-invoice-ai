export interface ExtractedValues {
  numeroCliente: string;
  mesReferencia: string;
  mesReferenciaDate: Date;
  energiaEletricaKwh: number;
  energiaEletricaRs: number;
  energiaSceeeKwh: number;
  energiaSceeeRs: number;
  energiaCompensadaGdiKwh: number;
  energiaCompensadaGdiRs: number;
  contribIlumRs: number;
}

export interface DerivedValues {
  consumoKwh: number;
  energiaCompensadaKwh: number;
  valorTotalSemGd: number;
  economiaGdRs: number;
}

export type InvoiceCreateInput = ExtractedValues &
  DerivedValues & {
    sourceFilename: string;
    hashSha256: string;
    dedupCompositeKey: string;
  };

export interface InvoiceFilters {
  numeroCliente?: string;
  mesReferencia?: string;
  periodoInicio?: Date;
  periodoFim?: Date;
}

export interface Pagination {
  page: number;
  pageSize: number;
}
