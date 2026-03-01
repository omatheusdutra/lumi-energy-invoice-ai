import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { webEnv } from '@/lib/env';
import { ApiError } from '@/lib/api/api-error';
import { sanitizeText } from '@/lib/security/sanitize';

interface ApiErrorPayload {
  message?: string;
}

function buildRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === 'string') {
    const cleaned = sanitizeText(payload);
    return cleaned.length > 0 ? cleaned : fallback;
  }

  if (payload && typeof payload === 'object' && 'message' in payload) {
    const candidate = (payload as ApiErrorPayload).message;
    if (typeof candidate === 'string') {
      const cleaned = sanitizeText(candidate);
      return cleaned.length > 0 ? cleaned : fallback;
    }
  }

  return fallback;
}

export const httpClient = axios.create({
  baseURL: webEnv.NEXT_PUBLIC_API_BASE_URL,
  timeout: 20_000,
  // This frontend authenticates via Bearer token header, not cookie session.
  // Keep credentials off to avoid CORS credential mismatches across localhost ports.
  withCredentials: false,
  headers: {
    Accept: 'application/json',
  },
});

httpClient.interceptors.request.use((config) => {
  const headers = config.headers ?? {};
  headers['X-Request-Id'] = buildRequestId();

  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('lumi_access_token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  config.headers = headers;
  return config;
});

httpClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<unknown>) => {
    if (error instanceof ApiError) {
      return Promise.reject(error);
    }

    const status = error.response?.status ?? 0;
    const fallback =
      status > 0
        ? `HTTP error ${status}`
        : 'Network error (possible CORS/config mismatch between web and API)';
    const message = extractErrorMessage(error.response?.data ?? error.message, fallback);
    const safeMessage = sanitizeText(message) || fallback;

    return Promise.reject(new ApiError(safeMessage, status, error.response?.data));
  },
);

export async function requestWithSchema<T>(
  config: AxiosRequestConfig,
  parse: (payload: unknown) => T,
): Promise<T> {
  const response = await httpClient.request<unknown>(config);
  return parse(response.data);
}
