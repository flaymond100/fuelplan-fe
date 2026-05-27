import { supabase } from './supabase';

function getApiBase(): string {
  const base = import.meta.env.VITE_API_BASE_URL;
  if (!base) {
    throw new Error('Missing VITE_API_BASE_URL env var');
  }
  return base;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  // For FormData, let the browser set Content-Type (with the multipart boundary).
  const isFormData = init.body instanceof FormData;

  const res = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const detail =
      (body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : null) ?? res.statusText;
    throw new Error(`${res.status} ${detail}`);
  }

  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  postForm: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: 'POST', body: formData }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

/** Extracts the leading HTTP status from an error thrown by the api wrapper (e.g. "402 ..."). */
export function errorStatus(err: unknown): number | null {
  if (!(err instanceof Error)) return null;
  const match = err.message.match(/^(\d{3})\b/);
  return match ? Number(match[1]) : null;
}
