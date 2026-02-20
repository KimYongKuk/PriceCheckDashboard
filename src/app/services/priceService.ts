import { api } from './api';

export interface PriceHistoryItem {
  date: string;
  min_price: number;
  max_price: number;
  shop: string | null;
  url: string | null;
  collected_count: number;
}

export interface ShopPrice {
  shop_name: string;
  price: number;
  url: string | null;
}

export interface LatestPriceResponse {
  product_id: number;
  keyword: string;
  min_price: number | null;
  shop: string | null;
  url: string | null;
  collected_at: string | null;
  shops: ShopPrice[];
}

export interface PriceStatsResponse {
  product_id: number;
  period_days: number;
  min_price: number;
  max_price: number;
  avg_price: number;
  current_price: number;
  price_at_start: number;
  change_from_start: number;
  change_rate_from_start: number;
  lowest_shop: string;
  data_count: number;
}

export interface RecentCollection {
  id: number;
  product_name: string;
  shop: string;
  price: number;
  previous_price: number;
  collected_at: string;
}

export async function getPriceHistory(productId: number, days: number = 30): Promise<PriceHistoryItem[]> {
  return api.request<PriceHistoryItem[]>(`/prices/${productId}?days=${days}`);
}

export async function getLatestPrices(productId: number): Promise<LatestPriceResponse> {
  return api.request<LatestPriceResponse>(`/prices/${productId}/latest`);
}

export async function getPriceStats(productId: number, days: number = 30): Promise<PriceStatsResponse> {
  return api.request<PriceStatsResponse>(`/prices/${productId}/stats?days=${days}`);
}

export async function getRecentCollections(limit: number = 10): Promise<RecentCollection[]> {
  return api.request<RecentCollection[]>(`/prices/recent?limit=${limit}`);
}
