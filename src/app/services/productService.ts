import { api } from './api';

export interface ProductResponse {
  id: number;
  keyword: string;
  target_price: number | null;
  memo: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  latest_price: number | null;
  latest_shop: string | null;
  latest_url: string | null;
  latest_collected_at: string | null;
  status: 'goal_reached' | 'monitoring' | 'no_target';
  price_change: number | null;
  price_change_rate: number | null;
}

export interface ProductCreateRequest {
  keyword: string;
  target_price?: number | null;
  memo?: string | null;
}

export interface ProductUpdateRequest {
  target_price?: number | null;
  memo?: string | null;
  is_active?: boolean;
}

export async function getProducts(search?: string, status?: string): Promise<ProductResponse[]> {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (status) params.set('status', status);
  const query = params.toString() ? `?${params}` : '';
  return api.request<ProductResponse[]>(`/products${query}`);
}

export async function createProduct(data: ProductCreateRequest): Promise<ProductResponse> {
  return api.request<ProductResponse>('/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProduct(id: number, data: ProductUpdateRequest): Promise<ProductResponse> {
  return api.request<ProductResponse>(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteProduct(id: number): Promise<void> {
  return api.request<void>(`/products/${id}`, { method: 'DELETE' });
}
