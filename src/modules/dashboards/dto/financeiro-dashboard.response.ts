export interface FinanceiroDashboardResponse {
  valor_total_sem_gd_total: number;
  economia_gd_total: number;
  series: Array<{ mes_referencia: string; valor_total_sem_gd: number; economia_gd: number }>;
}
