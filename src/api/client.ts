import { getApiBaseUrl } from '../utils/env';

export const API_BASE = getApiBaseUrl();

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

let refreshPromise: Promise<boolean> | null = null;

// Taiga access tokens expire (24h by default); swap the refresh token for a new pair once, shared by concurrent 401s
function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refresh = localStorage.getItem('taiga_refresh');
      if (!refresh) return false;
      try {
        const res = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        localStorage.setItem('taiga_token', data.auth_token);
        if (data.refresh) localStorage.setItem('taiga_refresh', data.refresh);
        return true;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function expireSession() {
  localStorage.removeItem('taiga_token');
  localStorage.removeItem('taiga_refresh');
  localStorage.removeItem('taiga_user');
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
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

  // Taiga paginates list endpoints server-side; without this only the first page is returned
  if ((!options.method || options.method.toUpperCase() === 'GET') && !headers.has('x-disable-pagination')) {
    headers.set('x-disable-pagination', '1');
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const base = getApiBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${base}${cleanEndpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && token && !endpoint.startsWith('/auth')) {
    if (!isRetry && (await refreshAccessToken())) {
      return apiRequest<T>(endpoint, options, true);
    }
    expireSession();
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
