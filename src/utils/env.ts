// Runtime and Build-time Environment Helper
export function getEnv(key: string, defaultValue: string = ''): string {
  // 1. Check window.__ENV__ (injected dynamically by Docker container entrypoint)
  if (typeof window !== 'undefined' && (window as any).__ENV__ && (window as any).__ENV__[key] !== undefined) {
    const val = (window as any).__ENV__[key];
    if (val !== undefined && val !== null && val !== '') {
      return val;
    }
  }

  // 2. Check import.meta.env (baked at build-time by Vite)
  const metaVal = (import.meta as any).env?.[key];
  if (metaVal !== undefined && metaVal !== null && metaVal !== '') {
    return metaVal;
  }

  return defaultValue;
}

/**
 * Resolves the Taiga API base URL.
 * Supports official Taiga variables (TAIGA_URL, TAIGA_SUBPATH) as well as VITE_API_BASE_URL.
 */
export function getApiBaseUrl(): string {
  const directApi = getEnv('VITE_API_BASE_URL');
  if (directApi) {
    return directApi.replace(/\/+$/, '');
  }

  const taigaUrl = getEnv('TAIGA_URL');
  if (taigaUrl) {
    const cleanUrl = taigaUrl.replace(/\/+$/, '');
    const rawSubpath = getEnv('TAIGA_SUBPATH', '');
    const cleanSubpath = rawSubpath
      ? (rawSubpath.startsWith('/') ? rawSubpath : `/${rawSubpath}`).replace(/\/+$/, '')
      : '';
    return `${cleanUrl}${cleanSubpath}/api/v1`;
  }

  return '/api/v1';
}

/**
 * Resolves the Taiga WebSockets Events URL.
 * Supports official Taiga variables (TAIGA_WEBSOCKETS_URL, TAIGA_SUBPATH) as well as VITE_EVENTS_URL.
 */
export function getEventsUrl(): string {
  const directEvents = getEnv('VITE_EVENTS_URL');
  if (directEvents) {
    return directEvents.replace(/\/+$/, '');
  }

  const wsUrl = getEnv('TAIGA_WEBSOCKETS_URL');
  if (wsUrl) {
    const cleanWs = wsUrl.replace(/\/+$/, '');
    const rawSubpath = getEnv('TAIGA_SUBPATH', '');
    const cleanSubpath = rawSubpath
      ? (rawSubpath.startsWith('/') ? rawSubpath : `/${rawSubpath}`).replace(/\/+$/, '')
      : '';
    return `${cleanWs}${cleanSubpath}/events`;
  }

  const defaultWsProtocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const defaultWsHost = typeof window !== 'undefined' ? window.location.host : 'localhost:8000';
  return `${defaultWsProtocol}//${defaultWsHost}/events`;
}

