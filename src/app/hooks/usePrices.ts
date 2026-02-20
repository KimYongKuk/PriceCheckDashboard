import { useQuery } from '@tanstack/react-query';
import * as priceService from '../services/priceService';

export function usePriceHistory(productId: number, days: number = 30) {
  return useQuery({
    queryKey: ['priceHistory', productId, days],
    queryFn: () => priceService.getPriceHistory(productId, days),
    enabled: productId > 0,
  });
}

export function useLatestPrices(productId: number) {
  return useQuery({
    queryKey: ['latestPrices', productId],
    queryFn: () => priceService.getLatestPrices(productId),
    enabled: productId > 0,
  });
}

export function usePriceStats(productId: number, days: number = 30) {
  return useQuery({
    queryKey: ['priceStats', productId, days],
    queryFn: () => priceService.getPriceStats(productId, days),
    enabled: productId > 0,
  });
}

export function useRecentCollections(limit: number = 10) {
  return useQuery({
    queryKey: ['recentCollections', limit],
    queryFn: () => priceService.getRecentCollections(limit),
  });
}
