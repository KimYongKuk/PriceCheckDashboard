import { useQuery } from '@tanstack/react-query';
import * as dashboardService from '../services/dashboardService';

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: dashboardService.getDashboardSummary,
    refetchInterval: 60000,
  });
}
