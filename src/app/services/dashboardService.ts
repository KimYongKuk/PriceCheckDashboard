import { api } from './api';

export interface DashboardSummary {
  total_products: number;
  goal_reached_count: number;
  today_collected_count: number;
  avg_saving_rate: number;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return api.request<DashboardSummary>('/dashboard/summary');
}
