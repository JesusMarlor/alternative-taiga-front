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
