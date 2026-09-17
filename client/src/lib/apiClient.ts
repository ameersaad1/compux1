import type { ApiError } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

export class ApiClientError extends Error {
  status: number;
  code?: string;
  error?: string;
  details?: ApiError['details'];
  /** Raw response body, in case a specific endpoint attaches extra fields (e.g. `userId`). */
  body: Record<string, unknown>;

  constructor(status: number, body: Record<string, unknown>) {
    const message = typeof body.error === 'string' ? body.error : 'حدث خطأ غير متوقع';
    super(message);
    this.status = status;
    this.error = message;
    this.code = typeof body.code === 'string' ? body.code : undefined;
    this.details = body.details as ApiError['details'];
    this.body = body;
  }
}

/**
 * A single fetch wrapper for the whole app: always sends credentials (the
 * httpOnly auth cookies), always parses JSON, and transparently retries a
 * request exactly once after refreshing the access token on a 401 - so
 * individual API modules never have to think about token expiry.
 */
class ApiClient {
  private refreshPromise: Promise<boolean> | null = null;

  async request<T>(path: string, options: RequestInit = {}, isRetry = false): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });

    if (res.status === 401 && !isRetry && path !== '/auth/refresh' && path !== '/auth/login') {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) return this.request<T>(path, options, true);
    }

    if (res.status === 204) return undefined as T;

    const body = (await res.json().catch(() => ({ error: 'استجابة غير متوقعة من الخادم.' }))) as Record<string, unknown>;
    if (!res.ok) throw new ApiClientError(res.status, body);
    return body as T;
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshPromise) {
      this.refreshPromise = fetch(`${BASE_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
        .then((r) => r.ok)
        .catch(() => false)
        .finally(() => {
          this.refreshPromise = null;
        });
    }
    return this.refreshPromise;
  }

  get<T>(path: string) {
    return this.request<T>(path, { method: 'GET' });
  }
  post<T>(path: string, data?: unknown) {
    return this.request<T>(path, { method: 'POST', body: data ? JSON.stringify(data) : undefined });
  }
  patch<T>(path: string, data?: unknown) {
    return this.request<T>(path, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined });
  }
  delete<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
