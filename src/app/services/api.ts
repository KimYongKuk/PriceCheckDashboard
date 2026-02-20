const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000');

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
    public errorCode: string
  ) {
    super(detail);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: 'Unknown error',
      error_code: 'UNKNOWN',
    }));
    throw new ApiError(response.status, error.detail, error.error_code);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export const api = { request };
