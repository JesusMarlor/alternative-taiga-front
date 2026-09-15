import { getEnv } from '../utils/env';

const API_BASE = getEnv('VITE_API_BASE_URL', '/api/v1');

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getSessionId(): string {
  let sid = sessionStorage.getItem('taiga_session_id');
  if (!sid) {
    sid = 'sid_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('taiga_session_id', sid);
  }
  return sid;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('taiga_token');
  const sessionId = getSessionId();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('x-session-id')) {
    headers.set('x-session-id', sessionId);
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${cleanEndpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If unauthorized and not on auth endpoint, notify or clear
    if (!endpoint.includes('/auth')) {
      console.warn('Authentication token expired or invalid');
    }
  }

  if (!response.ok) {
    let errorData = null;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    const message = (errorData && (errorData._error_message || errorData.detail || errorData.message)) 
      || `Error HTTP ${response.status}: ${response.statusText}`;
    throw new ApiError(response.status, message, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}
