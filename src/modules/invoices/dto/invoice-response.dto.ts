export interface InvoiceResponseDto {
  id: string;
  numeroCliente: string;
  mesReferencia: string;
  consumoKwh: number;
  valorTotalSemGd: number;
  economiaGdRs: number;
  sourceFilename: string;
  createdAt: Date;
}
