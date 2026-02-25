export interface EnergiaDashboardResponse {
  consumo_kwh_total: number;
  energia_compensada_kwh_total: number;
  series: Array<{ mes_referencia: string; consumo_kwh: number; energia_compensada_kwh: number }>;
}
